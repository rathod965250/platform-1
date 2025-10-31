'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trophy, Medal, Award, Clock, Target, TrendingUp, Crown, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  college?: string
  score: number
  totalMarks: number
  percentage: string
  timeTaken: number
  testTitle?: string
  submittedAt: string
}

interface LeaderboardContentProps {
  currentUserId: string
  tests: any[]
  globalLeaderboard: LeaderboardEntry[]
  weeklyLeaderboard: LeaderboardEntry[]
  monthlyLeaderboard: LeaderboardEntry[]
  userGlobalRank: number
  userWeeklyRank: number
  userMonthlyRank: number
}

export function LeaderboardContent({
  currentUserId,
  tests,
  globalLeaderboard,
  weeklyLeaderboard,
  monthlyLeaderboard,
  userGlobalRank,
  userWeeklyRank,
  userMonthlyRank,
}: LeaderboardContentProps) {
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<string>('all')
  const [testLeaderboard, setTestLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoadingTestLeaderboard, setIsLoadingTestLeaderboard] = useState(false)

  const handleTestChange = async (testId: string) => {
    setSelectedTest(testId)
    
    if (testId === 'all') {
      setTestLeaderboard([])
      return
    }

    setIsLoadingTestLeaderboard(true)
    try {
      // Fetch test-specific leaderboard from client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data } = await supabase
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
        .eq('test_id', testId)
        .not('submitted_at', 'is', null)
        .order('score', { ascending: false })
        .limit(50)

      const processed = data?.map((attempt: any, index) => ({
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

      setTestLeaderboard(processed)
    } catch (error) {
      console.error('Error fetching test leaderboard:', error)
    } finally {
      setIsLoadingTestLeaderboard(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">#{rank}</span>
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    if (rank === 2) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    if (rank === 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const renderLeaderboardTable = (leaderboard: LeaderboardEntry[], emptyMessage: string) => {
    if (leaderboard.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId

          return (
            <div
              key={`${entry.userId}-${entry.submittedAt}`}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                isCurrentUser
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Rank Badge */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {entry.userName}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2">You</Badge>
                      )}
                    </h4>
                  </div>
                  {entry.college && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {entry.college}
                    </p>
                  )}
                  {entry.testTitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                      {entry.testTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                    {entry.percentage}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.score}/{entry.totalMarks}
                  </div>
                </div>

                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(entry.timeTaken)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(entry.submittedAt)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            See how you rank against other students
          </p>
        </div>

        {/* User Rank Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Global Rank
                </div>
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-4xl font-bold text-yellow-900 dark:text-yellow-100">
                {userGlobalRank > 0 ? `#${userGlobalRank}` : 'N/A'}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {userGlobalRank > 0 ? 'All-time ranking' : 'Take a test to get ranked'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Weekly Rank
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                {userWeeklyRank > 0 ? `#${userWeeklyRank}` : 'N/A'}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {userWeeklyRank > 0 ? 'Last 7 days' : 'No activity this week'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Monthly Rank
                </div>
                <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                {userMonthlyRank > 0 ? `#${userMonthlyRank}` : 'N/A'}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {userMonthlyRank > 0 ? 'Last 30 days' : 'No activity this month'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rankings
            </CardTitle>
            <CardDescription>Top performers across different time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="global" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="global">Global</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="test">By Test</TabsTrigger>
              </TabsList>

              {/* Global Leaderboard */}
              <TabsContent value="global" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    All-Time Top Performers
                  </h3>
                  <Badge variant="secondary">{globalLeaderboard.length} entries</Badge>
                </div>
                {renderLeaderboardTable(
                  globalLeaderboard,
                  'No test attempts yet. Be the first to take a test!'
                )}
              </TabsContent>

              {/* Weekly Leaderboard */}
              <TabsContent value="weekly" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    This Week's Top Performers
                  </h3>
                  <Badge variant="secondary">{weeklyLeaderboard.length} entries</Badge>
                </div>
                {renderLeaderboardTable(
                  weeklyLeaderboard,
                  'No test attempts this week. Be the first!'
                )}
              </TabsContent>

              {/* Monthly Leaderboard */}
              <TabsContent value="monthly" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    This Month's Top Performers
                  </h3>
                  <Badge variant="secondary">{monthlyLeaderboard.length} entries</Badge>
                </div>
                {renderLeaderboardTable(
                  monthlyLeaderboard,
                  'No test attempts this month. Be the first!'
                )}
              </TabsContent>

              {/* Test-Specific Leaderboard */}
              <TabsContent value="test" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Test-Specific Rankings
                  </h3>
                  <Select value={selectedTest} onValueChange={handleTestChange}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select a test...</SelectItem>
                      {tests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title}
                          {test.company_name && ` - ${test.company_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingTestLeaderboard ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">Loading leaderboard...</p>
                  </div>
                ) : selectedTest === 'all' ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a test to view its leaderboard
                    </p>
                  </div>
                ) : (
                  <>
                    <Badge variant="secondary" className="mb-2">{testLeaderboard.length} entries</Badge>
                    {renderLeaderboardTable(
                      testLeaderboard,
                      'No one has taken this test yet. Be the first!'
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="mt-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-2">Want to climb the ranks?</h3>
            <p className="text-blue-100 mb-6">
              Take more tests and improve your scores to reach the top of the leaderboard!
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push('/test')}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Take a Test Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
