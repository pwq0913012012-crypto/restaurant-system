import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { categorySchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === 'true'
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: all ? {} : { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    return successResponse(categories)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['ADMIN'])
    const body = await request.json()
    const data = categorySchema.parse(body)
    const category = await prisma.category.create({ data })
    return successResponse(category, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
