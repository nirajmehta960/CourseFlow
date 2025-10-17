import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useParams } from "react-router-dom";
import {
  Plus,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Lock,
  MoreVertical,
  ChevronRight,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Quiz {
  id: string;
  title: string;
  questions: number;
  points: number;
  timeLimit: string;
  attempts: number;
  maxAttempts: number;
  dueDate: string;
  status: "available" | "completed" | "upcoming" | "locked";
  score?: number;
  published: boolean;
  description?: string;
}

const quizzes: Quiz[] = [
  {
    id: "1",
    title: "Quiz 1: Introduction to Rocket Propulsion",
    description: "Test your understanding of basic rocket propulsion concepts",
    questions: 20,
    points: 50,
    timeLimit: "30 min",
    attempts: 1,
    maxAttempts: 2,
    dueDate: "Nov 20, 2024",
    status: "completed",
    score: 45,
    published: true,
  },
  {
    id: "2",
    title: "Quiz 2: Fuel Types and Properties",
    description: "Explore different fuel types and their chemical properties",
    questions: 25,
    points: 50,
    timeLimit: "45 min",
    attempts: 1,
    maxAttempts: 2,
    dueDate: "Dec 5, 2024",
    status: "completed",
    score: 48,
    published: true,
  },
  {
    id: "3",
    title: "Quiz 3: Nozzle Design Fundamentals",
    description: "Master the principles of convergent-divergent nozzle design",
    questions: 20,
    points: 50,
    timeLimit: "30 min",
    attempts: 0,
    maxAttempts: 2,
    dueDate: "Dec 22, 2024",
    status: "available",
    published: true,
  },
  {
    id: "4",
    title: "Quiz 4: Combustion Processes",
    description: "Deep dive into combustion chemistry and thermodynamics",
    questions: 30,
    points: 75,
    timeLimit: "45 min",
    attempts: 0,
    maxAttempts: 1,
    dueDate: "Jan 5, 2025",
    status: "upcoming",
    published: true,
  },
  {
    id: "5",
    title: "Midterm Practice Quiz",
    description: "Comprehensive practice for the midterm examination",
    questions: 50,
    points: 100,
    timeLimit: "60 min",
    attempts: 0,
    maxAttempts: 3,
    dueDate: "Jan 15, 2025",
    status: "locked",
    published: false,
  },
  {
    id: "6",
    title: "Final Exam",
    description: "Final comprehensive assessment covering all course material",
    questions: 60,
    points: 150,
    timeLimit: "90 min",
    attempts: 0,
    maxAttempts: 1,
    dueDate: "Jan 31, 2025",
    status: "locked",
    published: true,
  },
];

const CourseQuizzes = () => {
  const { courseId } = useParams();
  const isFaculty = true;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "available":
        return <HelpCircle className="h-5 w-5 text-primary" />;
      case "upcoming":
        return <Clock className="h-5 w-5 text-warning" />;
      case "locked":
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (quiz: Quiz) => {
    switch (quiz.status) {
      case "completed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            {quiz.score}/{quiz.points} pts
          </Badge>
        );
      case "available":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Available Now</Badge>;
      case "upcoming":
        return <Badge variant="outline" className="text-warning border-warning/50">Upcoming</Badge>;
      case "locked":
        return <Badge variant="secondary">Locked</Badge>;
      default:
        return null;
    }
  };

  const getActionButton = (quiz: Quiz) => {
    switch (quiz.status) {
      case "completed":
        return (
          <Button variant="outline" size="sm">
            View Results
          </Button>
        );
      case "available":
        return (
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Start Quiz
          </Button>
        );
      case "upcoming":
        return (
          <Button variant="outline" size="sm" disabled>
            Opens Soon
          </Button>
        );
      case "locked":
        return (
          <Button variant="ghost" size="sm" disabled>
            <Lock className="h-4 w-4" />
          </Button>
        );
      default:
        return null;
    }
  };

  const completedQuizzes = quizzes.filter((q) => q.status === "completed");
  const totalPoints = completedQuizzes.reduce((acc, q) => acc + (q.score || 0), 0);
  const maxPoints = completedQuizzes.reduce((acc, q) => acc + q.points, 0);
  const averageScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  const availableQuizzes = quizzes.filter((q) => q.status === "available").length;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Quizzes</h1>
            <p className="text-muted-foreground mt-1">Test your knowledge with course quizzes</p>
          </div>
          {isFaculty && (
            <Link to={`/courses/${courseId}/quizzes/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Quiz
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Completed</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {completedQuizzes.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">of {quizzes.filter(q => q.published).length} total quizzes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Score</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{totalPoints}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-success" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">out of {maxPoints} possible</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Average</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{averageScore}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </div>
              <Progress value={averageScore} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Available</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{availableQuizzes}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">ready to take</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-4">
        {quizzes.map((quiz, index) => (
          <Card
            key={quiz.id}
            className={cn(
              "transition-all hover:shadow-lg group",
              quiz.status === "available" && "border-primary/50 ring-1 ring-primary/20",
              quiz.status === "locked" && "opacity-60"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
                <div className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center shrink-0",
                  quiz.status === "completed" && "bg-success/10",
                  quiz.status === "available" && "bg-primary/10",
                  quiz.status === "upcoming" && "bg-warning/10",
                  quiz.status === "locked" && "bg-muted"
                )}>
                  {getStatusIcon(quiz.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">{quiz.title}</h3>
                        {!quiz.published && (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4" />
                          {quiz.questions} questions
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Target className="h-4 w-4" />
                          {quiz.points} points
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {quiz.timeLimit}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Trophy className="h-4 w-4" />
                          {quiz.attempts}/{quiz.maxAttempts} attempts
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Due: {quiz.dueDate}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(quiz)}
                      {getActionButton(quiz)}
                      {isFaculty && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Link to={`/courses/${courseId}/quizzes/${quiz.id}`} className="flex items-center w-full">
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link to={`/courses/${courseId}/quizzes/${quiz.id}/edit`} className="flex items-center w-full">
                                Edit Quiz
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link to={`/courses/${courseId}/quizzes/${quiz.id}/preview`} className="flex items-center w-full">
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              {quiz.published ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Progress bar for completed */}
                  {quiz.status === "completed" && quiz.score !== undefined && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Your Score</span>
                        <span className="font-semibold text-foreground">
                          {Math.round((quiz.score / quiz.points) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(quiz.score / quiz.points) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {quizzes.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No quizzes yet</h3>
          <p className="text-muted-foreground mb-6">
            {isFaculty 
              ? "Create your first quiz to get started" 
              : "Quizzes will appear here when available"}
          </p>
          {isFaculty && (
            <Link to={`/courses/${courseId}/quizzes/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseQuizzes;
