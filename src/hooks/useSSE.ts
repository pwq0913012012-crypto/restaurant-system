'use client'
import { useEffect, useRef, useCallback } from 'react'

export function useSSE(channel: string, onEvent: (event: string, data: unknown) => void) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(`/api/sse/${channel}`)
    eventSourceRef.current = es

    es.addEventListener('new-order', (e) => {
      onEventRef.current('new-order', JSON.parse(e.data))
    })
    es.addEventListener('order-updated', (e) => {
      onEventRef.current('order-updated', JSON.parse(e.data))
    })
    es.addEventListener('service-call', (e) => {
      onEventRef.current('service-call', JSON.parse(e.data))
    })
    es.addEventListener('table-paid', (e) => {
      onEventRef.current('table-paid', JSON.parse(e.data))
    })
    es.addEventListener('connected', (e) => {
      onEventRef.current('connected', JSON.parse(e.data))
    })

    es.onerror = () => {
      es.close()
      setTimeout(connect, 3000)
    }
  }, [channel])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])
}
