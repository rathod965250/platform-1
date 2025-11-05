import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached instance if available
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Missing Supabase environment variables. Please check your .env.local file.'
    console.error('❌', errorMsg)
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    throw new Error(errorMsg)
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ Supabase URL should start with http:// or https://')
  }
  
  if (!supabaseUrl.includes('supabase.co')) {
    console.warn('⚠️ Supabase URL might be incorrect. Expected format: https://your-project.supabase.co')
  }

  try {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return clientInstance
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    const errorMsg = `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error('URL:', supabaseUrl.substring(0, 50))
    console.error('Key prefix:', supabaseAnonKey.substring(0, 20))
    throw new Error(errorMsg)
  }
}
