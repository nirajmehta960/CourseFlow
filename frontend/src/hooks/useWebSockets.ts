import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAccessToken } from '../lib/api';

const WEBSOCKET_URL = '/api/ws';
const SOCKJS_URL = '/api/ws';

export const useWebSockets = (userId: string | undefined) => {
    const clientRef = useRef<Client | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) {
            if (clientRef.current) {
                clientRef.current.deactivate();
                clientRef.current = null;
            }
            return;
        }

        const token = getAccessToken();

        const client = new Client({
            webSocketFactory: () => new SockJS(SOCKJS_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => {
                if (import.meta.env.DEV) console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected to WebSocket: ' + frame);

            // Subscribe to user notifications
            client.subscribe(`/user/queue/notifications`, (message) => {
                const notification = JSON.parse(message.body);
                console.log('Received notification:', notification);

                // Invalidate notifications query
                queryClient.invalidateQueries({ queryKey: ['notifications'] });

                // Show toast
                toast.info(notification.title, {
                    description: notification.body,
                });
            });

            // Subscribe to user messages (Momento-style: update cache directly for real-time UI)
            client.subscribe(`/user/queue/messages`, (message) => {
                const inboxMessage = JSON.parse(message.body) as {
                    id: string;
                    threadId: string;
                    senderId: string;
                    senderName?: string;
                    body: string;
                    createdAt: string;
                };
                const threadId = inboxMessage.threadId;
                const preview = inboxMessage.body?.length > 100
                    ? inboxMessage.body.substring(0, 97) + '...'
                    : inboxMessage.body ?? '';
                const createdAt = typeof inboxMessage.createdAt === 'string'
                    ? inboxMessage.createdAt
                    : inboxMessage.createdAt != null
                        ? new Date(inboxMessage.createdAt as string | number).toISOString()
                        : new Date().toISOString();

                // 1. Update messages cache: append new message with deduplication (avoid duplicates from send + WebSocket)
                queryClient.setQueryData<Array<{ id: string; threadId: string; senderId: string; body: string; createdAt: string; [k: string]: unknown }>>(
                    ['messages', threadId],
                    (old) => {
                        const list = old ?? [];
                        const exists = list.some(
                            (m) => m.id === inboxMessage.id || (m.id?.startsWith?.('temp-') && m.body === inboxMessage.body && m.senderId === inboxMessage.senderId)
                        );
                        if (exists) {
                            return list.map((m) =>
                                m.id?.startsWith?.('temp-') && m.body === inboxMessage.body && m.senderId === inboxMessage.senderId
                                    ? { ...m, ...inboxMessage, id: inboxMessage.id, createdAt }
                                    : m
                            );
                        }
                        return [...list, { ...inboxMessage, createdAt } as { id: string; threadId: string; senderId: string; body: string; createdAt: string; [k: string]: unknown }];
                    }
                );

                // 2. Update threads cache: refresh preview, hasUnread, and move conversation to top (most recent first)
                const isFromOther = inboxMessage.senderId !== userId;
                queryClient.setQueriesData<Array<{ id: string; lastMessagePreview?: string; lastMessageAt: string; hasUnread?: boolean; [k: string]: unknown }>>(
                    { queryKey: ['threads'] },
                    (old) => {
                        if (!Array.isArray(old)) return old;
                        const idx = old.findIndex((c) => c.id === threadId);
                        if (idx < 0) {
                            queryClient.invalidateQueries({ queryKey: ['threads'] });
                            return old;
                        }
                        const conv = old[idx];
                        const updated = {
                            ...conv,
                            lastMessagePreview: preview,
                            lastMessageAt: createdAt,
                            hasUnread: isFromOther ? true : (conv.hasUnread ?? false),
                        };
                        const rest = old.slice(0, idx).concat(old.slice(idx + 1));
                        return [updated, ...rest];
                    }
                );

                // Show toast if not on inbox page or different thread
                if (!window.location.pathname.includes('/inbox')) {
                    toast.success(`New Message from ${inboxMessage.senderName ?? 'Someone'}`, {
                        description: inboxMessage.body?.length > 50
                            ? inboxMessage.body.substring(0, 47) + '...'
                            : inboxMessage.body ?? '',
                    });
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();
        clientRef.current = client;

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [userId, queryClient]);

    return clientRef.current;
};
