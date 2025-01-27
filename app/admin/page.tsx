'use client'

import { Headphones } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 text-center">
          <Headphones className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">WayofGlory</h1>
          <p className="text-gray-500">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
} 