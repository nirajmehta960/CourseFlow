import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Ban, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuizContext } from '@/contexts/QuizContext';
import { Quiz, QuizQuestion, QuestionType } from '@/types/quiz';
import { 
  QuestionEditorWrapper,
} from '@/components/quiz/QuestionEditors';

const QuizEditor = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'details';
  
  const { getQuiz, updateQuiz, addQuestion, updateQuestion, deleteQuestion } = useQuizContext();
  
  const quiz = getQuiz(quizId || '');
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formData, setFormData] = useState<Partial<Quiz>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('multiple-choice');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  useEffect(() => {
    if (quiz) {
      setFormData(quiz);
    }
  }, [quiz]);

  if (!quiz) {
    return (
      <div className="p-6 max-w-4xl">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const handleSave = () => {
    updateQuiz(quiz.id, formData);
    navigate(`/courses/${courseId}/quizzes/${quizId}`);
  };

  const handleSaveAndPublish = () => {
    updateQuiz(quiz.id, { ...formData, published: true });
    navigate(`/courses/${courseId}/quizzes`);
  };

  const handleCancel = () => {
    navigate(`/courses/${courseId}/quizzes`);
  };

  const handleAddNewQuestion = () => {
    setIsAddingQuestion(true);
    setEditingQuestionId(null);
  };

  const handleSaveNewQuestion = (question: QuizQuestion) => {
    addQuestion(quiz.id, { ...question, id: `q-${Date.now()}` });
    setIsAddingQuestion(false);
  };

  const handleUpdateQuestion = (question: QuizQuestion) => {
    updateQuestion(quiz.id, question.id, question);
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion(quiz.id, questionId);
  };

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {quiz.title || 'Unnamed Quiz'}
          </h2>
          {!quiz.published && (
            <Badge variant="secondary" className="gap-1">
              <Ban className="h-3 w-3" />
              Not Published
            </Badge>
          )}
        </div>
        <span className="text-lg font-semibold">Points {totalPoints}</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input 
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Unnamed Quiz"
                  className="mt-1.5"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Quiz Instructions</Label>
                <Textarea 
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter quiz instructions..."
                  className="mt-1.5 min-h-[120px]"
                />
              </div>

              {/* Quiz Type & Assignment Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quiz Type</Label>
                  <Select 
                    value={formData.quizType}
                    onValueChange={(v) => setFormData({ ...formData, quizType: v as Quiz['quizType'] })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="graded-quiz">Graded Quiz</SelectItem>
                      <SelectItem value="practice-quiz">Practice Quiz</SelectItem>
                      <SelectItem value="graded-survey">Graded Survey</SelectItem>
                      <SelectItem value="ungraded-survey">Ungraded Survey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assignment Group</Label>
                  <Select 
                    value={formData.assignmentGroup}
                    onValueChange={(v) => setFormData({ ...formData, assignmentGroup: v as Quiz['assignmentGroup'] })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quizzes">Quizzes</SelectItem>
                      <SelectItem value="exams">Exams</SelectItem>
                      <SelectItem value="assignments">Assignments</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <Label className="text-base">Options</Label>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="shuffleAnswers"
                    checked={formData.shuffleAnswers}
                    onCheckedChange={(c) => setFormData({ ...formData, shuffleAnswers: !!c })}
                  />
                  <Label htmlFor="shuffleAnswers" className="font-normal">Shuffle Answers</Label>
                </div>

                <div className="flex items-center gap-4">
                  <Checkbox 
                    id="timeLimit"
                    checked={(formData.timeLimit || 0) > 0}
                    onCheckedChange={(c) => setFormData({ ...formData, timeLimit: c ? 20 : 0 })}
                  />
                  <Label htmlFor="timeLimit" className="font-normal">Time Limit</Label>
                  <Input 
                    type="number"
                    value={formData.timeLimit || ''}
                    onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                    className="w-20"
                    min={0}
                  />
                  <span className="text-sm text-muted-foreground">Minutes</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="multipleAttempts"
                    checked={formData.multipleAttempts}
                    onCheckedChange={(c) => setFormData({ ...formData, multipleAttempts: !!c })}
                  />
                  <Label htmlFor="multipleAttempts" className="font-normal">Allow Multiple Attempts</Label>
                </div>

                {formData.multipleAttempts && (
                  <div className="flex items-center gap-4 ml-6">
                    <Label className="font-normal">How Many Attempts:</Label>
                    <Input 
                      type="number"
                      value={formData.howManyAttempts || 1}
                      onChange={(e) => setFormData({ ...formData, howManyAttempts: Number(e.target.value) })}
                      className="w-20"
                      min={1}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="oneQuestionAtATime"
                    checked={formData.oneQuestionAtATime}
                    onCheckedChange={(c) => setFormData({ ...formData, oneQuestionAtATime: !!c })}
                  />
                  <Label htmlFor="oneQuestionAtATime" className="font-normal">One Question at a Time</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="webcamRequired"
                    checked={formData.webcamRequired}
                    onCheckedChange={(c) => setFormData({ ...formData, webcamRequired: !!c })}
                  />
                  <Label htmlFor="webcamRequired" className="font-normal">Webcam Required</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="lockQuestionsAfterAnswering"
                    checked={formData.lockQuestionsAfterAnswering}
                    onCheckedChange={(c) => setFormData({ ...formData, lockQuestionsAfterAnswering: !!c })}
                  />
                  <Label htmlFor="lockQuestionsAfterAnswering" className="font-normal">Lock Questions After Answering</Label>
                </div>
              </div>

              {/* Show Correct Answers */}
              <div>
                <Label>Show Correct Answers</Label>
                <Select 
                  value={formData.showCorrectAnswers}
                  onValueChange={(v) => setFormData({ ...formData, showCorrectAnswers: v as Quiz['showCorrectAnswers'] })}
                >
                  <SelectTrigger className="mt-1.5 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="after-due-date">After Due Date</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Access Code */}
              <div>
                <Label htmlFor="accessCode">Access Code</Label>
                <Input 
                  id="accessCode"
                  value={formData.accessCode || ''}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  placeholder="Optional access code"
                  className="mt-1.5 max-w-xs"
                />
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <Label className="text-base">Assign</Label>
                
                <div>
                  <Label>Due</Label>
                  <DatePickerField 
                    value={formData.dueDate}
                    onChange={(date) => setFormData({ ...formData, dueDate: date })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Available from</Label>
                    <DatePickerField 
                      value={formData.availableDate}
                      onChange={(date) => setFormData({ ...formData, availableDate: date })}
                    />
                  </div>
                  <div>
                    <Label>Until</Label>
                    <DatePickerField 
                      value={formData.untilDate}
                      onChange={(date) => setFormData({ ...formData, untilDate: date })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <div className="space-y-4">
            {/* Question List */}
            {quiz.questions.map((question, index) => (
              <div key={question.id}>
                {editingQuestionId === question.id ? (
                  <QuestionEditorWrapper
                    question={question}
                    questionType={question.type}
                    onSave={handleUpdateQuestion}
                    onCancel={() => setEditingQuestionId(null)}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-muted-foreground">
                              Question {index + 1}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {question.type === 'multiple-choice' ? 'Multiple Choice' : 
                               question.type === 'true-false' ? 'True/False' : 'Fill in Blank'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {question.points} pts
                            </span>
                          </div>
                          <h4 className="font-medium">{question.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{question.question}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingQuestionId(question.id)}
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
                )}
              </div>
            ))}

            {/* New Question Editor */}
            {isAddingQuestion && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Question Type:</Label>
                  <Select 
                    value={newQuestionType}
                    onValueChange={(v) => setNewQuestionType(v as QuestionType)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="fill-in-blank">Fill In the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <QuestionEditorWrapper
                  question={{
                    id: '',
                    type: newQuestionType,
                    title: '',
                    points: 1,
                    question: '',
                    choices: newQuestionType === 'multiple-choice' ? [
                      { id: '1', text: '', isCorrect: true },
                      { id: '2', text: '', isCorrect: false },
                    ] : undefined,
                    correctAnswer: newQuestionType === 'true-false' ? true : undefined,
                    possibleAnswers: newQuestionType === 'fill-in-blank' ? [''] : undefined,
                  }}
                  questionType={newQuestionType}
                  onSave={handleSaveNewQuestion}
                  onCancel={() => setIsAddingQuestion(false)}
                  isNew
                />
              </div>
            )}

            {/* Add Question Button */}
            {!isAddingQuestion && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={handleAddNewQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Question
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-destructive hover:bg-destructive/90">
          Save
        </Button>
        <Button onClick={handleSaveAndPublish}>
          Save & Publish
        </Button>
      </div>
    </div>
  );
};

// Date Picker Component
const DatePickerField: React.FC<{
  value?: string;
  onChange: (date: string) => void;
}> = ({ value, onChange }) => {
  const date = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal mt-1.5",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(d.toISOString())}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default QuizEditor;
