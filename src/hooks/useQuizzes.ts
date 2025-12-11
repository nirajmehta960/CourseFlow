import { useState, useCallback } from 'react';
import { Quiz, QuizQuestion } from '@/types/quiz';

// Mock initial quizzes - empty by default per requirements
const initialQuizzes: Quiz[] = [];

export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);

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
          const newPoints = newQuestions.reduce((sum, q) => sum + q.points, 0);
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
          const newPoints = newQuestions.reduce((sum, q) => sum + q.points, 0);
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
          const newPoints = newQuestions.reduce((sum, q) => sum + q.points, 0);
          return { ...q, questions: newQuestions, points: newPoints };
        }
        return q;
      })
    );
  }, []);

  const getQuiz = useCallback((quizId: string) => {
    return quizzes.find(q => q.id === quizId);
  }, [quizzes]);

  return {
    quizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    togglePublish,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getQuiz,
  };
};
