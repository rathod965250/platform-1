#!/usr/bin/env node

// Setup Test User Script
// Run with: node setup-test-user.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rscxnpoffeedqfgynnct.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzY3hucG9mZmVlZHFmZ3lubmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTIzNDEsImV4cCI6MjA3NzQyODM0MX0.uhwKiVHLz-4zE_JnDgyAxPnL361nSXCFzZnIwH39UCE';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'your-test-password';
const TEST_NAME = 'Test User';

async function setupTestUser() {
  console.log('🚀 Setting up test user account...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Try to sign in first (check if user exists)
    console.log('📧 Checking if user already exists...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (!loginError && loginData.user) {
      console.log('✅ User already exists!\n');
      console.log('User Details:');
      console.log('  👤 ID:', loginData.user.id);
      console.log('  📧 Email:', loginData.user.email);
      console.log('  ✉️  Confirmed:', loginData.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profile) {
        console.log('  👨 Name:', profile.full_name || 'Not set');
        console.log('  🎭 Role:', profile.role);
      }

      console.log('\n🎉 You can login with these credentials:');
      console.log('   Email: test@example.com');
      console.log('   Password: your-test-password');
      console.log('\n📍 Login URL: http://localhost:3000/login\n');
      
      return loginData.user;
    }

    // Step 2: User doesn't exist, create new account
    console.log('📝 Creating new user account...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          full_name: TEST_NAME,
        },
      },
    });

    if (signupError) {
      console.error('❌ Signup error:', signupError.message);
      throw signupError;
    }

    if (!signupData.user) {
      throw new Error('No user data returned from signup');
    }

    console.log('✅ User created successfully!\n');
    console.log('User Details:');
    console.log('  👤 ID:', signupData.user.id);
    console.log('  📧 Email:', signupData.user.email);
    console.log('  ✉️  Confirmed:', signupData.user.email_confirmed_at ? 'Yes' : 'No');

    // Step 3: Update profile
    console.log('\n📋 Updating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: TEST_NAME })
      .eq('id', signupData.user.id);

    if (profileError) {
      console.warn('⚠️  Profile update warning:', profileError.message);
    } else {
      console.log('✅ Profile updated!');
    }

    // Check if email confirmation is required
    if (signupData.user.identities && signupData.user.identities.length === 0) {
      console.log('\n⚠️  EMAIL CONFIRMATION REQUIRED');
      console.log('   Check your email for confirmation link');
      console.log('   OR disable email confirmation in Supabase dashboard');
    }

    console.log('\n🎉 SUCCESS! Test user created!\n');
    console.log('Login credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: your-test-password');
    console.log('\n📍 Login URL: http://localhost:3000/login\n');

    return signupData.user;

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if Supabase project is active');
    console.error('  2. Verify environment variables are correct');
    console.error('  3. Check Supabase dashboard for user status');
    console.error('  4. Try disabling email confirmation in Supabase settings\n');
    throw error;
  }
}

// Run the setup
setupTestUser()
  .then(() => {
    console.log('✨ Setup complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed\n');
    process.exit(1);
  });
