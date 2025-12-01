import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Clock,
  Calendar,
  Eye,
  Pencil,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getQuizzes, Quiz } from "@/lib/quizzes-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, isAfter } from "date-fns";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";

const QuizListNew = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const { isInstructor: isFaculty } = useCoursePermissions();

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const data = await getQuizzes(courseId);
      // Filter only published quizzes for students
      const filtered = isFaculty ? data : data.filter(q => q.published);
      setQuizzes(filtered);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const filteredQuizzes = quizzes.filter((quiz) => {
    if (filter === "all") return true;
    if (!quiz.dueAt) return filter === "upcoming";
    
    const dueDate = parseISO(quiz.dueAt);
    if (filter === "upcoming") return isAfter(dueDate, now);
    return !isAfter(dueDate, now);
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge</p>
        </div>
        {isFaculty && (
          <Link to={`/courses/${courseId}/quizzes/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Quiz
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("past")}
        >
          Past
        </Button>
      </div>

      {/* Quiz List */}
      <div className="space-y-4">
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No quizzes</h3>
            <p className="text-muted-foreground">
              {filter !== "all"
                ? `No ${filter} quizzes`
                : isFaculty
                ? "Create your first quiz"
                : "No quizzes available"}
            </p>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => {
            const dueDate = quiz.dueAt ? parseISO(quiz.dueAt) : null;
            const isPastDue = dueDate && !isAfter(dueDate, now);

            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          to={`/courses/${courseId}/quizzes/${quiz.id}`}
                          className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {quiz.title}
                        </Link>
                        {!quiz.published && isFaculty && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      {quiz.instructions && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {quiz.instructions}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {quiz.timeLimitMinutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{quiz.timeLimitMinutes} min</span>
                          </div>
                        )}
                        {dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className={isPastDue ? "text-destructive" : ""}>
                              Due {format(dueDate, "MMM d, yyyy 'at' h:mma")}
                            </span>
                          </div>
                        )}
                        <span>
                          {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {isFaculty && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/courses/${courseId}/quizzes/${quiz.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/courses/${courseId}/quizzes/${quiz.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuizListNew;
