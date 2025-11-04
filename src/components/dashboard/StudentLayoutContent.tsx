'use client'

export function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
}