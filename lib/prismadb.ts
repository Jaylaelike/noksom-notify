import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn']
        : [],
  })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma