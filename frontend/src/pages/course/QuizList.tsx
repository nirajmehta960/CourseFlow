import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  CheckCircle2,
  Ban,
  FileText,
} from 'lucide-react';
import { useQuizContext } from '@/contexts/QuizContext';
import { Quiz } from '@/types/quiz';
import { format, parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';

const QuizList = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { quizzes, isFaculty, createQuiz, deleteQuiz, togglePublish } = useQuizContext();

  const handleAddQuiz = () => {
    const newQuiz = createQuiz();
    navigate(`/courses/${courseId}/quizzes/${newQuiz.id}/edit`);
  };

  const handleQuizClick = (quizId: string) => {
    navigate(`/courses/${courseId}/quizzes/${quizId}`);
  };

  const getAvailabilityStatus = (quiz: Quiz) => {
    const now = new Date();
    
    if (!quiz.availableDate && !quiz.untilDate) {
      return { text: 'No dates set', className: 'text-muted-foreground' };
    }

    try {
      const availableDate = quiz.availableDate ? parseISO(quiz.availableDate) : null;
      const untilDate = quiz.untilDate ? parseISO(quiz.untilDate) : null;

      if (untilDate && isAfter(now, untilDate)) {
        return { text: 'Closed', className: 'text-destructive' };
      }

      if (availableDate && isBefore(now, availableDate)) {
        return { 
          text: `Not available until ${format(availableDate, 'MMM d \'at\' h:mma')}`, 
          className: 'text-warning' 
        };
      }

      if (availableDate && untilDate && isWithinInterval(now, { start: availableDate, end: untilDate })) {
        return { text: 'Available', className: 'text-success' };
      }

      if (availableDate && !untilDate && isAfter(now, availableDate)) {
        return { text: 'Available', className: 'text-success' };
      }

      return { text: 'Available', className: 'text-success' };
    } catch {
      return { text: 'No dates set', className: 'text-muted-foreground' };
    }
  };

  // Empty state
  if (quizzes.length === 0) {
    return (
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-foreground">Quizzes</h2>
          {isFaculty && (
            <Button onClick={handleAddQuiz}>
              <Plus className="h-4 w-4 mr-2" />
              Quiz
            </Button>
          )}
        </div>

        {/* Empty State */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Quizzes Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {isFaculty 
                ? 'Create your first quiz by clicking the "+ Quiz" button above.'
                : 'No quizzes have been published for this course yet.'}
            </p>
            {isFaculty && (
              <Button onClick={handleAddQuiz}>
                <Plus className="h-4 w-4 mr-2" />
                Add Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-foreground">Quizzes</h2>
        {isFaculty && (
          <Button onClick={handleAddQuiz}>
            <Plus className="h-4 w-4 mr-2" />
            Quiz
          </Button>
        )}
      </div>

      {/* Quiz List */}
      <div className="space-y-3">
        {quizzes.map((quiz) => {
          const availability = getAvailabilityStatus(quiz);
          
          return (
            <Card key={quiz.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Publish Status Toggle */}
                    {isFaculty && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublish(quiz.id);
                        }}
                        className="mt-1"
                        title={quiz.published ? 'Unpublish' : 'Publish'}
                      >
                        {quiz.published ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Ban className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    )}

                    {/* Quiz Info */}
                    <div className="flex-1 cursor-pointer" onClick={() => handleQuizClick(quiz.id)}>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                        {quiz.title}
                      </h3>
                      
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p className={availability.className}>
                          {availability.text}
                        </p>
                        {quiz.dueDate && (
                          <p>
                            <span className="font-medium">Due:</span>{' '}
                            {format(parseISO(quiz.dueDate), 'MMM d \'at\' h:mma')}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">{quiz.points}</span> pts | {' '}
                          <span className="font-medium">{quiz.questions.length}</span> Questions
                        </p>
                        {!isFaculty && quiz.score !== undefined && (
                          <p className="text-success font-medium">
                            Score: {quiz.score}/{quiz.points}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Context Menu */}
                  {isFaculty && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/courses/${courseId}/quizzes/${quiz.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(quiz.id)}>
                          {quiz.published ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteQuiz(quiz.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuizList;
