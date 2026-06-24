import type { Metadata, Viewport } from 'next'
import './globals.css'
import { OfflineIndicator } from '@/components/ui/offline-indicator'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
  ),
  title: 'SiteLog - 현장출근기록',
  description: '인테리어 공사 현장의 일별 출근 현황을 기록·조회하는 모바일 우선 웹앱',
  manifest: '/manifest.json',
  icons: {
    icon: '/Sitelog-logo.svg',
    apple: '/Sitelog-logo.svg',
  },
  openGraph: {
    type: 'website',
    title: 'SiteLog - 현장출근기록',
    description: '인테리어 공사 현장의 일별 출근 현황을 기록·조회하는 모바일 우선 웹앱',
    images: [{ url: '/Sitelog-logo.svg' }],
  },
  twitter: {
    card: 'summary',
    title: 'SiteLog - 현장출근기록',
    description: '인테리어 공사 현장의 일별 출근 현황을 기록·조회하는 모바일 우선 웹앱',
    images: ['/Sitelog-logo.svg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563EB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <OfflineIndicator />
        {children}
      </body>
    </html>
  )
}
