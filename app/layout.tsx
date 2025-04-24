

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// import { ThemeProvider } from "@/components/theme-provider.client"
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/navbar'

import { Providers } from "./providers"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Push Notification Manager",
  description: "A PWA for managing and testing push notifications",
  manifest: "/manifest.json",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


import './globals.css'