import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrderSchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'
import { generateOrderNumber } from '@/lib/utils'
import { sseManager } from '@/lib/sse'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const tableId = searchParams.get('tableId')
    const status = searchParams.get('status')
    const today = searchParams.get('today') === 'true'

    const where: Record<string, unknown> = {}
    if (tableId) where.tableId = tableId
    if (status) where.status = status
    if (today) {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      where.createdAt = { gte: start }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
        table: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(orders)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createOrderSchema.parse(body)

    const table = await prisma.table.findUnique({ where: { id: data.tableId } })
    if (!table) {
      return Response.json({ success: false, error: '桌位不存在' }, { status: 404 })
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: data.items.map(i => i.menuItemId) } },
    })

    const priceMap = new Map(menuItems.map(m => [m.id, m.price]))
    let totalAmount = 0
    const orderItems = data.items.map(item => {
      const price = priceMap.get(item.menuItemId) || 0
      totalAmount += price * item.quantity
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: price,
        note: item.note,
      }
    })

    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        tableId: data.tableId,
        orderNumber,
        totalAmount,
        customerNote: data.customerNote,
        items: { create: orderItems },
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    await prisma.table.update({
      where: { id: data.tableId },
      data: { status: 'OCCUPIED' },
    })

    sseManager.broadcast('kitchen', 'new-order', order)
    sseManager.broadcast('waiter', 'new-order', order)

    return successResponse(order, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
