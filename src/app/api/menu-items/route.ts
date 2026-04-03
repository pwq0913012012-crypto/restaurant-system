import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { menuItemSchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const all = searchParams.get('all') === 'true'

    const where: Record<string, unknown> = {}
    if (!all) where.isAvailable = true
    if (categoryId) where.categoryId = categoryId
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    })
    return successResponse(items)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['ADMIN'])
    const body = await request.json()
    const data = menuItemSchema.parse(body)
    const item = await prisma.menuItem.create({
      data: { ...data, tags: data.tags as unknown as string },
    })
    return successResponse(item, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
