import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WoG Media Admin',
  description: 'Way of Glory Media Admin Dashboard',
  manifest: '/admin-manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WoG Media Admin',
  },
  formatDetection: {
    telephone: false,
  },
  icons: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      url: '/favicon.ico'
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: '/apple-touch-icon.png'
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png'
    },
    {
      rel: 'icon', 
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png'
    }
  ]
}

import AdminClient from './client'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminClient>{children}</AdminClient>
} 