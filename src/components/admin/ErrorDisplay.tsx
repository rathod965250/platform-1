import { Card } from '@/components/ui/card'
import { AdminErrorDetails } from '@/lib/admin/error-handler'

interface ErrorDisplayProps {
  error: AdminErrorDetails | null | undefined
  context?: string
}

export function ErrorDisplay({ error, context = 'Data' }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <Card className="p-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading {context.toLowerCase()}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error.message || 'Failed to fetch data. Please check your database connection and RLS policies.'}
          </p>
          {error.code && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Error Code: {error.code}
            </p>
          )}
          {error.hint && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Hint: {error.hint}
            </p>
          )}
          {error.details && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Details: {error.details}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

