import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Mail,
  MailOpen,
  Star,
  Send,
  MessageSquare,
  Plus,
  Users,
  Archive,
  Trash2,
  Reply,
  ReplyAll,
  MoreVertical
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  getConversations,
  getConversation,
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
import { ComposeMessageDialog } from "@/components/inbox/ComposeMessageDialog";

type Filter = "all" | "unread" | "starred";

const Inbox = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['threads', filter, searchQuery, courseFilter],
    queryFn: async () => {
      const courseIdParam = courseFilter === "all" ? undefined : courseFilter;
      return await getConversations(filter, searchQuery || undefined, courseIdParam);
    }
  });

  const { data: messagesRaw = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const data = await getMessages(selectedConversation.id);
      markConversationRead(selectedConversation.id);
      return data;
    },
    enabled: !!selectedConversation?.id,
  });

  // Dedupe by id and always sort by createdAt ascending (oldest first) so order is correct
  // after API load, optimistic updates, and WebSocket appends.
  const messages = useMemo(() => {
    const seen = new Set<string>();
    return messagesRaw
      .filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (tA !== tB) return tA - tB;
        // same millisecond: stable sort by id
        return (a.id || "").localeCompare(b.id || "");
      });
  }, [messagesRaw]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Scroll to bottom when messages change so latest message is visible
  useEffect(() => {
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

  const queryClient = useQueryClient();

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    const body = newMessage.trim();
    setNewMessage("");

    // Optimistic update (Momento-style): show message immediately, replace with real on success
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      threadId: selectedConversation.id,
      senderId: user?.id ?? "",
      body,
      createdAt: new Date().toISOString(),
      readBy: [],
      starredBy: [],
      isRead: true,
      isStarred: false,
    };
    queryClient.setQueryData<Message[]>(['messages', selectedConversation.id], (old) => [...(old ?? []), optimisticMessage]);
    const previewSnapshot = body.length > 100 ? body.substring(0, 97) + "..." : body;
    const nowIso = optimisticMessage.createdAt;
    queryClient.setQueryData<Conversation[]>(['threads', filter, searchQuery, courseFilter], (old) =>
      old?.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessagePreview: previewSnapshot, lastMessageAt: nowIso, hasUnread: false }
          : conv
      ) ?? []
    );
    setSelectedConversation((prev) =>
      prev?.id === selectedConversation.id
        ? { ...prev, lastMessagePreview: previewSnapshot, lastMessageAt: nowIso, hasUnread: false }
        : prev
    );

    try {
      setSending(true);
      const message = await sendMessage(selectedConversation.id, { body });

      // Replace optimistic message with real one from server (dedupe if WebSocket already added it)
      const preview = message.body.length > 100 ? message.body.substring(0, 97) + "..." : message.body;
      queryClient.setQueryData<Message[]>(['messages', selectedConversation.id], (old) => {
        const list = (old ?? []).filter((m) => !m.id.startsWith("temp-"));
        const exists = list.some((m) => m.id === message.id);
        return exists ? list : [...list, message];
      });
      queryClient.setQueryData<Conversation[]>(['threads', filter, searchQuery, courseFilter], (old) =>
        old?.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessagePreview: preview, lastMessageAt: message.createdAt, hasUnread: false }
            : conv
        ) ?? []
      );
      setSelectedConversation((prev) =>
        prev?.id === selectedConversation.id
          ? { ...prev, lastMessagePreview: preview, lastMessageAt: message.createdAt, hasUnread: false }
          : prev
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
      await toggleStar(messageId);
      // Invalidate messages query to reflect the star change
      // Note: We might want optimistic updates here for better UX, but invalidation is safer for now
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
      if (filter === 'starred') {
        queryClient.invalidateQueries({ queryKey: ['threads'] });
      }
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
    // If we have participant names, use them as the primary identifier (like Canvas)
    if (conversation.participantNames && conversation.participantNames.length > 0) {
      // Filter out "Me" unless it's only me
      const names = conversation.participantNames.filter(n => n !== "Me" && n !== user?.name);
      if (names.length > 0) return names.join(", ");
      return "Me";
    }

    // Fallback logic
    if (conversation.title) return conversation.title;

    const otherParticipants = conversation.participantIds.filter(id => id !== user?.id);
    return otherParticipants.length > 0
      ? `${otherParticipants.length} participant${otherParticipants.length > 1 ? "s" : ""}`
      : "Conversation";
  };

  const getConversationSubject = (conversation: Conversation): string => {
    // The "context" or subject line
    if (conversation.title) return conversation.title;
    if (conversation.courseId) {
      const course = courses.get(conversation.courseId);
      return course ? course.code : "Course Conversation";
    }
    return "No Subject";
  }

  const getSenderName = (senderId: string, msg?: Message): string => {
    if (!senderId) return "Unknown";
    if (senderId === user?.id) return "You";
    if (msg?.senderName) return msg.senderName;
    return senderId.substring(0, 8) + "...";
  };


  const unreadCount = conversations.filter((c) => c.hasUnread).length;

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-background overflow-hidden flex flex-col">
      {/* Canvas-like Header / Toolbar */}
      <div className="relative z-50 border-b border-border bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
          {/* Course Filter */}
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {Array.from(courses.values()).map(course => (
                <SelectItem key={course.id} value={course.id}>{course.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Inbox Filter */}
          <Select value={filter} onValueChange={(val) => setFilter(val as Filter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Inbox" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Inbox</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" title="Reply">
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Reply All">
            <ReplyAll className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Archive">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button onClick={() => setComposeOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Conversation List */}
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-border flex flex-col bg-background">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No conversations found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleConversationSelect(conv)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-transparent",
                      selectedConversation?.id === conv.id ? "bg-muted border-l-primary" : "",
                      conv.hasUnread ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={cn("text-sm font-semibold truncate pr-2", conv.hasUnread ? "text-foreground" : "text-foreground/80")}>
                        {getConversationTitle(conv)}
                      </h4>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {(() => {
                            try {
                              return format(parseISO(conv.lastMessageAt), "MMM d");
                            } catch (e) {
                              return "";
                            }
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground truncate block w-full">
                        {getConversationSubject(conv)}
                      </span>
                      {conv.hasUnread && <Badge variant="destructive" className="h-2 w-2 rounded-full p-0 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {conv.lastMessagePreview || "No messages yet"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Conversation Detail */}
        <div className="flex-1 flex flex-col bg-card h-full overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Message Thread Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold mb-1">{getConversationSubject(selectedConversation)}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {/* Avatar could go here */}
                  <span className="font-medium text-foreground">{getConversationTitle(selectedConversation)}</span>
                  <span>&bull;</span>
                  {selectedConversation.courseId && (
                    <Badge variant="secondary">{courses.get(selectedConversation.courseId)?.code}</Badge>
                  )}
                  <span>&bull;</span>
                  <span>{selectedConversation.participantIds.length} Participants</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5 min-h-0 flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <MessageSquare className="h-12 w-12 mb-2" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    // Sanitize and filter empty messages
                    const bodyText = msg.body ? msg.body.trim() : "";
                    if (!bodyText && (!msg.attachments || msg.attachments.length === 0)) {
                      return null;
                    }

                    return (
                      <div key={msg.id} className={cn("flex gap-4 max-w-3xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                          isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {getInitials(isMe ? user?.name : (msg.senderName && msg.senderName !== "Me" && msg.senderName !== "You" ? msg.senderName : msg.senderId))}
                        </div>
                        <div className={cn("space-y-1 min-w-0", isMe ? "items-end flex flex-col" : "")}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{getSenderName(msg.senderId, msg)}</span>
                            <span className="text-xs text-muted-foreground">
                              {msg.createdAt ? (() => {
                                try {
                                  return format(parseISO(msg.createdAt), "MMM d, h:mm a");
                                } catch (e) {
                                  return "Just now";
                                }
                              })() : "Just now"}
                            </span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-lg text-sm whitespace-pre-wrap break-words",
                            isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white border border-border rounded-tl-none shadow-sm"
                          )}>
                            {bodyText}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Area */}
              <div className="p-4 border-t border-border bg-background">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <Textarea
                    placeholder="Write a reply..."
                    className="min-h-[80px] resize-none"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 mt-auto shrink-0"
                    disabled={!newMessage.trim() || sending}
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Mail className="h-16 w-16 text-muted-foreground/30" />}
              title="No conversation selected"
              description="Select a conversation from the list to view messages."
            />
          )}
        </div>
      </div>

      <ComposeMessageDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        courses={Array.from(courses.values())}
        onMessageSent={(newId) => {
          queryClient.invalidateQueries({ queryKey: ['threads'] });
          if (newId) {
            // We can't easily wait for the invalidation to finish and return the new conv immediately here
            // But we can try to find it or fetch it explicitly if needed.
            // For now, let's just fetch the specific conversation to select it
            getConversation(newId).then(conv => setSelectedConversation(conv));
          }
        }}
      />
    </div >
  );
};

export default Inbox;
