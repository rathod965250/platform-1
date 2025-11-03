import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This API route initializes adaptive_state for multiple categories
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryIds } = await request.json()

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Invalid category IDs' }, { status: 400 })
    }

    // Initialize adaptive_state for each category
    const inserts = categoryIds.map((categoryId: string) => ({
      user_id: user.id,
      category_id: categoryId,
      mastery_score: 0.50, // Default starting mastery
      current_difficulty: 'medium', // Default difficulty
      recent_accuracy: [],
      avg_time_seconds: 0,
    }))

    const { error } = await supabase
      .from('adaptive_state')
      .upsert(inserts, {
        onConflict: 'user_id,category_id',
      })

    if (error) {
      console.error('Error initializing adaptive state:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Initialized adaptive state for ${inserts.length} categor${inserts.length === 1 ? 'y' : 'ies'}` 
    })
  } catch (error: any) {
    console.error('Initialize adaptive error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

