import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function useWebSocket(onConnected) {
  const clientRef = useRef(null)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        console.log('✅ WebSocket connected')
        onConnected?.(client)
      },
      onDisconnect: () => console.log('❌ WebSocket disconnected'),
      onStompError: (frame) => console.error('STOMP error', frame)
    })

    client.activate()
    clientRef.current = client

    return () => client.deactivate()
  }, []) // intentionally empty — only connect once

  const subscribe = useCallback((topic, callback) => {
    if (!clientRef.current?.connected) return
    return clientRef.current.subscribe(topic, (msg) => {
      try { callback(JSON.parse(msg.body)) }
      catch (e) { callback(msg.body) }
    })
  }, [])

  const sendMessage = useCallback((destination, body) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body)
    })
  }, [])

  return { sendMessage, subscribe, client: clientRef }
}