import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(['ADMIN'])
    const { searchParams } = request.nextUrl
    const period = searchParams.get('period') || 'today'

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED'] },
      },
      include: { items: { include: { menuItem: true } }, payment: true },
    })

    const totalRevenue = orders
      .filter(o => o.payment)
      .reduce((sum, o) => sum + o.totalAmount, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Top items
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItemId
        if (!itemCounts[key]) {
          itemCounts[key] = { name: item.menuItem.name, count: 0, revenue: 0 }
        }
        itemCounts[key].count += item.quantity
        itemCounts[key].revenue += item.unitPrice * item.quantity
      })
    })
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Category breakdown
    const categorySales: Record<string, { name: string; revenue: number }> = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        const catName = item.menuItem.categoryId
        if (!categorySales[catName]) {
          categorySales[catName] = { name: catName, revenue: 0 }
        }
        categorySales[catName].revenue += item.unitPrice * item.quantity
      })
    })

    // Daily revenue for chart
    const dailyRevenue: Record<string, number> = {}
    orders.forEach(order => {
      if (order.payment) {
        const day = order.createdAt.toISOString().split('T')[0]
        dailyRevenue[day] = (dailyRevenue[day] || 0) + order.totalAmount
      }
    })
    const revenueChart = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return successResponse({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topItems,
      categorySales: Object.values(categorySales),
      revenueChart,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
