import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  const session = await getSession()
  if (!session) return errorResponse('未登入', 401)
  return successResponse(session)
}
