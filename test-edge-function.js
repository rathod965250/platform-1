// Test script to verify Edge Function deployment
const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function...')
  console.log('📍 Supabase URL:', supabaseUrl)
  console.log('🔑 Using anon key:', supabaseKey.substring(0, 20) + '...')
  
  const testData = {
    performanceData: {
      topics: [
        { name: 'Math', accuracy: 75, timeSpent: 120, questionsAttempted: 10, questionsCorrect: 7 },
        { name: 'Science', accuracy: 60, timeSpent: 180, questionsAttempted: 8, questionsCorrect: 5 }
      ],
      overallAccuracy: 67.5,
      totalTime: 300,
      testDuration: 600,
      testTitle: 'Sample Test',
      studentLevel: 'intermediate'
    }
  }

  try {
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2))
    
    const { data, error } = await supabase.functions.invoke('ai-insights', {
      body: testData
    })

    if (error) {
      console.error('❌ Edge Function Error:', error)
      return
    }

    console.log('✅ Success! Response:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testEdgeFunction()
