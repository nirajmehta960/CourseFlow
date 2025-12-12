import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Printer, 
  FileDown, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Target,
  Award,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GradeItem {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  submittedDate: string | null;
  status: "graded" | "submitted" | "pending" | "late";
  score: string | null;
  maxScore: number;
  percentage?: number;
}

const gradeItems: GradeItem[] = [
  { id: "1", name: "Assignment 1: Introduction", category: "ASSIGNMENTS", dueDate: "Sep 17 by 11:59 PM", submittedDate: "Sep 17 at 12:41 PM", status: "graded", score: "98.71", maxScore: 100, percentage: 98.71 },
  { id: "2", name: "Assignment 2: Data Modeling", category: "ASSIGNMENTS", dueDate: "Oct 1 by 11:59 PM", submittedDate: "Oct 1 at 2:57 PM", status: "graded", score: "100", maxScore: 100, percentage: 100 },
  { id: "3", name: "Quiz 1: Fundamentals", category: "QUIZZES", dueDate: "Oct 1 by 11:59 PM", submittedDate: "Sep 23 at 2:06 PM", status: "graded", score: "29", maxScore: 29, percentage: 100 },
  { id: "4", name: "Quiz 2: Advanced Concepts", category: "QUIZZES", dueDate: "Oct 11 by 11:59 PM", submittedDate: "Sep 29 at 12:25 PM", status: "graded", score: "22", maxScore: 23, percentage: 95.65 },
  { id: "5", name: "Quiz 3: Implementation", category: "QUIZZES", dueDate: "Oct 11 by 11:59 PM", submittedDate: "Oct 6 at 1:17 PM", status: "graded", score: "32", maxScore: 32, percentage: 100 },
  { id: "6", name: "Assignment 3: Database Design", category: "ASSIGNMENTS", dueDate: "Oct 15 by 11:59 PM", submittedDate: "Oct 15 at 3:05 PM", status: "graded", score: "100", maxScore: 100, percentage: 100 },
  { id: "7", name: "Quiz 4: SQL Queries", category: "QUIZZES", dueDate: "Oct 15 by 11:59 PM", submittedDate: "Oct 13 at 4:04 PM", status: "graded", score: "17", maxScore: 17, percentage: 100 },
  { id: "8", name: "Quiz 5: Optimization", category: "QUIZZES", dueDate: "Oct 22 by 11:59 PM", submittedDate: "Oct 21 at 4:41 PM", status: "graded", score: "28", maxScore: 31, percentage: 90.32 },
  { id: "9", name: "Midterm Exam", category: "EXAMS", dueDate: "Oct 30 by 11:59 PM", submittedDate: "Oct 24 at 2:20 PM", status: "graded", score: "100", maxScore: 100, percentage: 100 },
  { id: "10", name: "Final Project", category: "PROJECT", dueDate: "Dec 15 by 11:59 PM", submittedDate: null, status: "pending", score: null, maxScore: 200 },
];

const categoryWeights = [
  { category: "ASSIGNMENTS", weight: 40, color: "bg-primary" },
  { category: "QUIZZES", weight: 10, color: "bg-warning" },
  { category: "EXAMS", weight: 20, color: "bg-success" },
  { category: "PROJECT", weight: 30, color: "bg-secondary" },
];

const CourseGrades = () => {
  const [arrangeBy, setArrangeBy] = useState("due-date");

  // Calculate grades
  const gradedItems = gradeItems.filter(item => item.status === "graded");
  const totalEarned = gradedItems.reduce((acc, item) => acc + (parseFloat(item.score || "0")), 0);
  const totalPossible = gradedItems.reduce((acc, item) => acc + item.maxScore, 0);
  const overallPercentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100 * 10) / 10 : 0;

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-success/10 text-success border-success/20">Graded</Badge>;
      case "submitted":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Submitted</Badge>;
      case "late":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Late</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const found = categoryWeights.find(c => c.category === category);
    return found?.color || "bg-muted";
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Grades</h1>
          <p className="text-muted-foreground mt-1">Track your academic performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Overall</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{overallPercentage}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Progress value={overallPercentage} className="h-1.5 mt-4" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Letter Grade</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{getLetterGrade(overallPercentage)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                    <Award className="h-6 w-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Based on current grades</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Completed</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{gradedItems.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-warning" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">of {gradeItems.length} assignments</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Points Earned</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{totalEarned}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">of {totalPossible} possible</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Arrange by</span>
              <Select value={arrangeBy} onValueChange={setArrangeBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due-date">Due Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grades Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-foreground">Assignment</TableHead>
                    <TableHead className="font-semibold text-foreground">Due</TableHead>
                    <TableHead className="font-semibold text-foreground">Submitted</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Score</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 group cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            getCategoryColor(item.category)
                          )} />
                          <div>
                            <span className="text-foreground font-medium hover:text-primary transition-colors">
                              {item.name}
                            </span>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.dueDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.submittedDate || (
                          <span className="text-warning flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Not submitted
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.score ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-foreground">
                              {item.score}/{item.maxScore}
                            </span>
                            {item.percentage && (
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                item.percentage >= 90 && "bg-success/10 text-success",
                                item.percentage >= 70 && item.percentage < 90 && "bg-warning/10 text-warning",
                                item.percentage < 70 && "bg-destructive/10 text-destructive"
                              )}>
                                {item.percentage}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-6">
          {/* Grade Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Grade Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryWeights.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">{cat.category}</span>
                      <span className="text-muted-foreground">{cat.weight}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", cat.color)}
                        style={{ width: `${cat.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold pt-4 mt-4 border-t border-border">
                <span>Total</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>

          {/* What-if Calculator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What-if Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Calculate how future grades will affect your overall score
              </p>
              <Button variant="outline" className="w-full">
                Open Calculator
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Highest Score</span>
                <span className="font-semibold text-success">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lowest Score</span>
                <span className="font-semibold text-warning">90.32%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Class Average</span>
                <span className="font-semibold text-foreground">87.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Rank</span>
                <span className="font-semibold text-primary">#3 of 45</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseGrades;
