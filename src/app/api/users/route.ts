import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { createUserSchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'

export async function GET() {
  try {
    await requireAuth(['ADMIN'])
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['ADMIN'])
    const body = await request.json()
    const data = createUserSchema.parse(body)
    const hashed = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return successResponse(user, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
