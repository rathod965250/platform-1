export type { Database } from './database.types'

// Common types used throughout the application
export type Role = 'student' | 'admin'
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type TestType = 'practice' | 'mock' | 'company_specific'
export type PeriodType = 'all' | 'weekly' | 'monthly'

export interface PracticeConfig {
  difficulty: string
  question_count: number
  timed: boolean
  time_limit?: number
}

export interface TestConfig {
  test_type: TestType
  question_count?: number
  difficulty?: string
  duration_minutes: number
  company_name?: string
}

export interface QuestionPaletteStatus {
  status: 'answered' | 'marked' | 'visited' | 'not-visited'
  color: string
}

