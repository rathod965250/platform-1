import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { RecentActivityContent } from '@/components/recent-activity/RecentActivityContent'

export const metadata = {
  title: 'Recent Activity | Aptitude Preparation Platform',
  description: 'View your recent tests and practice sessions',
}

export default async function RecentActivityPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch test attempts
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      total_questions,
      correct_answers,
      time_taken_seconds,
      submitted_at,
      test:tests(
        id,
        title,
        test_type,
        total_marks
      )
    `)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  // Fetch practice sessions
  const { data: practiceSessions } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  // Calculate statistics for DashboardShell
  const totalTests = testAttempts?.length || 0
  const totalPractice = practiceSessions?.length || 0
  const totalQuestionsAnswered = (testAttempts?.reduce((sum, attempt) => sum + attempt.total_questions, 0) || 0) +
    (practiceSessions?.reduce((sum, session) => sum + session.total_questions, 0) || 0)

  const avgScore = totalTests > 0
    ? testAttempts!.reduce((sum, attempt) => {
        const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
        const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
        if (!testObj || typeof testObj !== 'object' || !('total_marks' in testObj) || !testObj.total_marks) {
          return sum
        }
        const totalMarks = typeof testObj.total_marks === 'number' ? testObj.total_marks : 0
        if (totalMarks === 0) return sum
        const percentage = (attempt.score / totalMarks) * 100
        return sum + percentage
      }, 0) / totalTests
    : 0

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const hasRecentActivity = 
    (testAttempts?.some(a => new Date(a.submitted_at!) > last24h)) ||
    (practiceSessions?.some(s => new Date(s.completed_at) > last24h))
  const currentStreak = hasRecentActivity ? 1 : 0

  // Get all recent activity (combine tests and practice sessions)
  const recentActivity = [
    ...(testAttempts?.map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      return {
        type: 'test' as const,
        id: attempt.id,
        title: (testObj && 'title' in testObj ? String(testObj.title) : 'Test'),
        date: attempt.submitted_at || new Date().toISOString(),
        score: attempt.score,
        totalMarks: (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100),
        testId: (testObj && 'id' in testObj ? String(testObj.id) : undefined) || undefined,
      }
    }) || []),
    ...(practiceSessions?.map(session => ({
      type: 'practice' as const,
      id: session.id,
      title: `Practice Session`,
      date: session.completed_at,
      score: session.correct_answers,
      totalMarks: session.total_questions,
    })) || []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Get performance trend for DashboardShell (empty for this page)
  const performanceTrend: Array<{
    index: number
    score: string
    date: string
  }> = []

  // Get weak areas for DashboardShell (empty for this page)
  const weakAreas: string[] = []

  // Get adaptive states for DashboardShell (empty for this page)
  const adaptiveStates: any[] = []

  return (
    <DashboardShell
      profile={profile}
      stats={{
        totalTests,
        avgScore,
        totalQuestionsAnswered,
        currentStreak,
      }}
      recentActivity={[]}
      performanceTrend={performanceTrend}
      weakAreas={weakAreas}
      adaptiveStates={adaptiveStates}
    >
      <RecentActivityContent recentActivity={recentActivity} />
    </DashboardShell>
  )
}

