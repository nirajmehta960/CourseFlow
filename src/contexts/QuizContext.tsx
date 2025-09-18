import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Quiz, QuizQuestion } from '@/types/quiz';

interface QuizContextType {
  quizzes: Quiz[];
  isFaculty: boolean;
  setIsFaculty: (value: boolean) => void;
  createQuiz: () => Quiz;
  updateQuiz: (quizId: string, updates: Partial<Quiz>) => void;
  deleteQuiz: (quizId: string) => void;
  togglePublish: (quizId: string) => void;
  addQuestion: (quizId: string, question: QuizQuestion) => void;
  updateQuestion: (quizId: string, questionId: string, updates: Partial<QuizQuestion>) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  getQuiz: (quizId: string) => Quiz | undefined;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isFaculty, setIsFaculty] = useState(true);

  const createQuiz = useCallback(() => {
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: 'Unnamed Quiz',
      description: '',
      quizType: 'graded-quiz',
      assignmentGroup: 'quizzes',
      points: 0,
      questions: [],
      shuffleAnswers: true,
      timeLimit: 20,
      multipleAttempts: false,
      howManyAttempts: 1,
      showCorrectAnswers: 'immediately',
      accessCode: '',
      oneQuestionAtATime: true,
      webcamRequired: false,
      lockQuestionsAfterAnswering: false,
      dueDate: '',
      availableDate: '',
      untilDate: '',
      published: false,
    };
    setQuizzes(prev => [...prev, newQuiz]);
    return newQuiz;
  }, []);

  const updateQuiz = useCallback((quizId: string, updates: Partial<Quiz>) => {
    setQuizzes(prev => 
      prev.map(q => q.id === quizId ? { ...q, ...updates } : q)
    );
  }, []);

  const deleteQuiz = useCallback((quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
  }, []);

  const togglePublish = useCallback((quizId: string) => {
    setQuizzes(prev => 
      prev.map(q => q.id === quizId ? { ...q, published: !q.published } : q)
    );
  }, []);

  const addQuestion = useCallback((quizId: string, question: QuizQuestion) => {
    setQuizzes(prev => 
      prev.map(q => {
        if (q.id === quizId) {
          const newQuestions = [...q.questions, question];
          const newPoints = newQuestions.reduce((sum, qu) => sum + qu.points, 0);
          return { ...q, questions: newQuestions, points: newPoints };
        }
        return q;
      })
    );
  }, []);

  const updateQuestion = useCallback((quizId: string, questionId: string, updates: Partial<QuizQuestion>) => {
    setQuizzes(prev => 
      prev.map(q => {
        if (q.id === quizId) {
          const newQuestions = q.questions.map(question => 
            question.id === questionId ? { ...question, ...updates } : question
          );
          const newPoints = newQuestions.reduce((sum, qu) => sum + qu.points, 0);
          return { ...q, questions: newQuestions, points: newPoints };
        }
        return q;
      })
    );
  }, []);

  const deleteQuestion = useCallback((quizId: string, questionId: string) => {
    setQuizzes(prev => 
      prev.map(q => {
        if (q.id === quizId) {
          const newQuestions = q.questions.filter(question => question.id !== questionId);
          const newPoints = newQuestions.reduce((sum, qu) => sum + qu.points, 0);
          return { ...q, questions: newQuestions, points: newPoints };
        }
        return q;
      })
    );
  }, []);

  const getQuiz = useCallback((quizId: string) => {
    return quizzes.find(q => q.id === quizId);
  }, [quizzes]);

  return (
    <QuizContext.Provider value={{
      quizzes,
      isFaculty,
      setIsFaculty,
      createQuiz,
      updateQuiz,
      deleteQuiz,
      togglePublish,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      getQuiz,
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used within QuizProvider');
  }
  return context;
};
