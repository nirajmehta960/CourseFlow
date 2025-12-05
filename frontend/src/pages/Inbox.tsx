import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Mail,
  MailOpen,
  Star,
  Send,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  toggleStar,
  Conversation,
  Message,
} from "@/lib/inbox-api";
import { getMyCourses, Course } from "@/lib/courses-api";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";

type Filter = "all" | "unread" | "starred";

const Inbox = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchCourses();
  }, [filter, searchQuery]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchCourses = async () => {
    try {
      const coursesList = await getMyCourses();
      const coursesMap = new Map<string, Course>();
      coursesList.forEach((course) => {
        coursesMap.set(course.id, course);
      });
      setCourses(coursesMap);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations(filter, searchQuery || undefined);
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      
      // Mark conversation as read
      await markConversationRead(conversationId);
      
      // Update conversation in list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, hasUnread: false } : conv
        )
      );
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setSending(true);
      const message = await sendMessage(selectedConversation.id, {
        body: newMessage.trim(),
      });
      
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      
      // Update conversation last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessagePreview: message.body.substring(0, 100),
                lastMessageAt: message.createdAt,
                hasUnread: false,
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleToggleStar = async (messageId: string) => {
    try {
      const updatedMessage = await toggleStar(messageId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
      );
    } catch (error) {
      console.error("Failed to toggle star:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const getConversationTitle = (conversation: Conversation): string => {
    if (conversation.title) return conversation.title;
    if (conversation.courseId) {
      const course = courses.get(conversation.courseId);
      return course ? `${course.code} - ${course.title}` : "Course Conversation";
    }
    // Direct message - show other participants
    const otherParticipants = conversation.participantIds.filter(
      (id) => id !== user?.id
    );
    return otherParticipants.length > 0
      ? `${otherParticipants.length} participant${otherParticipants.length > 1 ? "s" : ""}`
      : "Conversation";
  };

  const getSenderName = (senderId: string): string => {
    if (senderId === user?.id) return "You";
    // In a real app, you'd fetch user details by ID
    // For now, show a truncated ID
    return senderId.substring(0, 8) + "...";
  };

  const unreadCount = conversations.filter((c) => c.hasUnread).length;

  return (
    <div className="w-full min-h-full bg-background overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Inbox
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {unreadCount} unread {unreadCount === 1 ? "conversation" : "conversations"}
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <div className="lg:col-span-1 flex flex-col border border-border rounded-lg bg-card overflow-hidden">
            {/* Search and filters */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("unread")}
                >
                  Unread
                </Button>
                <Button
                  variant={filter === "starred" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("starred")}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Starred
                </Button>
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-12 w-12" />}
                  title="No conversations"
                  description="You don't have any conversations yet. Start a new conversation to get started."
                />
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                        !conversation.hasUnread && "bg-muted/20",
                        selectedConversation?.id === conversation.id && "bg-primary/10 border-l-4 border-l-primary"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-1">
                          {conversation.hasUnread ? (
                            <Mail className="h-4 w-4 text-primary" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={cn(
                                "text-sm truncate",
                                conversation.hasUnread
                                  ? "font-semibold text-foreground"
                                  : "text-foreground"
                              )}
                            >
                              {getConversationTitle(conversation)}
                            </span>
                            {conversation.hasUnread && (
                              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center">
                                !
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessagePreview && (
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessagePreview}
                            </p>
                          )}
                          {conversation.lastMessageAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(parseISO(conversation.lastMessageAt), {
                                addSuffix: true,
                              })}
                            </p>
                          )}
                          {conversation.courseId && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {courses.get(conversation.courseId)?.code || "Course"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className="lg:col-span-2 flex flex-col border border-border rounded-lg bg-card overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground">
                        {getConversationTitle(selectedConversation)}
                      </h2>
                      {selectedConversation.courseId && (
                        <Badge variant="secondary" className="mt-1">
                          {courses.get(selectedConversation.courseId)?.code || "Course"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConversation.participantIds.length > 1 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{selectedConversation.participantIds.length} participants</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <EmptyState
                      icon={<MessageSquare className="h-12 w-12" />}
                      title="No messages yet"
                      description="Start the conversation by sending a message below."
                    />
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            isOwnMessage && "flex-row-reverse"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {getSenderName(message.senderId)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleStar(message.id)}
                                  className="hover:opacity-70"
                                >
                                  <Star
                                    className={cn(
                                      "h-3 w-3",
                                      message.isStarred && "fill-warning text-warning"
                                    )}
                                  />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.body}
                            </p>
                            <p
                              className={cn(
                                "text-xs mt-2",
                                isOwnMessage
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(parseISO(message.createdAt), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={3}
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Mail className="h-12 w-12" />}
                title="Select a conversation"
                description="Choose a conversation from the list to view and send messages."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
