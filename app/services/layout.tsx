import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services | SantiSounds',
  description: 'Professional audio and streaming solutions for churches',
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 