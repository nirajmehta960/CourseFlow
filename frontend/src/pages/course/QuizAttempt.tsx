import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import {
  getQuiz,
  getMyAttempt,
  startQuizAttempt,
  submitQuizAttempt,
  Quiz,
  QuizAttempt,
  Answer,
} from "@/lib/quizzes-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

const QuizAttempt = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [quizId]);

  const fetchData = async () => {
    if (!courseId || !quizId) return;

    try {
      setLoading(true);
      const [quizData, attemptData] = await Promise.all([
        getQuiz(courseId, quizId),
        getMyAttempt(quizId).catch(() => null),
      ]);

      setQuiz(quizData);
      
      if (attemptData) {
        setAttempt(attemptData);
        // Load existing answers
        const answerMap: Record<string, string> = {};
        attemptData.answers.forEach((a) => {
          answerMap[a.questionId] = a.answer;
        });
        setAnswers(answerMap);
        
        if (attemptData.status === "SUBMITTED") {
          setShowResults(true);
        }
      } else {
        // Start new attempt
        const newAttempt = await startQuizAttempt(quizId);
        setAttempt(newAttempt);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quiz?.timeLimitMinutes && attempt && attempt.status === "IN_PROGRESS") {
      const startTime = parseISO(attempt.startedAt).getTime();
      const timeLimitMs = quiz.timeLimitMinutes * 60 * 1000;
      
      const updateTimer = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLimitMs - elapsed);
        setTimeRemaining(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          handleAutoSubmit();
        }
      };
      
      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [quiz, attempt]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleMultiSelectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => {
      const current = prev[questionId] || "";
      const indices = current ? current.split(",").filter(Boolean) : [];
      const indexStr = optionIndex.toString();
      
      if (indices.includes(indexStr)) {
        return { ...prev, [questionId]: indices.filter(i => i !== indexStr).join(",") };
      } else {
        return { ...prev, [questionId]: [...indices, indexStr].join(",") };
      }
    });
  };

  const handleSubmit = async () => {
    if (!quizId || !quiz) return;

    try {
      setSubmitting(true);
      const answerList: Answer[] = quiz.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));

      const submitted = await submitQuizAttempt(quizId, { answers: answerList });
      setAttempt(submitted);
      setShowResults(true);
      setShowSubmitDialog(false);
      
      toast({
        title: "Success",
        description: "Quiz submitted successfully",
      });
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    toast({
      title: "Time's up!",
      description: "Your quiz is being submitted automatically",
    });
    handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isAnswerCorrect = (questionId: string) => {
    if (!quiz || !attempt || attempt.status !== "SUBMITTED") return null;
    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question || !question.correctAnswer) return null;
    
    const studentAnswer = answers[questionId] || "";
    
    switch (question.type) {
      case "MCQ":
        return studentAnswer === question.correctAnswer;
      case "MULTI_SELECT":
        const studentIndices = new Set(studentAnswer.split(",").filter(Boolean).sort());
        const correctIndices = new Set(question.correctAnswer.split(",").filter(Boolean).sort());
        return studentIndices.size === correctIndices.size &&
               Array.from(studentIndices).every(i => correctIndices.has(i));
      case "TRUE_FALSE":
        return studentAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      case "SHORT_ANSWER":
        return null; // Needs review
      default:
        return null;
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

  if (!quiz || !attempt) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Quiz not found</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  if (showResults && attempt.status === "SUBMITTED") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-2">
                {attempt.score !== undefined ? `${attempt.score} / ${totalPoints}` : "Submitted"}
              </h2>
              <p className="text-muted-foreground">
                {attempt.score !== undefined
                  ? `${Math.round((attempt.score / totalPoints) * 100)}%`
                  : "Your quiz has been submitted and is being graded"}
              </p>
              {attempt.gradedAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Graded on {format(parseISO(attempt.gradedAt), "MMM d, yyyy 'at' h:mma")}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const isCorrect = isAnswerCorrect(question.id);
                const studentAnswer = answers[question.id] || "";

                return (
                  <Card key={question.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Question {index + 1}</span>
                          <Badge variant="outline">{question.points} pts</Badge>
                          {isCorrect === true && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Correct
                            </Badge>
                          )}
                          {isCorrect === false && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Incorrect
                            </Badge>
                          )}
                          {isCorrect === null && question.type === "SHORT_ANSWER" && (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Needs Review
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-medium mb-4">{question.prompt}</p>
                      
                      {question.type === "MCQ" && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => {
                            const isSelected = studentAnswer === optIndex.toString();
                            const isCorrectOption = question.correctAnswer === optIndex.toString();
                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border ${
                                  isSelected
                                    ? isCorrectOption
                                      ? "border-green-500 bg-green-50"
                                      : "border-red-500 bg-red-50"
                                    : isCorrectOption
                                    ? "border-green-500 bg-green-50"
                                    : "border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <span className="font-semibold">Your answer: </span>
                                  )}
                                  {isCorrectOption && !isSelected && (
                                    <span className="font-semibold text-green-700">Correct answer: </span>
                                  )}
                                  <span>{option}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.type === "MULTI_SELECT" && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => {
                            const selectedIndices = studentAnswer.split(",").filter(Boolean);
                            const isSelected = selectedIndices.includes(optIndex.toString());
                            const correctIndices = question.correctAnswer?.split(",").filter(Boolean) || [];
                            const isCorrectOption = correctIndices.includes(optIndex.toString());
                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border ${
                                  isSelected
                                    ? isCorrectOption
                                      ? "border-green-500 bg-green-50"
                                      : "border-red-500 bg-red-50"
                                    : isCorrectOption
                                    ? "border-green-500 bg-green-50"
                                    : "border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <span className="font-semibold">Your answer: </span>
                                  )}
                                  {isCorrectOption && !isSelected && (
                                    <span className="font-semibold text-green-700">Correct answer: </span>
                                  )}
                                  <span>{option}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.type === "TRUE_FALSE" && (
                        <div className="space-y-2">
                          {["true", "false"].map((value) => {
                            const isSelected = studentAnswer.toLowerCase().trim() === value;
                            const isCorrect = question.correctAnswer?.toLowerCase().trim() === value;
                            return (
                              <div
                                key={value}
                                className={`p-3 rounded-lg border ${
                                  isSelected
                                    ? isCorrect
                                      ? "border-green-500 bg-green-50"
                                      : "border-red-500 bg-red-50"
                                    : isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : "border-border"
                                }`}
                              >
                                <span className="capitalize">{value}</span>
                                {isSelected && <span className="ml-2 font-semibold">(Your answer)</span>}
                                {isCorrect && !isSelected && (
                                  <span className="ml-2 font-semibold text-green-700">(Correct answer)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.type === "SHORT_ANSWER" && (
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg border border-border bg-muted">
                            <p className="font-semibold mb-1">Your answer:</p>
                            <p>{studentAnswer || "(No answer provided)"}</p>
                          </div>
                          {question.correctAnswer && (
                            <div className="p-3 rounded-lg border border-green-500 bg-green-50">
                              <p className="font-semibold text-green-700 mb-1">Expected answer:</p>
                              <p>{question.correctAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center pt-4">
              <Link to={`/courses/${courseId}/quizzes`}>
                <Button>Back to Quizzes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/courses/${courseId}/quizzes`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Quizzes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{quiz.title}</h1>
            {quiz.instructions && (
              <p className="text-muted-foreground mt-1">{quiz.instructions}</p>
            )}
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-lg">
              <Clock className="h-5 w-5 text-destructive" />
              <span className="font-mono font-semibold text-destructive">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>{totalPoints} points total</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{currentQuestion.prompt}</h2>
              <Badge variant="outline">{currentQuestion.points} points</Badge>
            </div>

            {currentQuestion.type === "MCQ" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "MULTI_SELECT" && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const selectedIndices = (answers[currentQuestion.id] || "").split(",").filter(Boolean);
                  const isSelected = selectedIndices.includes(index.toString());
                  return (
                    <div key={index} className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id={`option-${index}`}
                        checked={isSelected}
                        onCheckedChange={() => handleMultiSelectAnswer(currentQuestion.id, index)}
                      />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "TRUE_FALSE" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === "SHORT_ANSWER" && (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="Enter your answer..."
                rows={5}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex gap-2">
              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this quiz? You cannot change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You have answered {Object.keys(answers).filter(k => answers[k]).length} out of {totalQuestions} questions.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizAttempt;
