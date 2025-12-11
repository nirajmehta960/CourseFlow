// Quiz Types
export type QuizType = 'graded-quiz' | 'practice-quiz' | 'graded-survey' | 'ungraded-survey';
export type AssignmentGroup = 'quizzes' | 'exams' | 'assignments' | 'project';
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-blank';

export interface QuizChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  title: string;
  points: number;
  question: string;
  choices?: QuizChoice[]; // For multiple choice
  correctAnswer?: boolean; // For true/false
  possibleAnswers?: string[]; // For fill in blank
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  quizType: QuizType;
  assignmentGroup: AssignmentGroup;
  points: number;
  questions: QuizQuestion[];
  shuffleAnswers: boolean;
  timeLimit: number; // in minutes
  multipleAttempts: boolean;
  howManyAttempts: number;
  showCorrectAnswers: 'immediately' | 'after-due-date' | 'never';
  accessCode: string;
  oneQuestionAtATime: boolean;
  webcamRequired: boolean;
  lockQuestionsAfterAnswering: boolean;
  dueDate: string;
  availableDate: string;
  untilDate: string;
  published: boolean;
  // Student-specific
  score?: number;
  attempts?: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | boolean | number; // index for MC, boolean for TF, string for fill
}

export interface QuizAttempt {
  answers: QuizAnswer[];
  score: number;
  submittedAt: string;
}
