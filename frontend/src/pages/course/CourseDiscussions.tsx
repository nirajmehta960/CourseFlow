import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  MessageSquare,
  Pin,
  ThumbsUp,
  Clock,
  ChevronRight,
  Filter,
  TrendingUp,
  Users,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Discussion {
  id: string;
  title: string;
  author: {
    name: string;
    avatar?: string;
    role: "instructor" | "ta" | "student";
  };
  content: string;
  replies: number;
  likes: number;
  pinned: boolean;
  timestamp: string;
  category: string;
  isNew?: boolean;
  lastReply?: string;
}

const discussions: Discussion[] = [
  {
    id: "1",
    title: "Question about Nozzle Design Assignment",
    author: { name: "John Doe", role: "student" },
    content: "I'm having trouble understanding the convergent-divergent nozzle calculations. Can someone explain the relationship between throat area and exit area for optimal expansion?",
    replies: 12,
    likes: 5,
    pinned: false,
    timestamp: "2 hours ago",
    category: "Assignments",
    isNew: true,
    lastReply: "30 min ago",
  },
  {
    id: "2",
    title: "Important: Final Project Guidelines Updated",
    author: { name: "Dr. Sarah Chen", role: "instructor", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    content: "Please review the updated final project guidelines. Key changes include the submission format and presentation requirements for the final demonstration.",
    replies: 24,
    likes: 18,
    pinned: true,
    timestamp: "1 day ago",
    category: "Announcements",
    lastReply: "2 hours ago",
  },
  {
    id: "3",
    title: "Study Group for Quiz 3",
    author: { name: "Maria Garcia", role: "student" },
    content: "Anyone interested in forming a study group for the upcoming quiz? I was thinking we could meet on Thursday evening in the engineering library.",
    replies: 8,
    likes: 12,
    pinned: false,
    timestamp: "3 hours ago",
    category: "General",
    lastReply: "1 hour ago",
  },
  {
    id: "4",
    title: "Office Hours Reminder - Friday 2PM",
    author: { name: "Michael Torres", role: "ta", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    content: "Just a reminder that I'll be holding office hours this Friday from 2-4 PM in Room 305. Feel free to drop by with any questions about the assignments.",
    replies: 3,
    likes: 7,
    pinned: true,
    timestamp: "5 hours ago",
    category: "Announcements",
    lastReply: "3 hours ago",
  },
  {
    id: "5",
    title: "Combustion Efficiency Question",
    author: { name: "Alex Johnson", role: "student" },
    content: "In lecture, we discussed combustion efficiency. How does this relate to specific impulse in practice? I'm trying to understand the connection for my project.",
    replies: 15,
    likes: 9,
    pinned: false,
    timestamp: "1 day ago",
    category: "Questions",
    lastReply: "4 hours ago",
  },
  {
    id: "6",
    title: "Resources for Understanding Thermodynamics",
    author: { name: "Emily Watson", role: "student" },
    content: "I found some great resources for understanding the thermodynamics concepts covered in Module 2. Sharing here for anyone who might find them helpful.",
    replies: 21,
    likes: 34,
    pinned: false,
    timestamp: "2 days ago",
    category: "Resources",
    lastReply: "6 hours ago",
  },
];

const CourseDiscussions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...new Set(discussions.map((d) => d.category))];

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSearch =
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || discussion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedDiscussions = filteredDiscussions.filter((d) => d.pinned);
  const regularDiscussions = filteredDiscussions.filter((d) => !d.pinned);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "instructor":
        return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Instructor</Badge>;
      case "ta":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">TA</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const DiscussionCard = ({ discussion }: { discussion: Discussion }) => (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg group",
        discussion.pinned && "border-primary/30 bg-primary/5"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
            <AvatarImage src={discussion.author.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(discussion.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {discussion.pinned && (
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pin className="h-3 w-3 text-primary" />
                </div>
              )}
              {discussion.isNew && (
                <Badge className="bg-success/10 text-success border-success/20 text-xs">New</Badge>
              )}
              <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                {discussion.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {discussion.author.name}
              </span>
              {getRoleBadge(discussion.author.role)}
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline" className="text-xs font-normal">
                {discussion.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {discussion.content}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  {discussion.replies} replies
                </span>
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                  <ThumbsUp className="h-4 w-4" />
                  {discussion.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {discussion.timestamp}
                </span>
              </div>
              {discussion.lastReply && (
                <span className="text-xs text-muted-foreground">
                  Last reply {discussion.lastReply}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );

  const totalReplies = discussions.reduce((acc, d) => acc + d.replies, 0);
  const activeDiscussions = discussions.filter(d => d.isNew || d.lastReply?.includes("hour") || d.lastReply?.includes("min")).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Discussions</h1>
            <p className="text-muted-foreground mt-1">Engage with your classmates and instructors</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Subscribe
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Discussion
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Discussions</p>
                  <p className="text-2xl font-bold text-foreground">{discussions.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Replies</p>
                  <p className="text-2xl font-bold text-foreground">{totalReplies}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold text-foreground">{activeDiscussions}</p>
                </div>
                <Users className="h-8 w-8 text-warning/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pinned</p>
                  <p className="text-2xl font-bold text-foreground">{pinnedDiscussions.length}</p>
                </div>
                <Pin className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === "all" ? "All Topics" : category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-6">
        {/* Pinned */}
        {pinnedDiscussions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Pin className="h-3.5 w-3.5 text-primary" />
              </div>
              Pinned Discussions
            </h3>
            {pinnedDiscussions.map((discussion, index) => (
              <div key={discussion.id} style={{ animationDelay: `${index * 50}ms` }}>
                <DiscussionCard discussion={discussion} />
              </div>
            ))}
          </div>
        )}

        {/* Regular */}
        {regularDiscussions.length > 0 && (
          <div className="space-y-4">
            {pinnedDiscussions.length > 0 && (
              <h3 className="font-semibold text-foreground pt-4">All Discussions</h3>
            )}
            {regularDiscussions.map((discussion, index) => (
              <div 
                key={discussion.id} 
                style={{ animationDelay: `${(index + pinnedDiscussions.length) * 50}ms` }}
              >
                <DiscussionCard discussion={discussion} />
              </div>
            ))}
          </div>
        )}

        {filteredDiscussions.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No discussions found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or start a new discussion</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Discussion
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDiscussions;
