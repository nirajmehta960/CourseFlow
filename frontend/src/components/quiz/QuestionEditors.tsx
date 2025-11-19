import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { QuizQuestion, QuestionType, QuizChoice } from '@/types/quiz';

interface QuestionEditorProps {
  question: QuizQuestion;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
  isNew?: boolean;
}

// Multiple Choice Editor
export const MultipleChoiceEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  isNew = false
}) => {
  const [title, setTitle] = useState(question.title);
  const [points, setPoints] = useState(question.points);
  const [questionText, setQuestionText] = useState(question.question);
  const [choices, setChoices] = useState<QuizChoice[]>(
    question.choices || [
      { id: '1', text: '', isCorrect: true },
      { id: '2', text: '', isCorrect: false },
    ]
  );

  const addChoice = () => {
    setChoices([...choices, { id: `${Date.now()}`, text: '', isCorrect: false }]);
  };

  const removeChoice = (id: string) => {
    if (choices.length > 2) {
      setChoices(choices.filter(c => c.id !== id));
    }
  };

  const updateChoice = (id: string, text: string) => {
    setChoices(choices.map(c => c.id === id ? { ...c, text } : c));
  };

  const setCorrectChoice = (id: string) => {
    setChoices(choices.map(c => ({ ...c, isCorrect: c.id === id })));
  };

  const handleSave = () => {
    onSave({
      ...question,
      title,
      points,
      question: questionText,
      choices,
      type: 'multiple-choice',
    });
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question Title"
            className="flex-1 max-w-xs"
          />
          <Select value="multiple-choice" disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">pts:</span>
            <Input 
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-20"
              min={0}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Enter your question and multiple answers, then select the one correct answer.
        </p>

        {/* Question */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Question:</Label>
          <Textarea 
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here..."
            className="min-h-[100px]"
          />
        </div>

        {/* Answers */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Answers:</Label>
          <div className="space-y-3">
            {choices.map((choice) => (
              <div key={choice.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectChoice(choice.id)}
                  className={`flex items-center gap-2 min-w-[140px] ${
                    choice.isCorrect ? 'text-success font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {choice.isCorrect && <ArrowRight className="h-4 w-4 text-success" />}
                  {choice.isCorrect ? 'Correct Answer' : 'Possible Answer'}
                </button>
                <Input 
                  value={choice.text}
                  onChange={(e) => updateChoice(choice.id, e.target.value)}
                  placeholder="Enter answer..."
                  className="flex-1"
                />
                {choices.length > 2 && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeChoice(choice.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button 
            variant="link" 
            onClick={addChoice}
            className="mt-3 text-primary p-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Answer
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-destructive hover:bg-destructive/90">
            {isNew ? 'Save Question' : 'Update Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// True/False Editor
export const TrueFalseEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  isNew = false
}) => {
  const [title, setTitle] = useState(question.title);
  const [points, setPoints] = useState(question.points);
  const [questionText, setQuestionText] = useState(question.question);
  const [correctAnswer, setCorrectAnswer] = useState<boolean>(question.correctAnswer ?? true);

  const handleSave = () => {
    onSave({
      ...question,
      title,
      points,
      question: questionText,
      correctAnswer,
      type: 'true-false',
    });
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question Title"
            className="flex-1 max-w-xs"
          />
          <Select value="true-false" disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true-false">True/False</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">pts:</span>
            <Input 
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-20"
              min={0}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Enter your question text, then select if True or False is the correct answer.
        </p>

        {/* Question */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Question:</Label>
          <Textarea 
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here..."
            className="min-h-[100px]"
          />
        </div>

        {/* Answers */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Answers:</Label>
          <RadioGroup 
            value={correctAnswer ? 'true' : 'false'}
            onValueChange={(v) => setCorrectAnswer(v === 'true')}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              {correctAnswer === true && <ArrowRight className="h-4 w-4 text-success" />}
              <RadioGroupItem value="true" id="true" />
              <Label 
                htmlFor="true" 
                className={correctAnswer ? 'text-success font-medium' : 'text-foreground'}
              >
                True
              </Label>
            </div>
            <div className="flex items-center gap-3">
              {correctAnswer === false && <ArrowRight className="h-4 w-4 text-success" />}
              <RadioGroupItem value="false" id="false" />
              <Label 
                htmlFor="false"
                className={!correctAnswer ? 'text-success font-medium' : 'text-foreground'}
              >
                False
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-destructive hover:bg-destructive/90">
            {isNew ? 'Save Question' : 'Update Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Fill in the Blank Editor
export const FillInBlankEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  isNew = false
}) => {
  const [title, setTitle] = useState(question.title);
  const [points, setPoints] = useState(question.points);
  const [questionText, setQuestionText] = useState(question.question);
  const [possibleAnswers, setPossibleAnswers] = useState<string[]>(
    question.possibleAnswers || ['']
  );

  const addAnswer = () => {
    setPossibleAnswers([...possibleAnswers, '']);
  };

  const removeAnswer = (index: number) => {
    if (possibleAnswers.length > 1) {
      setPossibleAnswers(possibleAnswers.filter((_, i) => i !== index));
    }
  };

  const updateAnswer = (index: number, value: string) => {
    setPossibleAnswers(possibleAnswers.map((a, i) => i === index ? value : a));
  };

  const handleSave = () => {
    onSave({
      ...question,
      title,
      points,
      question: questionText,
      possibleAnswers: possibleAnswers.filter(a => a.trim() !== ''),
      type: 'fill-in-blank',
    });
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question Title"
            className="flex-1 max-w-xs"
          />
          <Select value="fill-in-blank" disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fill-in-blank">Fill In the Blank</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">pts:</span>
            <Input 
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-20"
              min={0}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Enter your question text, then define all possible correct answers for the blank.
          Students will see the question followed by a small text box to type their answer.
        </p>

        {/* Question */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Question:</Label>
          <Textarea 
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question with a blank (e.g., 'The capital of France is _____.')"
            className="min-h-[100px]"
          />
        </div>

        {/* Answers */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Answers:</Label>
          <div className="space-y-3">
            {possibleAnswers.map((answer, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground min-w-[120px]">Possible Answer:</span>
                <Input 
                  value={answer}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  placeholder="Enter possible answer..."
                  className="flex-1"
                />
                {possibleAnswers.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeAnswer(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button 
            variant="link" 
            onClick={addAnswer}
            className="mt-3 text-primary p-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Answer
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-destructive hover:bg-destructive/90">
            {isNew ? 'Save Question' : 'Update Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Question Editor wrapper that selects the right editor
interface QuestionEditorWrapperProps {
  question: QuizQuestion;
  questionType: QuestionType;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
  isNew?: boolean;
}

export const QuestionEditorWrapper: React.FC<QuestionEditorWrapperProps> = ({
  question,
  questionType,
  onSave,
  onCancel,
  isNew
}) => {
  switch (questionType) {
    case 'true-false':
      return <TrueFalseEditor question={question} onSave={onSave} onCancel={onCancel} isNew={isNew} />;
    case 'fill-in-blank':
      return <FillInBlankEditor question={question} onSave={onSave} onCancel={onCancel} isNew={isNew} />;
    case 'multiple-choice':
    default:
      return <MultipleChoiceEditor question={question} onSave={onSave} onCancel={onCancel} isNew={isNew} />;
  }
};
