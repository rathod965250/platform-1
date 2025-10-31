import { LoadingSkeleton } from './LoadingSkeleton'

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <LoadingSkeleton variant="text" className="h-8 w-64" />
          <LoadingSkeleton variant="text" className="h-4 w-96" />
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LoadingSkeleton variant="card" />
          </div>
          <div>
            <LoadingSkeleton variant="card" />
          </div>
        </div>
      </div>
    </div>
  )
}

