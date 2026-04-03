import { NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${appUrl}/order/${tableNumber}`
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
    return Response.json({ success: true, data: { url, qrCode: qrDataUrl } })
  } catch (error) {
    return handleApiError(error)
  }
}
