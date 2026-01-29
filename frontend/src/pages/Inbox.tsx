import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchCourses();
  }, [filter, searchQuery, courseFilter]);

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
      // Pass courseFilter if it's not "all"
      const courseIdParam = courseFilter === "all" ? undefined : courseFilter;
      const data = await getConversations(filter, searchQuery || undefined, courseIdParam);
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
              lastMessagePreview: message.body ? message.body.substring(0, 100) : "Attachment",
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

  const getInitials = (name?: any): string => {
    if (!name || typeof name !== 'string') return "U";
    if (name === "You") return "ME";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase();
  }

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
            {loading ? (
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-4 max-w-3xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                        isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                      )}>
                        {getInitials(isMe ? "You" : msg.senderName)}
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
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          fetchConversations().then(() => {
            if (newId) {
              getConversation(newId).then(conv => setSelectedConversation(conv));
            }
          });
        }}
      />
    </div >
  );
};

export default Inbox;
