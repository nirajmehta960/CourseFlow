import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Trash2,
  Edit,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";
import { getCoursePeople, enrollByEmail, updateEnrollment, CoursePeopleResponse } from "@/lib/courses-api";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api";

const CoursePeople = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("everyone");
  const [people, setPeople] = useState<CoursePeopleResponse['people']>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"STUDENT" | "TA" | "INSTRUCTOR">("STUDENT");
  const [inviting, setInviting] = useState(false);
  const { isInstructor: isFaculty } = useCoursePermissions();

  useEffect(() => {
    const fetchPeople = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        const response = await getCoursePeople(courseId);
        setPeople(response.people);
      } catch (error) {
        console.error("Failed to fetch course people:", error);
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, [courseId]);

  const handleInvite = async () => {
    if (!courseId || !inviteEmail.trim()) return;

    try {
      setInviting(true);
      await enrollByEmail(courseId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      toast({
        title: "Success",
        description: `User ${inviteEmail} has been enrolled successfully`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("STUDENT");

      // Refresh people list
      const response = await getCoursePeople(courseId);
      setPeople(response.people);
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (enrollmentId: string, userName: string) => {
    if (!courseId) return;

    if (!confirm(`Are you sure you want to remove ${userName} from this course?`)) {
      return;
    }

    try {
      await updateEnrollment(courseId, enrollmentId, {
        status: "DROPPED",
      });

      toast({
        title: "Success",
        description: `${userName} has been removed from the course`,
      });

      // Refresh people list
      const response = await getCoursePeople(courseId);
      setPeople(response.people);
    } catch (error) {
      console.error("Failed to remove user:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (enrollmentId: string, newRole: "STUDENT" | "TA" | "INSTRUCTOR") => {
    if (!courseId) return;

    try {
      await updateEnrollment(courseId, enrollmentId, {
        role: newRole,
      });

      toast({
        title: "Success",
        description: "User role has been updated",
      });

      // Refresh people list
      const response = await getCoursePeople(courseId);
      setPeople(response.people);
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  // Get enrollment ID from people array - we need to store it
  // For now, we'll need to modify the API response to include enrollmentId
  // For this implementation, we'll use userId as a workaround and find the enrollment

  const filteredPeople = people.filter((person) => {
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMap: Record<string, string> = {
      "INSTRUCTOR": "teacher",
      "TA": "ta",
      "STUDENT": "student",
    };
    const matchesRole = roleFilter === "all" || roleMap[person.courseRole] === roleFilter;
    return matchesSearch && matchesRole;
  });

  const teachers = people.filter(p => p.courseRole === "INSTRUCTOR");
  const tas = people.filter(p => p.courseRole === "TA");
  const students = people.filter(p => p.courseRole === "STUDENT");
  const activeStudents = people.filter(p => p.status === "ACTIVE").length;


  const getRoleBadge = (role: string) => {
    switch (role) {
      case "INSTRUCTOR":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Instructor</Badge>;
      case "TA":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Teaching Assistant</Badge>;
      default:
        return <Badge variant="secondary">Student</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "INSTRUCTOR":
        return <Crown className="h-4 w-4 text-primary" />;
      case "TA":
        return <BookOpen className="h-4 w-4 text-warning" />;
      default:
        return <GraduationCap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading people...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
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
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add People
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite User to Course</DialogTitle>
                    <DialogDescription>
                      Enter the email address of the user you want to invite. They must already have an account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={inviting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value) => setInviteRole(value as "STUDENT" | "TA" | "INSTRUCTOR")}
                        disabled={inviting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="TA">Teaching Assistant</SelectItem>
                          <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteDialogOpen(false)}
                      disabled={inviting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                      {inviting ? "Inviting..." : "Invite User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <SelectTrigger className="w-full md:w-[180px]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
            {filteredPeople.map((person, index) => (
              <Card
                key={person.userId}
                className="hover:shadow-lg transition-all group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-background shadow-lg">
                        <AvatarImage src={person.profileImageUrl} alt={person.name} />
                        <AvatarFallback className={cn(
                          "text-sm font-medium",
                          person.courseRole === "INSTRUCTOR" && "bg-primary/10 text-primary",
                          person.courseRole === "TA" && "bg-warning/10 text-warning",
                          person.courseRole === "STUDENT" && "bg-muted text-muted-foreground"
                        )}>
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      {person.status === "ACTIVE" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getRoleIcon(person.courseRole)}
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {person.name}
                        </h3>
                        {isFaculty && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(person.enrollmentId, "INSTRUCTOR")}>
                                <Crown className="h-4 w-4 mr-2" />
                                Make Instructor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(person.enrollmentId, "TA")}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Make TA
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(person.enrollmentId, "STUDENT")}>
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Make Student
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemove(person.enrollmentId, person.name)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{person.email}</p>
                      <div className="flex items-center justify-between">
                        {getRoleBadge(person.courseRole)}
                        <Badge variant={person.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                          {person.status}
                        </Badge>
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
