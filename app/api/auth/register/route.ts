import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prismadb'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Name, email, and password are required' },
      { status: 400 }
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })
  if (existingUser) {
    return NextResponse.json(
      { error: 'Email already in use' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
    },
  })

  return NextResponse.json({ user }, { status: 201 })
}