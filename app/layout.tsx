import type { Metadata } from 'next'
import './globals.css'
import OfflineSync from '@/components/OfflineSync'

export const metadata: Metadata = {
  title: 'ChurchAttend — QR Attendance System',
  description: 'Smart QR-based attendance tracking for your church community',
  manifest: '/manifest.json',
  themeColor: '#6c63ff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ChurchAttend" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <OfflineSync />
        {children}
      </body>
    </html>
  )
}
