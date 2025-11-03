'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Profile is automatically created by database trigger
  // But we can update it with full_name if provided
  if (authData.user && fullName) {
    await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', authData.user.id)
  }

  revalidatePath('/', 'layout')
  
  // If email confirmation is required, redirect to confirmation page
  if (authData.user && !authData.session) {
    redirect('/auth/confirm-email')
  }

  // Redirect new users to onboarding
  redirect('/onboarding')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?next=/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const newPassword = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signInWithPasswordless(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the login link' }
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

