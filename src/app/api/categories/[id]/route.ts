import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { categorySchema } from '@/lib/validations'
import { successResponse, handleApiError, errorResponse } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!category) return errorResponse('分類不存在', 404)
    return successResponse(category)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN'])
    const { id } = await params
    const body = await request.json()
    const data = categorySchema.partial().parse(body)
    const category = await prisma.category.update({ where: { id }, data })
    return successResponse(category)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN'])
    const { id } = await params
    await prisma.category.delete({ where: { id } })
    return successResponse({ message: '已刪除' })
  } catch (error) {
    return handleApiError(error)
  }
}
