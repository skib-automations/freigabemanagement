import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "Freigabe Management",
  description: "Interface zur Verwaltung von Freigaben",
  generator: 'v0.dev'
}

// Separate viewport configuration as per Next.js 15.2.4 requirements
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="antialiased">
      <body className="min-h-screen bg-[#F1F1F1] text-base">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}



import './globals.css'