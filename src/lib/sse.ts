type SSEClient = {
  id: string
  controller: ReadableStreamDefaultController
  channel: string
}

class SSEManager {
  private clients: SSEClient[] = []

  addClient(channel: string, controller: ReadableStreamDefaultController): string {
    const id = crypto.randomUUID()
    this.clients.push({ id, controller, channel })
    return id
  }

  removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id)
  }

  broadcast(channel: string, event: string, data: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const encoder = new TextEncoder()
    this.clients
      .filter(c => c.channel === channel)
      .forEach(client => {
        try {
          client.controller.enqueue(encoder.encode(message))
        } catch {
          this.removeClient(client.id)
        }
      })
  }
}

const globalForSSE = globalThis as unknown as { sseManager: SSEManager | undefined }
export const sseManager = globalForSSE.sseManager ?? new SSEManager()
if (process.env.NODE_ENV !== 'production') globalForSSE.sseManager = sseManager
