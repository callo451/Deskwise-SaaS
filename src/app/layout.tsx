import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { BrandingProvider } from '@/components/providers/BrandingProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Deskwise ITSM - AI-Powered IT Service Management',
  description: 'Modern ITSM platform for IT teams with AI-powered features',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="deskwise-theme">
          <SessionProvider>
            <BrandingProvider>
              {children}
            </BrandingProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
