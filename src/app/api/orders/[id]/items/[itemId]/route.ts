import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateOrderItemStatusSchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'
import { sseManager } from '@/lib/sse'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const body = await request.json()
    const { status } = updateOrderItemStatusSchema.parse(body)

    const orderItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
      include: { menuItem: true, order: { include: { table: true } } },
    })

    // Check if all items are done
    const allItems = await prisma.orderItem.findMany({ where: { orderId: id } })
    const allDone = allItems.every(i => i.status === 'DONE')
    if (allDone) {
      await prisma.order.update({ where: { id }, data: { status: 'READY' } })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } }, table: true },
    })

    sseManager.broadcast('kitchen', 'order-updated', order)
    sseManager.broadcast('waiter', 'order-updated', order)
    sseManager.broadcast(`table-${orderItem.order.table.number}`, 'order-updated', order)

    return successResponse(orderItem)
  } catch (error) {
    return handleApiError(error)
  }
}
