import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { question_id, error_type, description, user_answer, correct_answer } = body

    if (!question_id || !error_type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert report into database
    // You'll need to create a question_reports table with columns:
    // id, question_id, user_id, error_type, description, user_answer, correct_answer, status, created_at
    const { data, error } = await supabase
      .from('question_reports')
      .insert({
        question_id,
        user_id: user.id,
        error_type,
        description,
        user_answer: user_answer || null,
        correct_answer: correct_answer || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question report:', error)
      
      // If table doesn't exist, create it first (for development)
      // In production, create this via migration
      if (error.code === '42P01') {
        return NextResponse.json(
          { 
            error: 'Question reports table not found. Please create it via migration.',
            details: 'Create a question_reports table with columns: id (uuid), question_id (uuid), user_id (uuid), error_type (text), description (text), user_answer (text), correct_answer (text), status (text), created_at (timestamp)'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        report: data,
        message: 'Report submitted successfully. Admin will review it.'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in report route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

