/**
 * Utility functions for calculating milestones, achievements, and progress metrics
 */

// Milestone thresholds
export const QUESTION_MILESTONES = [50, 100, 250, 500, 1000, 2500]
export const TEST_MILESTONES = [5, 10, 25, 50, 100]
export const SCORE_MILESTONES = [50, 60, 70, 80, 90]
export const STREAK_MILESTONES = [3, 7, 14, 30]

export interface ProgressToMilestone {
  current: number
  target: number
  percentage: number
  label: string
}

/**
 * Calculate progress toward next milestone for questions
 */
export function calculateQuestionMilestone(currentQuestions: number): ProgressToMilestone {
  const nextMilestone = QUESTION_MILESTONES.find(m => m > currentQuestions) || QUESTION_MILESTONES[QUESTION_MILESTONES.length - 1]
  const percentage = (currentQuestions / nextMilestone) * 100
  
  return {
    current: currentQuestions,
    target: nextMilestone,
    percentage: Math.min(percentage, 100),
    label: `${currentQuestions} questions completed`
  }
}

/**
 * Calculate progress toward next milestone for tests
 */
export function calculateTestMilestone(currentTests: number): ProgressToMilestone {
  const nextMilestone = TEST_MILESTONES.find(m => m > currentTests) || TEST_MILESTONES[TEST_MILESTONES.length - 1]
  const percentage = (currentTests / nextMilestone) * 100
  
  return {
    current: currentTests,
    target: nextMilestone,
    percentage: Math.min(percentage, 100),
    label: `${currentTests} tests completed`
  }
}

/**
 * Calculate progress toward next score milestone
 */
export function calculateScoreMilestone(avgScore: number): ProgressToMilestone {
  const nextMilestone = SCORE_MILESTONES.find(m => m > avgScore) || SCORE_MILESTONES[SCORE_MILESTONES.length - 1]
  const percentage = (avgScore / nextMilestone) * 100
  
  return {
    current: avgScore,
    target: nextMilestone,
    percentage: Math.min(percentage, 100),
    label: `Average score: ${avgScore.toFixed(1)}%`
  }
}

/**
 * Calculate progress toward next streak milestone
 */
export function calculateStreakMilestone(currentStreak: number): ProgressToMilestone {
  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1]
  const percentage = (currentStreak / nextMilestone) * 100
  
  return {
    current: currentStreak,
    target: nextMilestone,
    percentage: Math.min(percentage, 100),
    label: `${currentStreak} day streak`
  }
}

/**
 * Calculate percentile from rank and total users
 */
export function calculatePercentile(rank: number, totalUsers: number): number {
  if (totalUsers === 0 || rank === 0) return 0
  return ((totalUsers - rank + 1) / totalUsers) * 100
}

/**
 * Get percentile label (e.g., "Top 15%")
 */
export function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Top 50%'
  if (percentile >= 25) return 'Top 75%'
  return 'Top 100%'
}

/**
 * Calculate week-over-week improvement percentage
 */
export function calculateWeekOverWeekImprovement(
  currentWeekAvg: number,
  previousWeekAvg: number
): number {
  if (previousWeekAvg === 0) return currentWeekAvg > 0 ? 100 : 0
  return ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
}

/**
 * Generate motivational message based on rank
 */
export function getRankMotivationalMessage(rank: number, totalUsers: number): string {
  if (rank === 0) return "Take your first test to see your rank!"
  if (rank === 1) return "🏆 You're #1! Amazing work!"
  if (rank <= 3) return `🌟 You're in the top ${rank}! Keep it up!`
  if (rank <= 10) return `⭐ You're in the top 10! Great job!`
  
  const percentile = calculatePercentile(rank, totalUsers)
  if (percentile >= 75) return "🎯 You're doing great! Top 25%!"
  if (percentile >= 50) return "💪 Keep practicing to climb higher!"
  return "🚀 Start practicing to improve your rank!"
}

/**
 * Generate motivational message based on progress
 */
export function getProgressMotivationalMessage(percentage: number, label: string): string {
  if (percentage >= 90) return `Almost there! Just ${Math.round((100 - percentage) * 10) / 10}% to go!`
  if (percentage >= 75) return "You're making excellent progress!"
  if (percentage >= 50) return "You're halfway there! Keep going!"
  if (percentage >= 25) return "Great start! Keep building momentum!"
  return "Every journey starts with a single step!"
}

/**
 * Get achievement based on milestones reached
 */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
}

export function getAchievements(
  totalQuestions: number,
  totalTests: number,
  avgScore: number,
  currentStreak: number
): Achievement[] {
  const achievements: Achievement[] = []

  // Question achievements
  QUESTION_MILESTONES.forEach(milestone => {
    achievements.push({
      id: `questions_${milestone}`,
      name: `${milestone} Questions Master`,
      description: `Complete ${milestone} questions`,
      icon: '📚',
      unlocked: totalQuestions >= milestone,
      progress: Math.min((totalQuestions / milestone) * 100, 100)
    })
  })

  // Test achievements
  TEST_MILESTONES.forEach(milestone => {
    achievements.push({
      id: `tests_${milestone}`,
      name: `${milestone} Test Champion`,
      description: `Complete ${milestone} tests`,
      icon: '🎯',
      unlocked: totalTests >= milestone,
      progress: Math.min((totalTests / milestone) * 100, 100)
    })
  })

  // Score achievements
  SCORE_MILESTONES.forEach(milestone => {
    achievements.push({
      id: `score_${milestone}`,
      name: `${milestone}% Club`,
      description: `Achieve ${milestone}% average score`,
      icon: '⭐',
      unlocked: avgScore >= milestone,
      progress: Math.min((avgScore / milestone) * 100, 100)
    })
  })

  // Streak achievements
  STREAK_MILESTONES.forEach(milestone => {
    achievements.push({
      id: `streak_${milestone}`,
      name: `${milestone} Day Warrior`,
      description: `Maintain a ${milestone} day streak`,
      icon: '🔥',
      unlocked: currentStreak >= milestone,
      progress: Math.min((currentStreak / milestone) * 100, 100)
    })
  })

  return achievements.sort((a, b) => {
    // Sort unlocked first, then by progress
    if (a.unlocked && !b.unlocked) return -1
    if (!a.unlocked && b.unlocked) return 1
    return b.progress - a.progress
  })
}

/**
 * Get next achievement to unlock
 */
export function getNextAchievement(achievements: Achievement[]): Achievement | null {
  return achievements.find(a => !a.unlocked && a.progress > 0) || null
}

