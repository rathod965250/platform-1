export interface AdaptiveState {
  mastery_score: number
  current_difficulty: 'easy' | 'medium' | 'hard'
  recent_accuracy: number[]
  avg_time_seconds: number
}

export interface AdaptiveQuestion {
  id: string
  text: string
  type: 'mcq' | 'true_false' | 'fill_blank'
  options: any // Can be Record<string, string> or { options: string[] } depending on source
  difficulty: 'easy' | 'medium' | 'hard'
  subcategory: {
    id: string
    name: string
    category: {
      name: string
    }
  } | null
}

export interface AdaptiveAnalytics {
  mastery_score: number
  current_difficulty: string
  recent_accuracy: number
  questions_answered: number
}

export interface AdaptiveResponse {
  question: AdaptiveQuestion
  analytics: AdaptiveAnalytics
}

export interface SessionStats {
  avg_accuracy: number
  avg_time_seconds: number
  improvement_rate: number
  difficulty_transitions: number
  session_duration_seconds: number
  topic_wise_accuracy: Record<string, number>
  total_questions: number
  correct_questions: number
}

export interface Recommendation {
  type: 'practice' | 'time_management' | 'consistency' | 'difficulty'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  action_url: string
}

