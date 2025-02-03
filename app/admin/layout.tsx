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
  icons: {
    apple: [
      { url: '/icons/admin-icon-192x192.png' },
      { url: '/icons/admin-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/admin-icon-180x180.png', sizes: '180x180' },
      { url: '/icons/admin-icon-167x167.png', sizes: '167x167' },
    ],
    icon: [
      { url: '/icons/admin-icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/admin-icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ]
  }
}

import AdminClient from './client'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminClient>{children}</AdminClient>
} 