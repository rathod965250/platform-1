import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'button' | 'circle' | 'table'
  count?: number
}

export function LoadingSkeleton({
  className,
  variant = 'text',
  count = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-background-tertiary dark:bg-background-tertiary rounded'

  const variantClasses = {
    card: 'h-48 w-full',
    text: 'h-4 w-full',
    button: 'h-10 w-24 rounded-md',
    circle: 'h-12 w-12 rounded-full',
    table: 'h-12 w-full',
  }

  if (variant === 'card') {
    return (
      <div className={cn(baseClasses, variantClasses.card, className)}>
        <div className="p-6 space-y-4">
          <div className="h-4 bg-background-divider dark:bg-background-divider rounded w-3/4"></div>
          <div className="h-4 bg-background-divider dark:bg-background-divider rounded w-1/2"></div>
          <div className="h-4 bg-background-divider dark:bg-background-divider rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn(baseClasses, variantClasses.table)}>
            <div className="flex items-center gap-4 p-4">
              <div className="h-8 bg-background-divider dark:bg-background-divider rounded w-12"></div>
              <div className="h-4 bg-background-divider dark:bg-background-divider rounded flex-1"></div>
              <div className="h-4 bg-background-divider dark:bg-background-divider rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant], className)}
        />
      ))}
    </div>
  )
}

