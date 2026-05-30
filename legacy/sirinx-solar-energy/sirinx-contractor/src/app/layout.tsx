import type { Metadata, Viewport } from 'next'
import './globals.css'
import ContractorNav from '@/components/ContractorNav'

export const metadata: Metadata = {
  title: 'SIRINX Contractor',
  description: 'แอปสำหรับช่างติดตั้ง SIRINX Solar Energy',
}

export const viewport: Viewport = {
  themeColor: '#0A2342',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="bg-[#0A2342] min-h-dvh">
        <main className="max-w-md mx-auto min-h-dvh relative">
          <div className="pb-16">
            {children}
          </div>
          <ContractorNav />
        </main>
      </body>
    </html>
  )
}
