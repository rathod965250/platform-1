import { create } from 'zustand'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
  marks: number
  difficulty: 'easy' | 'medium' | 'hard'
  subcategory_id: string
  order: number
}

interface Answer {
  answer: string | null
  isMarked: boolean
  timeSpent: number
}

interface TestState {
  testId: string | null
  questions: Question[]
  currentQuestionIndex: number
  answers: Record<string, Answer>
  timeRemaining: number
  isFullscreen: boolean
  startTime: number | null
  
  // Actions
  setTest: (testId: string, questions: Question[], duration: number) => void
  setCurrentQuestion: (index: number) => void
  setAnswer: (questionId: string, answer: string | null) => void
  toggleMarkForReview: (questionId: string) => void
  setTimeRemaining: (time: number) => void
  decrementTime: () => void
  setFullscreen: (isFullscreen: boolean) => void
  updateTimeSpent: (questionId: string, timeSpent: number) => void
  resetTest: () => void
  getQuestionStatus: (questionId: string) => 'answered' | 'marked' | 'visited' | 'not-visited'
}

export const useTestStore = create<TestState>((set, get) => ({
  testId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 0,
  isFullscreen: false,
  startTime: null,

  setTest: (testId, questions, duration) => set({
    testId,
    questions,
    timeRemaining: duration * 60, // Convert minutes to seconds
    answers: {},
    currentQuestionIndex: 0,
    startTime: Date.now(),
  }),

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          answer,
          timeSpent: state.answers[questionId]?.timeSpent || 0,
          isMarked: state.answers[questionId]?.isMarked || false,
        },
      },
    })),

  toggleMarkForReview: (questionId) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          answer: state.answers[questionId]?.answer || null,
          timeSpent: state.answers[questionId]?.timeSpent || 0,
          isMarked: !state.answers[questionId]?.isMarked,
        },
      },
    })),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  decrementTime: () =>
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
    })),

  setFullscreen: (isFullscreen) => set({ isFullscreen }),

  updateTimeSpent: (questionId, timeSpent) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          answer: state.answers[questionId]?.answer || null,
          isMarked: state.answers[questionId]?.isMarked || false,
          timeSpent,
        },
      },
    })),

  resetTest: () =>
    set({
      testId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: 0,
      isFullscreen: false,
      startTime: null,
    }),

  getQuestionStatus: (questionId) => {
    const answer = get().answers[questionId]
    
    if (!answer) return 'not-visited'
    if (answer.isMarked) return 'marked'
    if (answer.answer) return 'answered'
    return 'visited'
  },
}))

