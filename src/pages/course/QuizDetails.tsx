import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pencil, Eye, Ban, Play } from 'lucide-react';
import { useQuizContext } from '@/contexts/QuizContext';
import { format, parseISO } from 'date-fns';

const QuizDetails = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const { getQuiz, isFaculty } = useQuizContext();

  const quiz = getQuiz(quizId || '');

  if (!quiz) {
    return (
      <div className="p-6 max-w-4xl">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'MMM d \'at\' h:mma');
    } catch {
      return '-';
    }
  };

  const quizTypeLabels = {
    'graded-quiz': 'Graded Quiz',
    'practice-quiz': 'Practice Quiz',
    'graded-survey': 'Graded Survey',
    'ungraded-survey': 'Ungraded Survey',
  };

  const assignmentGroupLabels = {
    'quizzes': 'QUIZZES',
    'exams': 'EXAMS',
    'assignments': 'ASSIGNMENTS',
    'project': 'PROJECT',
  };

  // Faculty View
  if (isFaculty) {
    return (
      <div className="p-6 max-w-4xl">
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

        {/* Quiz Title */}
        <Card className="border-dashed mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
              {!quiz.published && (
                <Badge variant="secondary" className="gap-1">
                  <Ban className="h-3 w-3" />
                  Not Published
                </Badge>
              )}
            </div>

            {/* Quiz Properties Table */}
            <div className="space-y-4">
              <PropertyRow label="Quiz Type" value={quizTypeLabels[quiz.quizType]} />
              <PropertyRow label="Points" value={quiz.points.toString()} />
              <PropertyRow label="Assignment Group" value={assignmentGroupLabels[quiz.assignmentGroup]} />
              <PropertyRow label="Shuffle Answers" value={quiz.shuffleAnswers ? 'Yes' : 'No'} />
              <PropertyRow label="Time Limit" value={`${quiz.timeLimit} Minutes`} />
              <PropertyRow label="Multiple Attempts" value={quiz.multipleAttempts ? 'Yes' : 'No'} />
              {quiz.multipleAttempts && (
                <PropertyRow label="How Many Attempts" value={quiz.howManyAttempts.toString()} />
              )}
              <PropertyRow 
                label="Show Correct Answers" 
                value={
                  quiz.showCorrectAnswers === 'immediately' ? 'Immediately' :
                  quiz.showCorrectAnswers === 'after-due-date' ? 'After Due Date' : 'Never'
                } 
              />
              <PropertyRow label="Access Code" value={quiz.accessCode || '-'} />
              <PropertyRow label="One Question at a Time" value={quiz.oneQuestionAtATime ? 'Yes' : 'No'} />
              <PropertyRow label="Webcam Required" value={quiz.webcamRequired ? 'Yes' : 'No'} />
              <PropertyRow label="Lock Questions After Answering" value={quiz.lockQuestionsAfterAnswering ? 'Yes' : 'No'} />
            </div>

            <Separator className="my-6" />

            {/* Dates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Due</th>
                    <th className="text-left py-2 font-semibold">For</th>
                    <th className="text-left py-2 font-semibold">Available from</th>
                    <th className="text-left py-2 font-semibold">Until</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3">{formatDate(quiz.dueDate)}</td>
                    <td className="py-3">Everyone</td>
                    <td className="py-3">{formatDate(quiz.availableDate)}</td>
                    <td className="py-3">{formatDate(quiz.untilDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student View
  return (
    <div className="p-6 max-w-4xl">
      <Card className="border-dashed">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">{quiz.title}</h1>

          {quiz.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-muted-foreground">{quiz.description}</p>
            </div>
          )}

          <div className="space-y-3 mb-8">
            <p><span className="font-medium">Points:</span> {quiz.points}</p>
            <p><span className="font-medium">Questions:</span> {quiz.questions.length}</p>
            <p><span className="font-medium">Time Limit:</span> {quiz.timeLimit} Minutes</p>
            <p><span className="font-medium">Attempts:</span> {quiz.attempts || 0}/{quiz.howManyAttempts}</p>
            {quiz.dueDate && (
              <p><span className="font-medium">Due:</span> {formatDate(quiz.dueDate)}</p>
            )}
          </div>

          {quiz.accessCode && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Access Code Required</label>
              <input 
                type="password" 
                placeholder="Enter access code"
                className="w-full max-w-xs px-3 py-2 border rounded-md"
              />
            </div>
          )}

          <Button 
            size="lg"
            onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}/preview`)}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const PropertyRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex">
    <span className="w-64 text-right pr-4 font-medium text-foreground">{label}</span>
    <span className="text-muted-foreground">{value}</span>
  </div>
);

export default QuizDetails;
