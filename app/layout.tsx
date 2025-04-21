"use client";

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider.client"
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/navbar'


const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Push Notification Manager",
//   description: "A PWA for managing and testing push notifications",
//   manifest: "/manifest.json",
//     generator: 'v0.dev'
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <Navbar />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'