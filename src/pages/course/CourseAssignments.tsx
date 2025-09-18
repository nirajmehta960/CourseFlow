import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Assignment {
  id: string;
  title: string;
  status: "open" | "closed" | "graded";
  dueDate: string;
  points?: number;
  score?: string;
  notGraded?: boolean;
  submittedAt?: string;
}

interface AssignmentGroup {
  id: string;
  name: string;
  assignments: Assignment[];
}

const assignmentGroups: AssignmentGroup[] = [
  {
    id: "upcoming",
    name: "Upcoming Assignments",
    assignments: [
      { id: "1", title: "Case Study Project Final Report", status: "open", dueDate: "Due Dec 7 at 11:59 PM", points: 150 },
      { id: "2", title: "NoSQL Implementation", status: "open", dueDate: "Due Nov 30 at 11:59 PM", points: 100 },
      { id: "3", title: "Application in Python or R", status: "open", dueDate: "Due Nov 23 at 11:59 PM", points: 75 },
    ],
  },
  {
    id: "past",
    name: "Past Assignments",
    assignments: [
      { id: "4", title: "Quiz #5A - Requires Respondus LockDown Browser", status: "closed", dueDate: "Due Dec 2 at 12:42 PM", points: 100, notGraded: true, submittedAt: "Dec 2 at 12:30 PM" },
      { id: "5", title: "Homework #5 Due on Sunday Nov. 30 at 11:59PM", status: "graded", dueDate: "Due Nov 30 at 11:59 PM", points: 100, score: "99.5/100" },
      { id: "6", title: "Quiz #5 - Requires Respondus LockDown Browser", status: "graded", dueDate: "Due Nov 25 at 12:32 PM", points: 100, score: "90/100" },
      { id: "7", title: "Homework #4 Due on Sunday Nov. 16 at 11:59PM", status: "graded", dueDate: "Due Nov 16 at 11:59 PM", points: 100, score: "99/100" },
      { id: "8", title: "Quiz #4 - Requires Respondus LockDown Browser", status: "graded", dueDate: "Due Nov 13 at 3:41 PM", points: 100, score: "90/100" },
      { id: "9", title: "Implementation in MySQL", status: "graded", dueDate: "Due Nov 9 at 11:59 PM", points: 100, score: "100/100" },
      { id: "10", title: "Homework #3 Due on Friday Nov. 7 at 11:59PM", status: "graded", dueDate: "Due Nov 7 at 11:59 PM", points: 100, score: "100/100" },
    ],
  },
];

const CourseAssignments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["upcoming", "past"]);
  const [filterStatus, setFilterStatus] = useState("all");
  const isFaculty = true;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filteredGroups = assignmentGroups.map((group) => ({
    ...group,
    assignments: group.assignments.filter((a) => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" || a.status === filterStatus;
      return matchesSearch && matchesFilter;
    }),
  }));

  const totalAssignments = assignmentGroups.reduce((acc, g) => acc + g.assignments.length, 0);
  const gradedAssignments = assignmentGroups.reduce((acc, g) => acc + g.assignments.filter(a => a.status === "graded").length, 0);
  const pendingAssignments = assignmentGroups.reduce((acc, g) => acc + g.assignments.filter(a => a.status === "open").length, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "closed":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.status === "graded" && assignment.score) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          {assignment.score}
        </Badge>
      );
    }
    if (assignment.status === "closed" && assignment.notGraded) {
      return (
        <Badge variant="outline" className="text-warning border-warning/50">
          Pending Grade
        </Badge>
      );
    }
    if (assignment.status === "open") {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          Open
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-1">Track and submit your course assignments</p>
          </div>
          {isFaculty && (
            <Link to={`/courses/1/assignments/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Assignment
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{totalAssignments}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Graded</p>
                  <p className="text-2xl font-bold text-foreground">{gradedAssignments}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{pendingAssignments}</p>
                </div>
                <Clock className="h-8 w-8 text-warning/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignment Groups */}
      <div className="space-y-6">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);

          if (group.assignments.length === 0) return null;

          return (
            <div key={group.id}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-3 py-3 hover:bg-muted/30 transition-colors text-left rounded-lg px-4 -mx-4"
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                  group.id === "upcoming" ? "bg-primary/10" : "bg-muted"
                )}>
                  {isExpanded ? (
                    <ChevronDown className={cn(
                      "h-4 w-4",
                      group.id === "upcoming" ? "text-primary" : "text-muted-foreground"
                    )} />
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4",
                      group.id === "upcoming" ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                <span className="font-semibold text-foreground">{group.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {group.assignments.length}
                </Badge>
              </button>

              {/* Assignments */}
              {isExpanded && (
                <div className="space-y-3 mt-3">
                  {group.assignments.map((assignment, index) => (
                    <Link
                      key={assignment.id}
                      to={`/courses/1/assignments/${assignment.id}`}
                    >
                      <Card 
                        className={cn(
                          "hover:shadow-md transition-all cursor-pointer group",
                          assignment.status === "open" && "border-primary/30"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                              assignment.status === "graded" && "bg-success/10",
                              assignment.status === "closed" && "bg-warning/10",
                              assignment.status === "open" && "bg-primary/10"
                            )}>
                              {getStatusIcon(assignment.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                    {assignment.title}
                                  </h3>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {assignment.dueDate}
                                    </span>
                                    {assignment.points && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5" />
                                        {assignment.points} pts
                                      </span>
                                    )}
                                    {assignment.submittedAt && (
                                      <span className="flex items-center gap-1 text-success">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Submitted {assignment.submittedAt}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(assignment)}
                                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGroups.every(g => g.assignments.length === 0) && (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No assignments found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default CourseAssignments;
