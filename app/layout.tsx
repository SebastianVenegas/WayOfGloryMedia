import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import TawkToScript from '@/components/TawkToScript'
import { headers } from 'next/headers'
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/contexts/SidebarContext'
import { PWARegister } from './pwa'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Way of Glory Media',
  description: 'Professional Audio and Video Services for Churches',
  icons: {
    icon: [
      {
        url: '/favicon-dark.png',
        sizes: '192x192',
        media: '(prefers-color-scheme: light)'
      },
      {
        url: '/favicon-light.png',
        sizes: '192x192',
        media: '(prefers-color-scheme: dark)'
      }
    ]
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const isAdmin = headersList.has('x-is-admin') && headersList.get('x-is-admin') === '1'
  const version = Date.now() // Add a version to force cache busting

  return (
    <html lang="en" className="light scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1E3A8A" />
        <link 
          rel="icon" 
          type="image/png" 
          sizes="192x192" 
          href={`/favicon-dark.png?v=${version}`}
          media="(prefers-color-scheme: light)"
        />
        <link 
          rel="icon" 
          type="image/png" 
          sizes="192x192" 
          href={`/favicon-light.png?v=${version}`}
          media="(prefers-color-scheme: dark)"
        />
        
        {/* Preload critical assets */}
        <link 
          rel="preconnect" 
          href="https://fonts.googleapis.com" 
        />
        <link 
          rel="preconnect" 
          href="https://fonts.gstatic.com" 
          crossOrigin="anonymous" 
        />
      </head>
      <body className={`${inter.className} antialiased w-full`} suppressHydrationWarning>
        <SidebarProvider>
          <div className="flex flex-col min-h-screen w-full relative">
            {children}
            <Analytics />
            <SpeedInsights />
          </div>
        </SidebarProvider>
        <TawkToScript />
        <Toaster />
      </body>
    </html>
  )
}

