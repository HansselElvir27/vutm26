import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { LanguageProvider } from '@/lib/language-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'VUTMHN - Ventanilla Unica de Transporte Maritimo de Honduras',
  description: 'Ventanilla Unica de Transporte Marítimo de Honduras',
  generator: 'v0.app',
  colorScheme: 'light',
  icons: {
    icon: '/logo-vutm.png',
    apple: '/logo-vutm.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
