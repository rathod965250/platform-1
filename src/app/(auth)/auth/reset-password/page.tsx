import { redirect } from 'next/navigation'

// This page redirects users from the password reset email link
// The actual password update happens at /auth/update-password
export default function ResetPasswordPage() {
  redirect('/auth/update-password')
}

