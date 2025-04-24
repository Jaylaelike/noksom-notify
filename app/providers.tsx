"use client"

import React from "react"
import { ThemeProvider } from "@/components/theme-provider.client"
import { SessionProvider } from "next-auth/react"
import Navbar from "@/components/navbar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <Navbar />
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}