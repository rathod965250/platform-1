import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardContent } from '@/components/leaderboard/LeaderboardContent'

export const metadata = {
  title: 'Leaderboard | Aptitude Preparation Platform',
  description: 'See how you rank against other students',
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all published tests for filter dropdown
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, test_type, company_name')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Fetch global leaderboard (all-time top performers)
  const { data: globalLeaderboard } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      time_taken_seconds,
      submitted_at,
      user:profiles!test_attempts_user_id_fkey(
        id,
        full_name,
        college
      ),
      test:tests(
        id,
        title,
        total_marks
      )
    `)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .limit(50)

  // Calculate ranks and percentages for global leaderboard
  const processedGlobalLeaderboard = globalLeaderboard?.map((attempt: any, index) => ({
    rank: index + 1,
    userId: attempt.user?.id,
    userName: attempt.user?.full_name || 'Anonymous',
    college: attempt.user?.college,
    score: attempt.score,
    totalMarks: attempt.test?.total_marks || 100,
    percentage: ((attempt.score / (attempt.test?.total_marks || 100)) * 100).toFixed(1),
    timeTaken: attempt.time_taken_seconds,
    testTitle: attempt.test?.title,
    submittedAt: attempt.submitted_at,
  })) || []

  // Find current user's global rank
  const userGlobalRank = processedGlobalLeaderboard.findIndex(
    (entry) => entry.userId === user.id
  ) + 1

  // Fetch weekly leaderboard (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: weeklyLeaderboard } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      time_taken_seconds,
      submitted_at,
      user:profiles!test_attempts_user_id_fkey(
        id,
        full_name,
        college
      ),
      test:tests(
        id,
        title,
        total_marks
      )
    `)
    .gte('submitted_at', weekAgo)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .limit(50)

  const processedWeeklyLeaderboard = weeklyLeaderboard?.map((attempt: any, index) => ({
    rank: index + 1,
    userId: attempt.user?.id,
    userName: attempt.user?.full_name || 'Anonymous',
    college: attempt.user?.college,
    score: attempt.score,
    totalMarks: attempt.test?.total_marks || 100,
    percentage: ((attempt.score / (attempt.test?.total_marks || 100)) * 100).toFixed(1),
    timeTaken: attempt.time_taken_seconds,
    testTitle: attempt.test?.title,
    submittedAt: attempt.submitted_at,
  })) || []

  const userWeeklyRank = processedWeeklyLeaderboard.findIndex(
    (entry) => entry.userId === user.id
  ) + 1

  // Fetch monthly leaderboard (last 30 days)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: monthlyLeaderboard } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      time_taken_seconds,
      submitted_at,
      user:profiles!test_attempts_user_id_fkey(
        id,
        full_name,
        college
      ),
      test:tests(
        id,
        title,
        total_marks
      )
    `)
    .gte('submitted_at', monthAgo)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .limit(50)

  const processedMonthlyLeaderboard = monthlyLeaderboard?.map((attempt: any, index) => ({
    rank: index + 1,
    userId: attempt.user?.id,
    userName: attempt.user?.full_name || 'Anonymous',
    college: attempt.user?.college,
    score: attempt.score,
    totalMarks: attempt.test?.total_marks || 100,
    percentage: ((attempt.score / (attempt.test?.total_marks || 100)) * 100).toFixed(1),
    timeTaken: attempt.time_taken_seconds,
    testTitle: attempt.test?.title,
    submittedAt: attempt.submitted_at,
  })) || []

  const userMonthlyRank = processedMonthlyLeaderboard.findIndex(
    (entry) => entry.userId === user.id
  ) + 1

  return (
    <LeaderboardContent
      currentUserId={user.id}
      tests={tests || []}
      globalLeaderboard={processedGlobalLeaderboard}
      weeklyLeaderboard={processedWeeklyLeaderboard}
      monthlyLeaderboard={processedMonthlyLeaderboard}
      userGlobalRank={userGlobalRank}
      userWeeklyRank={userWeeklyRank}
      userMonthlyRank={userMonthlyRank}
    />
  )
}
