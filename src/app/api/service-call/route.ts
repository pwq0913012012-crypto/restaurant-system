import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError } from '@/lib/api-helpers'
import { sseManager } from '@/lib/sse'

export async function GET() {
  try {
    const calls = await prisma.serviceCall.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    })
    return successResponse(calls)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId } = body

    const call = await prisma.serviceCall.create({
      data: { tableId },
    })

    const table = await prisma.table.findUnique({ where: { id: tableId } })
    sseManager.broadcast('waiter', 'service-call', { ...call, tableNumber: table?.number })

    return successResponse(call, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body
    const call = await prisma.serviceCall.update({
      where: { id },
      data: { status },
    })
    return successResponse(call)
  } catch (error) {
    return handleApiError(error)
  }
}
