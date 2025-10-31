import { Card } from '@/components/ui/card'
import { Settings as SettingsIcon } from 'lucide-react'

export const metadata = {
  title: 'Settings',
  description: 'Admin settings and configuration',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure platform settings
        </p>
      </div>

      <Card className="p-12 text-center">
        <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Settings Coming Soon
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Platform configuration options will be available here
        </p>
      </Card>
    </div>
  )
}

