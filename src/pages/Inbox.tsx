import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  MailOpen,
  Star,
  Trash2,
  Archive,
  Clock,
  Bell,
  MessageSquare,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const messages = [
  {
    id: 1,
    sender: "Dr. Sarah Chen",
    subject: "Assignment 4 Extension Request Approved",
    preview: "Hi, I've reviewed your request and approved a 2-day extension for Assignment 4...",
    course: "RS101",
    time: "2 hours ago",
    read: false,
    starred: true,
    type: "message",
  },
  {
    id: 2,
    sender: "System Notification",
    subject: "Quiz 3 Available Now",
    preview: "Quiz 3 for Web Application Development is now available. Due date: December 22...",
    course: "CS201",
    time: "5 hours ago",
    read: false,
    starred: false,
    type: "notification",
  },
  {
    id: 3,
    sender: "Prof. Michael Torres",
    subject: "Feedback on Project Proposal",
    preview: "Great work on your project proposal! I have a few suggestions for improvement...",
    course: "CS201",
    time: "1 day ago",
    read: true,
    starred: true,
    type: "message",
  },
  {
    id: 4,
    sender: "Dr. Emily Watson",
    subject: "Lab Report Guidelines Updated",
    preview: "Please note that the lab report guidelines have been updated. Make sure to review...",
    course: "CH301",
    time: "2 days ago",
    read: true,
    starred: false,
    type: "announcement",
  },
  {
    id: 5,
    sender: "System Notification",
    subject: "Grade Posted: Midterm Exam",
    preview: "Your grade for the Midterm Exam in Physical Chemistry has been posted...",
    course: "PH401",
    time: "3 days ago",
    read: true,
    starred: false,
    type: "grade",
  },
  {
    id: 6,
    sender: "Study Group",
    subject: "Meeting Tomorrow at 3 PM",
    preview: "Reminder: We have a study group meeting tomorrow at 3 PM in the library...",
    course: "RS101",
    time: "3 days ago",
    read: true,
    starred: false,
    type: "message",
  },
];

type Filter = "all" | "unread" | "starred";

const Inbox = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedMessage, setSelectedMessage] = useState<typeof messages[0] | null>(null);

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !msg.read) ||
      (filter === "starred" && msg.starred);
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "notification":
        return Bell;
      case "announcement":
        return MessageSquare;
      case "grade":
        return FileText;
      default:
        return Mail;
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Inbox
        </h1>
        <p className="text-muted-foreground mt-1">
          {unreadCount} unread messages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          {/* Search and filters */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
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

          {/* Messages */}
          <div className="space-y-2">
            {filteredMessages.map((message) => {
              const Icon = getTypeIcon(message.type);
              return (
                <Card
                  key={message.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !message.read && "bg-primary/5 border-l-4 border-l-primary",
                    selectedMessage?.id === message.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-1">
                        {message.read ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn(
                            "text-sm truncate",
                            !message.read ? "font-semibold text-foreground" : "text-foreground"
                          )}>
                            {message.sender}
                          </span>
                          <div className="flex items-center gap-1">
                            {message.starred && (
                              <Star className="h-3 w-3 fill-warning text-warning" />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {message.time}
                            </span>
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm truncate",
                          !message.read ? "font-medium text-foreground" : "text-muted-foreground"
                        )}>
                          {message.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {message.preview}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {message.course}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card className="h-full">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-border">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {selectedMessage.sender}
                      </span>
                      <span>•</span>
                      <Badge variant="secondary">{selectedMessage.course}</Badge>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{selectedMessage.time}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className={cn(
                        "h-4 w-4",
                        selectedMessage.starred && "fill-warning text-warning"
                      )} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground">
                    {selectedMessage.preview}
                  </p>
                  <p className="text-muted-foreground mt-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do 
                    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim 
                    ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                  <p className="text-muted-foreground mt-4">
                    Please let me know if you have any questions.
                  </p>
                  <p className="text-muted-foreground mt-4">
                    Best regards,<br />
                    {selectedMessage.sender}
                  </p>
                </div>

                {/* Reply */}
                <div className="mt-8 pt-4 border-t border-border">
                  <Button>Reply</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a message to read
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
