import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError, errorResponse } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: { include: { menuItem: true } }, payment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!table) return errorResponse('桌位不存在', 404)
    return successResponse(table)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN', 'WAITER'])
    const { id } = await params
    const body = await request.json()
    const table = await prisma.table.update({ where: { id }, data: body })
    return successResponse(table)
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
    await prisma.table.delete({ where: { id } })
    return successResponse({ message: '已刪除' })
  } catch (error) {
    return handleApiError(error)
  }
}
