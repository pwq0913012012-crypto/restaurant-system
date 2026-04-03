import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { tableSchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        orders: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          include: { items: { include: { menuItem: true } }, payment: true },
        },
      },
      orderBy: { number: 'asc' },
    })
    return successResponse(tables)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['ADMIN'])
    const body = await request.json()
    const data = tableSchema.parse(body)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const qrCode = `${appUrl}/order/${data.number}`
    const table = await prisma.table.create({ data: { ...data, qrCode } })
    return successResponse(table, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
