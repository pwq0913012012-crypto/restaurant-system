import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tablePaymentSchema } from '@/lib/validations'
import { successResponse, handleApiError, errorResponse } from '@/lib/api-helpers'
import { sseManager } from '@/lib/sse'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId, method } = tablePaymentSchema.parse(body)

    const orders = await prisma.order.findMany({
      where: {
        tableId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        payment: null,
      },
      include: { items: true },
    })

    if (orders.length === 0) return errorResponse('沒有待結帳的訂單', 400)

    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)

    const payments = await Promise.all(
      orders.map(order =>
        prisma.payment.create({
          data: { orderId: order.id, method, amount: order.totalAmount },
        })
      )
    )

    await prisma.order.updateMany({
      where: { id: { in: orders.map(o => o.id) } },
      data: { status: 'COMPLETED' },
    })

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'CLEANING' },
    })

    sseManager.broadcast('waiter', 'table-paid', { tableId, totalAmount })

    return successResponse({ payments, totalAmount })
  } catch (error) {
    return handleApiError(error)
  }
}
