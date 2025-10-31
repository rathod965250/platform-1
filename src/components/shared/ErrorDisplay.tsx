'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorDisplayProps {
  error?: string | Error | null
  onRetry?: () => void
  title?: string
  description?: string
  className?: string
}

export function ErrorDisplay({
  error,
  onRetry,
  title = 'Something went wrong',
  description = 'An error occurred. Please try again.',
  className,
}: ErrorDisplayProps) {
  const errorMessage =
    error instanceof Error ? error.message : error || 'Unknown error'

  return (
    <Card className={className}>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-4 p-2 bg-red-50 dark:bg-red-950 rounded">
            {errorMessage}
          </p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

