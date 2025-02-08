import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Way of Glory Media',
  description: 'Improve Your Church\'s Worship Experience with Professional Audio, Video and Software Solutions',
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
  ],
  openGraph: {
    title: 'Way of Glory Media',
    description: 'Improve Your Church\'s Worship Experience with Professional Audio, Video and Software Solutions',
    url: 'https://wayofglory.com',
    siteName: 'Way of Glory Media',
    images: [
      {
        url: 'https://wayofglory.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Way of Glory Media'
      },
      {
        url: 'https://wayofglory.com/images/og-image-square.jpg',
        width: 600,
        height: 600,
        alt: 'Way of Glory Media'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Way of Glory Media',
    description: 'Improve Your Church\'s Worship Experience with Professional Audio, Video and Software Solutions',
    images: ['https://wayofglory.com/images/twitter-image.jpg'],
  }
}

import AdminClient from './client'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminClient>{children}</AdminClient>
}