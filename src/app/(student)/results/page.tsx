import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, Trophy, TrendingUp, Calendar } from 'lucide-react'

export const metadata = {
  title: 'My Results | Aptitude Preparation Platform',
  description: 'View all your test results and performance history',
}

export default async function ResultsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all test attempts
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select(`
      *,
      test:tests(
        id,
        title,
        test_type,
        company_name,
        total_marks
      )
    `)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your test results and track your progress
          </p>
        </div>

        {testAttempts && testAttempts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {testAttempts.map((attempt: any) => {
              const test = attempt.test
              const scorePercentage = ((attempt.score / test.total_marks) * 100).toFixed(1)
              const accuracy = ((attempt.correct_answers / attempt.total_questions) * 100).toFixed(1)
              const timeInMinutes = Math.floor(attempt.time_taken_seconds / 60)

              return (
                <Card key={attempt.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {test.title}
                          </h3>
                          <Badge variant="secondary">{test.test_type}</Badge>
                          {test.company_name && (
                            <Badge variant="outline">{test.company_name}</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(attempt.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {timeInMinutes} minutes
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {accuracy}% accuracy
                          </div>
                          {attempt.percentile && (
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4" />
                              {attempt.percentile}th percentile
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            {scorePercentage}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {attempt.score}/{test.total_marks}
                          </div>
                        </div>

                        <Link href={`/test/${test.id}/results/${attempt.id}`}>
                          <Button>View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Trophy className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No results yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Take a test to see your results here
              </p>
              <Link href="/test">
                <Button size="lg">Take Your First Test</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

