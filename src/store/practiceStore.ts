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
}

interface SessionAnswer {
  questionId: string
  userAnswer: string | null
  isCorrect: boolean | null
  timeSpent: number
  isSkipped: boolean
}

interface PracticeState {
  sessionId: string | null
  categoryId: string | null
  questions: Question[]
  currentQuestionIndex: number
  answers: SessionAnswer[]
  currentAnswer: string | null
  showFeedback: boolean
  feedbackData: {
    isCorrect: boolean
    correctAnswer: string
    explanation: string
  } | null
  score: number
  timeRemaining: number | null
  isTimed: boolean
  startTime: number | null
  
  // Actions
  setSession: (sessionId: string, categoryId: string, questions: Question[], config: { timed: boolean; time_limit?: number }) => void
  setCurrentQuestion: (index: number) => void
  setCurrentAnswer: (answer: string | null) => void
  submitAnswer: (isCorrect: boolean, correctAnswer: string, explanation: string, timeSpent: number) => void
  skipQuestion: (timeSpent: number) => void
  showFeedbackSection: (isCorrect: boolean, correctAnswer: string, explanation: string) => void
  hideFeedback: () => void
  nextQuestion: () => void
  decrementTime: () => void
  resetPractice: () => void
  getProgress: () => { completed: number; total: number; percentage: number }
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  sessionId: null,
  categoryId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  currentAnswer: null,
  showFeedback: false,
  feedbackData: null,
  score: 0,
  timeRemaining: null,
  isTimed: false,
  startTime: null,

  setSession: (sessionId, categoryId, questions, config) => set({
    sessionId,
    categoryId,
    questions,
    isTimed: config.timed,
    timeRemaining: config.timed && config.time_limit ? config.time_limit * 60 : null,
    startTime: Date.now(),
    currentQuestionIndex: 0,
    answers: [],
    currentAnswer: null,
    showFeedback: false,
    feedbackData: null,
    score: 0,
  }),

  setCurrentQuestion: (index) => set({ 
    currentQuestionIndex: index,
    currentAnswer: null,
    showFeedback: false,
    feedbackData: null,
  }),

  setCurrentAnswer: (answer) => set({ currentAnswer: answer }),

  submitAnswer: (isCorrect, correctAnswer, explanation, timeSpent) => {
    const state = get()
    const currentQuestion = state.questions[state.currentQuestionIndex]
    
    set((state) => ({
      answers: [
        ...state.answers,
        {
          questionId: currentQuestion.id,
          userAnswer: state.currentAnswer,
          isCorrect,
          timeSpent,
          isSkipped: false,
        },
      ],
      score: isCorrect ? state.score + 1 : state.score,
    }))
  },

  skipQuestion: (timeSpent) => {
    const state = get()
    const currentQuestion = state.questions[state.currentQuestionIndex]
    
    set((state) => ({
      answers: [
        ...state.answers,
        {
          questionId: currentQuestion.id,
          userAnswer: null,
          isCorrect: null,
          timeSpent,
          isSkipped: true,
        },
      ],
      currentAnswer: null,
    }))
    
    // Automatically move to next question
    get().nextQuestion()
  },

  showFeedbackSection: (isCorrect, correctAnswer, explanation) => set({
    showFeedback: true,
    feedbackData: { isCorrect, correctAnswer, explanation },
  }),

  hideFeedback: () => set({
    showFeedback: false,
    feedbackData: null,
  }),

  nextQuestion: () => {
    const state = get()
    if (state.currentQuestionIndex < state.questions.length - 1) {
      set({
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentAnswer: null,
        showFeedback: false,
        feedbackData: null,
      })
    }
  },

  decrementTime: () =>
    set((state) => ({
      timeRemaining: state.timeRemaining !== null ? Math.max(0, state.timeRemaining - 1) : null,
    })),

  resetPractice: () =>
    set({
      sessionId: null,
      categoryId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      currentAnswer: null,
      showFeedback: false,
      feedbackData: null,
      score: 0,
      timeRemaining: null,
      isTimed: false,
      startTime: null,
    }),

  getProgress: () => {
    const state = get()
    const completed = state.answers.length
    const total = state.questions.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, percentage }
  },
}))

