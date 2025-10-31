import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeSummary } from '@/components/practice/PracticeSummary'

export const metadata = {
  title: 'Practice Summary | Aptitude Preparation Platform',
  description: 'View your practice session results and analytics',
}

interface PageProps {
  params: Promise<{
    categoryId: string
    sessionId: string
  }>
}

export default async function PracticeSummaryPage({ params }: PageProps) {
  const { categoryId, sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch session
  const { data: session } = await supabase
    .from('practice_sessions')
    .select(`
      *,
      category:categories(name, slug)
    `)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    redirect('/practice')
  }

  // Calculate analytics if not already done
  const { data: existingStats } = await supabase
    .from('session_stats')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  let sessionStats = existingStats

  // If stats don't exist, trigger calculation
  if (!sessionStats) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const { data: { session: authSession } } = await supabase.auth.getSession()

      const response = await fetch(`${supabaseUrl}/functions/v1/calculate-session-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession?.access_token || supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id,
        }),
      })

      if (response.ok) {
        const statsData = await response.json()
        // Fetch the created stats
        const { data: newStats } = await supabase
          .from('session_stats')
          .select('*')
          .eq('session_id', sessionId)
          .single()
        sessionStats = newStats || statsData.stats
      }
    } catch (error) {
      console.error('Error calculating session stats:', error)
    }
  }

  // Fetch recommendations
  let recommendations = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const { data: { session: authSession } } = await supabase.auth.getSession()

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-ai-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession?.access_token || supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        user_id: user.id,
        category_id: categoryId,
      }),
    })

    if (response.ok) {
      const recData = await response.json()
      recommendations = recData.recommendations || []
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error)
  }

  // Fetch metrics for detailed breakdown
  const { data: metrics } = await supabase
    .from('user_metrics')
    .select(`
      *,
      question:questions(question_text, question_type),
      subcategory:subcategories(name)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return (
    <PracticeSummary
      session={session}
      sessionStats={sessionStats}
      metrics={metrics || []}
      recommendations={recommendations}
      categoryId={categoryId}
    />
  )
}

