'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Medal, Award, Crown, Clock } from 'lucide-react'

interface TestLeaderboardEntry {
  rank: number
  userId: string
  fullName: string
  college: string | null
  score: number
  totalMarks: number
  percentage: number
  timeTaken: number
  submittedAt: string
}

interface TestLeaderboardProps {
  testId: string
  currentUserId: string
}

export function TestLeaderboard({ testId, currentUserId }: TestLeaderboardProps) {
  const [rankings, setRankings] = useState<TestLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [testInfo, setTestInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        // Fetch test info
        const { data: test } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single()

        setTestInfo(test)

        // Fetch all attempts for this test
        const { data: attempts } = await supabase
          .from('test_attempts')
          .select(`
            *,
            user:profiles!test_attempts_user_id_fkey(
              full_name,
              college
            )
          `)
          .eq('test_id', testId)
          .not('submitted_at', 'is', null)
          .order('score', { ascending: false })
          .order('time_taken_seconds', { ascending: true })
          .order('submitted_at', { ascending: true })
          .limit(200)

        if (attempts) {
          const bestByUser = new Map<string, any>()
          attempts.forEach((attempt: any) => {
            const uid = attempt.user_id
            if (!uid) return
            if (!bestByUser.has(uid)) {
              bestByUser.set(uid, attempt)
              return
            }
            const prev = bestByUser.get(uid)
            if (
              attempt.score > prev.score ||
              (attempt.score === prev.score && attempt.time_taken_seconds < prev.time_taken_seconds) ||
              (attempt.score === prev.score && attempt.time_taken_seconds === prev.time_taken_seconds && new Date(attempt.submitted_at).getTime() < new Date(prev.submitted_at).getTime())
            ) {
              bestByUser.set(uid, attempt)
            }
          })

          const leaderboard: TestLeaderboardEntry[] = Array.from(bestByUser.values())
            .map((attempt: any) => ({
              userId: attempt.user_id,
              fullName: attempt.user?.full_name || 'Anonymous',
              college: attempt.user?.college || null,
              score: attempt.score,
              totalMarks: test?.total_marks || 100,
              percentage: test?.total_marks ? (attempt.score / test.total_marks) * 100 : 0,
              timeTaken: attempt.time_taken_seconds,
              submittedAt: attempt.submitted_at,
            }))
            .sort((a: any, b: any) => {
              if (b.score !== a.score) return b.score - a.score
              if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken
              return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
            })
            .slice(0, 100)
            .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }))

          setRankings(leaderboard)
        }
      } catch (error) {
        console.error('Error fetching test leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    if (testId) {
      fetchLeaderboard()
    }
  }, [testId, supabase])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
    if (rank <= 10) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No attempts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to take this test and top the leaderboard!
        </p>
      </div>
    )
  }

  const currentUserRank = rankings.find(entry => entry.userId === currentUserId)

  return (
    <div className="space-y-4">
      {/* Test Info */}
      {testInfo && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {testInfo.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Attempts: {rankings.length} • Max Marks: {testInfo.total_marks}
              </p>
            </div>
            <Badge variant="secondary">{testInfo.test_type}</Badge>
          </div>
        </div>
      )}

      {/* Current User's Position (if outside top 10) */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <Card className="border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(currentUserRank.rank)}`}>
                  {getRankIcon(currentUserRank.rank)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {currentUserRank.fullName} <Badge variant="secondary">You</Badge>
                  </div>
                  {currentUserRank.college && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{currentUserRank.college}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currentUserRank.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentUserRank.score}/{currentUserRank.totalMarks}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.floor(currentUserRank.timeTaken / 60)}m
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      <div className="space-y-2">
        {rankings.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId

          return (
            <Card
              key={`${entry.userId}-${entry.submittedAt}`}
              className={`relative transition-all ${
                isCurrentUser
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {entry.fullName}
                        {isCurrentUser && <Badge variant="secondary">You</Badge>}
                      </div>
                      {entry.college && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {entry.college}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(entry.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {entry.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.score}/{entry.totalMarks}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              {entry.rank <= 3 && (
                <div className={`absolute -top-2 -left-2 px-2 py-1 rounded-md text-xs font-semibold shadow ${
                  entry.rank === 1
                    ? 'bg-yellow-500 text-white'
                    : entry.rank === 2
                    ? 'bg-gray-400 text-white'
                    : 'bg-orange-500 text-white'
                }`}>
                  {entry.rank === 1 ? 'Gold' : entry.rank === 2 ? 'Silver' : 'Bronze'}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

