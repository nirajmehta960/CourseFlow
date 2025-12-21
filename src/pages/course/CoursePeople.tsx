import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Users, 
  MoreVertical, 
  Mail, 
  UserPlus,
  GraduationCap,
  BookOpen,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";

interface Person {
  id: string;
  name: string;
  email: string;
  section: string;
  role: "Teacher" | "TA" | "Student";
  avatar?: string;
  status?: "active" | "inactive";
  lastActive?: string;
}

const people: Person[] = [
  { id: "1", name: "Dr. Sarah Chen", email: "sarah.chen@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Teacher", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", status: "active", lastActive: "Just now" },
  { id: "2", name: "Michael Torres", email: "m.torres@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "TA", status: "active", lastActive: "2 hours ago" },
  { id: "3", name: "Nishit Agarwal", email: "n.agarwal@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "1 hour ago" },
  { id: "4", name: "Jose Annunziato", email: "j.annunziato@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "3 hours ago" },
  { id: "5", name: "Dinesh Bachchani", email: "d.bachchani@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "inactive", lastActive: "2 days ago" },
  { id: "6", name: "Xuan Bai", email: "x.bai@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "30 min ago" },
  { id: "7", name: "Anirudh Bakare", email: "a.bakare@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", status: "active", lastActive: "1 hour ago" },
  { id: "8", name: "Siddhi Satish Bhanushali", email: "s.bhanushali@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "4 hours ago" },
  { id: "9", name: "Shraavya Kishan Bharadwaj", email: "s.bharadwaj@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "5 hours ago" },
  { id: "10", name: "Shailly Bhati", email: "s.bhati@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "inactive", lastActive: "1 week ago" },
  { id: "11", name: "Mayur Mahavir Bijarniya", email: "m.bijarniya@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "2 hours ago" },
  { id: "12", name: "Rohan Kumar Chitra", email: "r.chitra@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", status: "active", lastActive: "6 hours ago" },
  { id: "13", name: "Austin Clift", email: "a.clift@university.edu", section: "CS5610 Web Development SEC 05 Fall 2025", role: "Student", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", status: "active", lastActive: "Just now" },
];

const CoursePeople = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("everyone");
  const { isInstructor: isFaculty } = useCoursePermissions();

  const filteredPeople = people.filter((person) => {
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || person.role.toLowerCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

  const teachers = people.filter(p => p.role === "Teacher");
  const tas = people.filter(p => p.role === "TA");
  const students = people.filter(p => p.role === "Student");
  const activeStudents = students.filter(p => p.status === "active").length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Teacher":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Instructor</Badge>;
      case "TA":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Teaching Assistant</Badge>;
      default:
        return <Badge variant="secondary">Student</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Teacher":
        return <Crown className="h-4 w-4 text-primary" />;
      case "TA":
        return <BookOpen className="h-4 w-4 text-warning" />;
      default:
        return <GraduationCap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">People</h1>
            <p className="text-muted-foreground mt-1">Course participants and groups</p>
          </div>
          {isFaculty && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="h-4 w-4" />
                Message All
              </Button>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add People
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Instructors</p>
                  <p className="text-2xl font-bold text-foreground">{teachers.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teaching Assistants</p>
                  <p className="text-2xl font-bold text-foreground">{tas.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold text-foreground">{students.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-2xl font-bold text-foreground">{activeStudents}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="everyone" className="data-[state=active]:bg-background">
            Everyone
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-background">
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="everyone" className="mt-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="teacher">Instructors</SelectItem>
                <SelectItem value="ta">Teaching Assistants</SelectItem>
                <SelectItem value="student">Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* People Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person, index) => (
              <Card 
                key={person.id} 
                className="hover:shadow-lg transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-background shadow-lg">
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className={cn(
                          "text-sm font-medium",
                          person.role === "Teacher" && "bg-primary/10 text-primary",
                          person.role === "TA" && "bg-warning/10 text-warning",
                          person.role === "Student" && "bg-muted text-muted-foreground"
                        )}>
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      {person.status === "active" && person.lastActive?.includes("now") && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getRoleIcon(person.role)}
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {person.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{person.email}</p>
                      <div className="flex items-center justify-between">
                        {getRoleBadge(person.role)}
                        <span className="text-xs text-muted-foreground">{person.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPeople.length === 0 && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No people found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-6">Create groups to organize students for projects and activities</p>
                {isFaculty && (
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursePeople;
