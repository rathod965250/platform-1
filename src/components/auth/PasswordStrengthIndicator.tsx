'use client'

import { calculatePasswordStrength } from '@/lib/validations/auth'
import { Progress } from '@/components/ui/progress'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const { strength, score } = calculatePasswordStrength(password)
  
  const progressValue = (score / 6) * 100
  
  const colors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }
  
  const textColors = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600',
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Password strength:</span>
        <span className={`text-sm font-medium ${textColors[strength]}`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </span>
      </div>
      <Progress value={progressValue} className="h-2" />
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {strength === 'weak' && 'Use a stronger password with uppercase, lowercase, and numbers'}
        {strength === 'medium' && 'Good! Consider adding special characters'}
        {strength === 'strong' && 'Excellent password strength!'}
      </div>
    </div>
  )
}

