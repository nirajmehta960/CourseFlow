import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Eye, Ban, Play, Clock, Calendar } from "lucide-react";
import { getQuiz, getMyAttempt, Quiz, QuizAttempt } from "@/lib/quizzes-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, isAfter } from "date-fns";
import { useCoursePermissions } from "@/hooks/useCoursePermissions";

const QuizDetailsNew = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [myAttempt, setMyAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const { isInstructor: isFaculty } = useCoursePermissions();

  useEffect(() => {
    fetchData();
  }, [courseId, quizId]);

  const fetchData = async () => {
    if (!courseId || !quizId) return;

    try {
      setLoading(true);
      const [quizData, attemptData] = await Promise.all([
        getQuiz(courseId, quizId),
        !isFaculty ? getMyAttempt(quizId).catch(() => null) : Promise.resolve(null),
      ]);

      setQuiz(quizData);
      setMyAttempt(attemptData);
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Quiz not found</p>
        </div>
      </div>
    );
  }

  const dueDate = quiz.dueAt ? parseISO(quiz.dueAt) : null;
  const isPastDue = dueDate && !isAfter(dueDate, new Date());
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  // Faculty View
  if (isFaculty) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}/preview`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Quiz Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              {!quiz.published && (
                <Badge variant="secondary" className="gap-1">
                  <Ban className="h-3 w-3" />
                  Not Published
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.instructions && (
              <div>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{quiz.instructions}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Points:</span> {totalPoints}
              </div>
              <div>
                <span className="font-medium">Questions:</span> {quiz.questions.length}
              </div>
              {quiz.timeLimitMinutes && (
                <div>
                  <span className="font-medium">Time Limit:</span> {quiz.timeLimitMinutes} minutes
                </div>
              )}
              {dueDate && (
                <div>
                  <span className="font-medium">Due:</span> {format(dueDate, "MMM d, yyyy 'at' h:mma")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student View
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.instructions && (
            <div>
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{quiz.instructions}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total Points:</span>
              <span>{totalPoints}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Questions:</span>
              <span>{quiz.questions.length}</span>
            </div>
            {quiz.timeLimitMinutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Time Limit:</span>
                <span>{quiz.timeLimitMinutes} minutes</span>
              </div>
            )}
            {dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Due:</span>
                <span className={isPastDue ? "text-destructive" : ""}>
                  {format(dueDate, "MMM d, yyyy 'at' h:mma")}
                </span>
              </div>
            )}
          </div>

          {myAttempt && myAttempt.status === "SUBMITTED" && (
            <>
              <Separator />
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Your Score</span>
                  {myAttempt.score !== undefined && (
                    <span className="text-2xl font-bold">
                      {myAttempt.score} / {totalPoints}
                    </span>
                  )}
                </div>
                {myAttempt.score !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {Math.round((myAttempt.score / totalPoints) * 100)}%
                  </p>
                )}
              </div>
            </>
          )}

          <div className="pt-4">
            {myAttempt && myAttempt.status === "IN_PROGRESS" ? (
              <Link to={`/courses/${courseId}/quizzes/${quizId}/attempt`}>
                <Button size="lg" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Continue Quiz
                </Button>
              </Link>
            ) : myAttempt && myAttempt.status === "SUBMITTED" ? (
              <Link to={`/courses/${courseId}/quizzes/${quizId}/attempt`}>
                <Button variant="outline" size="lg" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              </Link>
            ) : (
              <Link to={`/courses/${courseId}/quizzes/${quizId}/attempt`}>
                <Button size="lg" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizDetailsNew;
