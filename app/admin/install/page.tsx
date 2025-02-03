'use client'

import { ArrowUpRight, Share2 } from 'lucide-react'

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Install Admin Dashboard</h2>
          <p className="mt-2 text-gray-600">Follow these steps to install the admin dashboard as an app on your iPad:</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">1</span>
              <p className="font-medium">Tap the Share button</p>
              <Share2 className="h-5 w-5" />
            </div>
            <p className="text-gray-600 pl-8">
              In Safari, tap the share button at the top of the screen
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">2</span>
              <p className="font-medium">Select &quot;Add to Home Screen&quot;</p>
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <p className="text-gray-600 pl-8">
              Scroll down and tap &quot;Add to Home Screen&quot; in the share menu
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">3</span>
              <p className="font-medium">Add the App</p>
            </div>
            <p className="text-gray-600 pl-8">
              Tap &quot;Add&quot; in the top right corner to install the admin dashboard
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">4</span>
              <p className="font-medium">Open the App</p>
            </div>
            <p className="text-gray-600 pl-8">
              Find and tap the &quot;WoG Admin&quot; icon on your home screen to open the dashboard
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>The app will open in fullscreen mode without Safari&apos;s interface</p>
          <p className="mt-1">You can access all admin features directly from the app</p>
        </div>
      </div>
    </div>
  )
} 