import { NextRequest } from 'next/server'
import { sseManager } from '@/lib/sse'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params

  const stream = new ReadableStream({
    start(controller) {
      const clientId = sseManager.addClient(channel, controller)
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`))

      // Keep-alive ping every 30s
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`))
        } catch {
          clearInterval(interval)
          sseManager.removeClient(clientId)
        }
      }, 30000)

      _request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        sseManager.removeClient(clientId)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
