import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { updateUserSchema } from '@/lib/validations'
import { successResponse, handleApiError } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN'])
    const { id } = await params
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return successResponse(user)
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
    await prisma.user.delete({ where: { id } })
    return successResponse({ message: '已刪除' })
  } catch (error) {
    return handleApiError(error)
  }
}
