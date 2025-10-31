// Test Supabase Connection
// Run this in the browser console to test the connection

const testSupabaseConnection = async () => {
  console.log('Testing Supabase Connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  try {
    // Test basic connection
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('Connection status:', response.status);
    console.log('Connection OK:', response.ok);
    
    // Test profiles table
    const profilesResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('Profiles table accessible:', profilesResponse.ok);
    
  } catch (error) {
    console.error('Connection error:', error);
  }
};

testSupabaseConnection();
