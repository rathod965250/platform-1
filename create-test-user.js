// Automated Test User Creation Script
// Run this in your browser console on http://localhost:3000

async function createTestUser() {
  console.log('🚀 Creating test user account...');
  
  const SUPABASE_URL = 'https://rscxnpoffeedqfgynnct.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzY3hucG9mZmVlZHFmZ3lubmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTIzNDEsImV4cCI6MjA3NzQyODM0MX0.uhwKiVHLz-4zE_JnDgyAxPnL361nSXCFzZnIwH39UCE';
  
  const email = 'test@example.com';
  const password = 'your-test-password';
  const fullName = 'Test User';

  try {
    // Step 1: Check if user already exists by trying to sign in
    console.log('📧 Checking if user exists...');
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ User already exists!');
      console.log('👤 User ID:', loginData.user.id);
      console.log('📧 Email:', loginData.user.email);
      console.log('');
      console.log('🎉 You can now login with:');
      console.log('   Email: test@example.com');
      console.log('   Password: your-test-password');
      return loginData;
    }

    // Step 2: User doesn't exist, create new account
    console.log('📝 Creating new user account...');
    const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        data: {
          full_name: fullName,
        },
      }),
    });

    const signupData = await signupResponse.json();

    if (!signupResponse.ok) {
      console.error('❌ Signup failed:', signupData);
      throw new Error(signupData.msg || signupData.error_description || 'Signup failed');
    }

    console.log('✅ User created successfully!');
    console.log('👤 User ID:', signupData.user.id);
    console.log('📧 Email:', signupData.user.email);

    // Step 3: Update profile with full name
    if (signupData.user && signupData.access_token) {
      console.log('📋 Updating profile...');
      const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${signupData.user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${signupData.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          full_name: fullName,
        }),
      });

      if (profileResponse.ok) {
        console.log('✅ Profile updated!');
      } else {
        console.warn('⚠️ Profile update failed, but user was created');
      }
    }

    console.log('');
    console.log('🎉 SUCCESS! Test user created!');
    console.log('');
    console.log('Login credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: your-test-password');
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');

    return signupData;

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('');
    console.error('If user already exists, try logging in at:');
    console.error('http://localhost:3000/login');
    throw error;
  }
}

// Run the function
createTestUser();
