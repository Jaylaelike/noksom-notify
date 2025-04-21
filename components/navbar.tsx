"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'

export default function Navbar() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative h-8 w-8">
            <Image 
              src="https://cdn-icons-png.flaticon.com/512/2058/2058148.png" 
              alt="NokSom Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-bold">NokSom Notify</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          
          {status === 'loading' ? null : session ? (
            <>
              <Avatar>
                {session.user.image && (
                  <AvatarImage src={session.user.image} alt={session.user.name ?? 'Avatar'} />
                )}
                <AvatarFallback>
                  {session.user.name?.[0] ?? session.user.email?.[0] ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {session.user.name ?? session.user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="secondary" size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}