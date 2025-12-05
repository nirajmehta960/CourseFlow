import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Save,
  Eye,
  ChevronLeft,
} from "lucide-react";
import {
  getQuiz,
  createQuiz,
  updateQuiz,
  Quiz,
  Question,
  QuestionRequest,
  QuestionType,
} from "@/lib/quizzes-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const QuizEditorNew = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>();
  const [dueAt, setDueAt] = useState<string>("");
  const [published, setPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Question form state
  const [questionForm, setQuestionForm] = useState<Partial<QuestionRequest>>({
    type: "MCQ",
    prompt: "",
    options: [],
    correctAnswer: "",
    points: 1,
  });

  useEffect(() => {
    if (quizId && quizId !== "new") {
      fetchQuiz();
    } else {
      setLoading(false);
    }
  }, [courseId, quizId]);

  const fetchQuiz = async () => {
    if (!courseId || !quizId) return;

    try {
      setLoading(true);
      const data = await getQuiz(courseId, quizId);
      setQuiz(data);
      setTitle(data.title);
      setInstructions(data.instructions || "");
      setTimeLimitMinutes(data.timeLimitMinutes);
      setDueAt(data.dueAt ? new Date(data.dueAt).toISOString().slice(0, 16) : "");
      setPublished(data.published);
      setQuestions(data.questions || []);
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

  const handleSave = async (publish: boolean = false) => {
    if (!courseId) return;

    try {
      setSaving(true);
      const questionRequests: QuestionRequest[] = questions.map((q, index) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
        points: q.points,
        position: index,
      }));

      const quizData = {
        title,
        instructions,
        timeLimitMinutes,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        published: publish ? true : published,
        questions: questionRequests,
      };

      if (quizId && quizId !== "new") {
        await updateQuiz(courseId, quizId, quizData);
        toast({
          title: "Success",
          description: publish ? "Quiz published successfully" : "Quiz saved successfully",
        });
      } else {
        const newQuiz = await createQuiz(courseId, quizData);
        toast({
          title: "Success",
          description: "Quiz created successfully",
        });
        navigate(`/courses/${courseId}/quizzes/${newQuiz.id}/edit`);
        return;
      }

      if (publish) {
        navigate(`/courses/${courseId}/quizzes`);
      } else {
        fetchQuiz();
      }
    } catch (error) {
      console.error("Failed to save quiz:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestionForm({
      type: "MCQ",
      prompt: "",
      options: ["", ""],
      correctAnswer: "0",
      points: 1,
    });
    setEditingQuestionId(null);
    setShowQuestionDialog(true);
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionForm({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options.length > 0 ? question.options : ["", ""],
      correctAnswer: question.correctAnswer || "",
      points: question.points,
    });
    setEditingQuestionId(question.id);
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.prompt || !questionForm.correctAnswer) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingQuestionId) {
      // Update existing question
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                type: questionForm.type!,
                prompt: questionForm.prompt!,
                options: questionForm.options || [],
                correctAnswer: questionForm.correctAnswer!,
                points: questionForm.points || 1,
              }
            : q
        )
      );
    } else {
      // Add new question
      const newQuestion: Question = {
        id: `temp-${Date.now()}`,
        position: questions.length,
        type: questionForm.type!,
        prompt: questionForm.prompt!,
        options: questionForm.options || [],
        correctAnswer: questionForm.correctAnswer!,
        points: questionForm.points || 1,
      };
      setQuestions((prev) => [...prev, newQuestion]);
    }

    setShowQuestionDialog(false);
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  const updateQuestionOption = (index: number, value: string) => {
    setQuestionForm((prev) => {
      const newOptions = [...(prev.options || [])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addQuestionOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  };

  const removeQuestionOption = (index: number) => {
    setQuestionForm((prev) => {
      const newOptions = [...(prev.options || [])];
      newOptions.splice(index, 1);
      return { ...prev, options: newOptions };
    });
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

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={quizId && quizId !== "new" ? `/courses/${courseId}/quizzes/${quizId}` : `/courses/${courseId}/quizzes`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            {quizId === "new" ? "Create Quiz" : "Edit Quiz"}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{totalPoints} points</span>
            {quizId && quizId !== "new" && (
              <Link to={`/courses/${courseId}/quizzes/${quizId}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({questions.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Quiz Title"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter quiz instructions..."
                  rows={5}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="0"
                    value={timeLimitMinutes || ""}
                    onChange={(e) =>
                      setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="No limit"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="dueAt">Due Date</Label>
                  <Input
                    id="dueAt"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No questions yet</p>
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 pt-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveQuestion(index, "up")}
                        disabled={index === 0}
                      >
                        ^
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveQuestion(index, "down")}
                        disabled={index === questions.length - 1}
                      >
                        v
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Question {index + 1}
                        </span>
                        <Badge variant="outline">{question.type}</Badge>
                        <Badge variant="outline">{question.points} pts</Badge>
                      </div>
                      <p className="font-medium mb-2">{question.prompt}</p>
                      {question.type === "MCQ" || question.type === "MULTI_SELECT" ? (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="text-sm text-muted-foreground">
                              {optIndex + 1}. {option}
                              {question.correctAnswer?.includes(optIndex.toString()) && (
                                <Badge variant="default" className="ml-2">Correct</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : question.type === "TRUE_FALSE" ? (
                        <div className="text-sm text-muted-foreground">
                          Correct Answer: {question.correctAnswer}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Expected: {question.correctAnswer}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Button onClick={handleAddQuestion} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}/quizzes`)}>
          Cancel
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving || questions.length === 0}>
          {saving ? "Publishing..." : "Save & Publish"}
        </Button>
      </div>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionId ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              Create a question for your quiz
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="question-type">Question Type</Label>
              <Select
                value={questionForm.type}
                onValueChange={(value) => {
                  setQuestionForm({
                    ...questionForm,
                    type: value as QuestionType,
                    options: value === "MCQ" || value === "MULTI_SELECT" ? ["", ""] : [],
                    correctAnswer: value === "TRUE_FALSE" ? "true" : "",
                  });
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">Multiple Choice (Single Answer)</SelectItem>
                  <SelectItem value="MULTI_SELECT">Multiple Select</SelectItem>
                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question-prompt">Question Prompt</Label>
              <Textarea
                id="question-prompt"
                value={questionForm.prompt || ""}
                onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                placeholder="Enter your question..."
                rows={3}
                className="mt-1.5"
              />
            </div>

            {(questionForm.type === "MCQ" || questionForm.type === "MULTI_SELECT") && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-1.5">
                  {(questionForm.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateQuestionOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestionOption(index)}
                        disabled={(questionForm.options || []).length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestionOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                <div className="mt-4">
                  <Label>
                    Correct Answer
                    {questionForm.type === "MULTI_SELECT" && " (select multiple)"}
                  </Label>
                  {questionForm.type === "MCQ" ? (
                    <Select
                      value={questionForm.correctAnswer}
                      onValueChange={(value) =>
                        setQuestionForm({ ...questionForm, correctAnswer: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {(questionForm.options || []).map((_, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            Option {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2 mt-1.5">
                      {(questionForm.options || []).map((_, index) => {
                        const selectedIndices = (questionForm.correctAnswer || "")
                          .split(",")
                          .filter(Boolean);
                        const isSelected = selectedIndices.includes(index.toString());
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newIndices = e.target.checked
                                  ? [...selectedIndices, index.toString()]
                                  : selectedIndices.filter((i) => i !== index.toString());
                                setQuestionForm({
                                  ...questionForm,
                                  correctAnswer: newIndices.join(","),
                                });
                              }}
                            />
                            <Label>Option {index + 1}</Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {questionForm.type === "TRUE_FALSE" && (
              <div>
                <Label>Correct Answer</Label>
                <Select
                  value={questionForm.correctAnswer}
                  onValueChange={(value) =>
                    setQuestionForm({ ...questionForm, correctAnswer: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {questionForm.type === "SHORT_ANSWER" && (
              <div>
                <Label htmlFor="correct-answer">Expected Answer (for reference)</Label>
                <Input
                  id="correct-answer"
                  value={questionForm.correctAnswer || ""}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, correctAnswer: e.target.value })
                  }
                  placeholder="Expected answer (for manual grading reference)"
                  className="mt-1.5"
                />
              </div>
            )}

            <div>
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min="0"
                step="0.5"
                value={questionForm.points || 1}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) || 1 })
                }
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion}>Save Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizEditorNew;
