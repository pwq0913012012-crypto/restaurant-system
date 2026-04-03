import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateOrderStatusSchema } from '@/lib/validations'
import { successResponse, handleApiError, errorResponse } from '@/lib/api-helpers'
import { sseManager } from '@/lib/sse'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        payment: true,
      },
    })
    if (!order) return errorResponse('訂單不存在', 404)
    return successResponse(order)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = updateOrderStatusSchema.parse(body)

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    sseManager.broadcast('kitchen', 'order-updated', order)
    sseManager.broadcast('waiter', 'order-updated', order)
    sseManager.broadcast(`table-${order.table.number}`, 'order-updated', order)

    return successResponse(order)
  } catch (error) {
    return handleApiError(error)
  }
}
