import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { BundleProvider } from '@/context/BundleContext'
import TawkToScript from '@/components/TawkToScript'
import { headers } from 'next/headers'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SantiSounds - Professional Audio Equipment',
  description: 'Discover premium sound solutions for your studio or venue',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const isAdmin = headersList.has('x-is-admin') && headersList.get('x-is-admin') === '1'

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <BundleProvider>
          <div className="relative min-h-screen">
            {children}
            <Analytics />
            <SpeedInsights />
          </div>
        </BundleProvider>
        <TawkToScript />
        <Toaster />
      </body>
    </html>
  )
}

