import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Pencil, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { useQuizContext } from '@/contexts/QuizContext';
import { QuizAnswer, QuizQuestion } from '@/types/quiz';
import { format } from 'date-fns';

const QuizPreview = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const { getQuiz, isFaculty } = useQuizContext();

  const quiz = getQuiz(quizId || '');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  if (!quiz) {
    return (
      <div className="p-6 max-w-4xl">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const handleAnswer = (questionId: string, answer: string | boolean | number) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
      }
      return [...prev, { questionId, answer }];
    });
  };

  const getAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.answer;
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach(question => {
      const answer = getAnswer(question.id);
      if (answer === undefined) return;

      switch (question.type) {
        case 'multiple-choice':
          const correctChoice = question.choices?.find(c => c.isCorrect);
          if (correctChoice && answer === correctChoice.id) {
            correct += question.points;
          }
          break;
        case 'true-false':
          if (answer === question.correctAnswer) {
            correct += question.points;
          }
          break;
        case 'fill-in-blank':
          const answerStr = String(answer).toLowerCase().trim();
          const isCorrect = question.possibleAnswers?.some(
            pa => pa.toLowerCase().trim() === answerStr
          );
          if (isCorrect) {
            correct += question.points;
          }
          break;
      }
    });
    return correct;
  };

  const handleSubmit = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
  };

  const isQuestionCorrect = (question: QuizQuestion) => {
    const answer = getAnswer(question.id);
    if (answer === undefined) return false;

    switch (question.type) {
      case 'multiple-choice':
        const correctChoice = question.choices?.find(c => c.isCorrect);
        return correctChoice && answer === correctChoice.id;
      case 'true-false':
        return answer === question.correctAnswer;
      case 'fill-in-blank':
        const answerStr = String(answer).toLowerCase().trim();
        return question.possibleAnswers?.some(
          pa => pa.toLowerCase().trim() === answerStr
        );
      default:
        return false;
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-4">{quiz.title}</h1>

      {/* Preview Alert */}
      {isFaculty && (
        <Alert className="mb-6 border-warning bg-warning/10">
          <Info className="h-4 w-4 text-warning" />
          <AlertDescription>
            This is a preview of the published version of the quiz
          </AlertDescription>
        </Alert>
      )}

      {/* Quiz Info */}
      <p className="text-sm text-muted-foreground mb-2">
        Started: {format(new Date(), 'MMM d \'at\' h:mma')}
      </p>

      {quiz.description && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Quiz Instructions</h3>
          <p className="text-muted-foreground">{quiz.description}</p>
        </div>
      )}

      {/* Results Summary (after submission) */}
      {isSubmitted && (
        <Card className="mb-6 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Quiz Completed!</h3>
                <p className="text-muted-foreground">
                  You scored {score} out of {quiz.points} points ({Math.round((score! / quiz.points) * 100)}%)
                </p>
              </div>
              {isFaculty && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}/edit?tab=questions`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Keep Editing This Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {quiz.questions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No questions in this quiz yet.</p>
                {isFaculty && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}/edit?tab=questions`)}
                  >
                    Add Questions
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : quiz.oneQuestionAtATime ? (
            // One question at a time view
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  {isSubmitted && (
                    isQuestionCorrect(currentQuestion) ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )
                  )}
                  <span className="font-semibold">Question {currentQuestionIndex + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">{currentQuestion.points} pts</span>
              </CardHeader>
              <CardContent className="p-6">
                <QuestionRenderer 
                  question={currentQuestion}
                  answer={getAnswer(currentQuestion.id)}
                  onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
                  isSubmitted={isSubmitted}
                />

                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button 
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(i => i - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(i => i + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : !isSubmitted && (
                    <Button onClick={handleSubmit}>
                      Submit Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // All questions view
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      {isSubmitted && (
                        isQuestionCorrect(question) ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )
                      )}
                      <span className="font-semibold">Question {index + 1}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{question.points} pts</span>
                  </CardHeader>
                  <CardContent className="p-6">
                    <QuestionRenderer 
                      question={question}
                      answer={getAnswer(question.id)}
                      onAnswer={(answer) => handleAnswer(question.id, answer)}
                      isSubmitted={isSubmitted}
                    />
                  </CardContent>
                </Card>
              ))}

              {!isSubmitted && (
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSubmit}>
                    Submit Quiz
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Question Navigation */}
        <div className="lg:col-span-1">
          {isFaculty && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}/edit?tab=questions`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Keep Editing This Quiz
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Questions</h3>
              <div className="space-y-1">
                {quiz.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                      currentQuestionIndex === index ? 'bg-muted' : ''
                    }`}
                  >
                    {isSubmitted && (
                      isQuestionCorrect(question) ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )
                    )}
                    <span className={`${getAnswer(question.id) !== undefined ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      Question {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {!isSubmitted && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Quiz saved at {format(new Date(), 'h:mma')}
              </p>
              <Button className="w-full" onClick={handleSubmit}>
                Submit Quiz
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Question Renderer Component
const QuestionRenderer: React.FC<{
  question: QuizQuestion;
  answer: string | boolean | number | undefined;
  onAnswer: (answer: string | boolean | number) => void;
  isSubmitted: boolean;
}> = ({ question, answer, onAnswer, isSubmitted }) => {
  switch (question.type) {
    case 'multiple-choice':
      return (
        <div>
          <p className="mb-4">{question.question}</p>
          <RadioGroup 
            value={answer as string || ''} 
            onValueChange={onAnswer}
            disabled={isSubmitted}
          >
            {question.choices?.map((choice) => (
              <div 
                key={choice.id} 
                className={`flex items-center space-x-2 p-2 rounded ${
                  isSubmitted && choice.isCorrect ? 'bg-success/10' : ''
                }`}
              >
                <RadioGroupItem value={choice.id} id={choice.id} />
                <Label htmlFor={choice.id} className="cursor-pointer">{choice.text}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'true-false':
      return (
        <div>
          <p className="mb-4">{question.question}</p>
          <RadioGroup 
            value={answer === true ? 'true' : answer === false ? 'false' : ''} 
            onValueChange={(v) => onAnswer(v === 'true')}
            disabled={isSubmitted}
          >
            <div className={`flex items-center space-x-2 p-2 rounded ${
              isSubmitted && question.correctAnswer === true ? 'bg-success/10' : ''
            }`}>
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className={`flex items-center space-x-2 p-2 rounded ${
              isSubmitted && question.correctAnswer === false ? 'bg-success/10' : ''
            }`}>
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        </div>
      );

    case 'fill-in-blank':
      return (
        <div>
          <p className="mb-4">{question.question}</p>
          <Input 
            value={answer as string || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your answer here..."
            disabled={isSubmitted}
            className="max-w-md"
          />
          {isSubmitted && (
            <p className="text-sm text-muted-foreground mt-2">
              Correct answers: {question.possibleAnswers?.join(', ')}
            </p>
          )}
        </div>
      );

    default:
      return <p>Unknown question type</p>;
  }
};

export default QuizPreview;
