import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { menuItemSchema } from '@/lib/validations'
import { successResponse, handleApiError, errorResponse } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!item) return errorResponse('菜品不存在', 404)
    return successResponse(item)
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
    const data = menuItemSchema.partial().parse(body)
    const updateData = data.tags !== undefined
      ? { ...data, tags: data.tags as unknown as string }
      : data
    const item = await prisma.menuItem.update({ where: { id }, data: updateData })
    return successResponse(item)
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
    await prisma.menuItem.delete({ where: { id } })
    return successResponse({ message: '已刪除' })
  } catch (error) {
    return handleApiError(error)
  }
}
