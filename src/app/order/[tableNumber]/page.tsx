import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import OrderClient from './OrderClient'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ tableNumber: string }>
}) {
  const { tableNumber } = await params
  const num = parseInt(tableNumber)
  if (isNaN(num)) notFound()

  const table = await prisma.table.findUnique({ where: { number: num } })
  if (!table) notFound()

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }],
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  const existingOrders = await prisma.order.findMany({
    where: {
      tableId: table.id,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <OrderClient
      table={JSON.parse(JSON.stringify(table))}
      categories={JSON.parse(JSON.stringify(categories))}
      existingOrders={JSON.parse(JSON.stringify(existingOrders))}
    />
  )
}
