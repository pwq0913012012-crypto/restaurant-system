import { cookies } from 'next/headers'
import { successResponse } from '@/lib/api-helpers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  return successResponse({ message: '已登出' })
}
