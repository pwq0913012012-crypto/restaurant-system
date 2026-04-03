import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const messages = error.issues.map(e => e.message).join(', ')
    return errorResponse(messages, 400)
  }
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return errorResponse('未授權', 401)
    if (error.message === 'Forbidden') return errorResponse('權限不足', 403)
    return errorResponse(error.message, 500)
  }
  return errorResponse('伺服器錯誤', 500)
}
