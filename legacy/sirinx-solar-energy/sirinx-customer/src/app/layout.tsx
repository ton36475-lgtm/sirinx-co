import type { Metadata, Viewport } from 'next'
import './globals.css'
import CustomerNav from '@/components/CustomerNav'

export const metadata: Metadata = {
  title: 'SIRINX Solar — ระบบลูกค้า',
  description: 'ติดตามสถานะการติดตั้ง ผลผลิตพลังงาน และบริการหลังการขาย',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A2342',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="h-full">
      <body className="h-full bg-[#0A2342] text-white font-[Sarabun,sans-serif]">
        {/* Page content with bottom padding for nav */}
        <main className="pb-20 min-h-full">
          {children}
        </main>
        <CustomerNav />
      </body>
    </html>
  )
}
