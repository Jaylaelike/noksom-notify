"use client"

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push('/auth/signin')
    })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Signing out...</p>
    </div>
  )
}