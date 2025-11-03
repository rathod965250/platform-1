/**
 * Helper functions for checking onboarding completion status
 */

import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface OnboardingStatus {
  isComplete: boolean
  hasCollege: boolean
  hasGraduationYear: boolean
  hasCourse: boolean
  hasPhone: boolean
  hasTargetCompanies: boolean
  hasAdaptiveState: boolean
}

/**
 * Check if onboarding is complete for a user (client-side)
 */
export async function checkOnboardingComplete(userId: string): Promise<OnboardingStatus> {
  const supabase = createClient()
  
  // Fetch profile with all required fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('college, graduation_year, target_companies, phone, course_id, course_name')
    .eq('id', userId)
    .single()

  // Check if adaptive_state exists
  const { data: adaptiveStates } = await supabase
    .from('adaptive_state')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  const hasCollege = !!profile?.college
  const hasGraduationYear = !!profile?.graduation_year
  const hasCourse = !!(profile?.course_id || profile?.course_name)
  const hasPhone = !!profile?.phone
  const hasTargetCompanies = !!(
    profile?.target_companies && 
    Array.isArray(profile.target_companies) && 
    profile.target_companies.length > 0
  )
  const hasAdaptiveState = !!(adaptiveStates && adaptiveStates.length > 0)

  const isComplete = hasCollege && 
                     hasGraduationYear && 
                     hasCourse && 
                     hasPhone && 
                     hasTargetCompanies && 
                     hasAdaptiveState

  return {
    isComplete,
    hasCollege,
    hasGraduationYear,
    hasCourse,
    hasPhone,
    hasTargetCompanies,
    hasAdaptiveState,
  }
}

/**
 * Check if onboarding is complete for a user (server-side)
 * Use this in middleware, server components, and route handlers
 */
export async function checkOnboardingCompleteServer(userId: string, supabase: ReturnType<typeof createServerClient>): Promise<OnboardingStatus> {
  // Fetch profile with all required fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('college, graduation_year, target_companies, phone, course_id, course_name')
    .eq('id', userId)
    .single()

  // Check if adaptive_state exists
  const { data: adaptiveStates } = await supabase
    .from('adaptive_state')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  const hasCollege = !!profile?.college
  const hasGraduationYear = !!profile?.graduation_year
  const hasCourse = !!(profile?.course_id || profile?.course_name)
  const hasPhone = !!profile?.phone
  const hasTargetCompanies = !!(
    profile?.target_companies && 
    Array.isArray(profile.target_companies) && 
    profile.target_companies.length > 0
  )
  const hasAdaptiveState = !!(adaptiveStates && adaptiveStates.length > 0)

  const isComplete = hasCollege && 
                     hasGraduationYear && 
                     hasCourse && 
                     hasPhone && 
                     hasTargetCompanies && 
                     hasAdaptiveState

  return {
    isComplete,
    hasCollege,
    hasGraduationYear,
    hasCourse,
    hasPhone,
    hasTargetCompanies,
    hasAdaptiveState,
  }
}

