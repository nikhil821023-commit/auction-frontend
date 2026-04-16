import { useEffect } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuctionStore } from '../store/auctionStore'

export function useAuction(tournamentId) {
  const { setAuctionState, setTimerState, setDashboard, setSpinResult } = useAuctionStore()

  const { sendMessage, subscribe, client } = useWebSocket((stompClient) => {
    // Subscribe to all auction topics once connected
    stompClient.subscribe(`/topic/auction/${tournamentId}`, (msg) => {
      const data = JSON.parse(msg.body)
      setAuctionState(data)
    })

    stompClient.subscribe(`/topic/auction/${tournamentId}/timer`, (msg) => {
      setTimerState(JSON.parse(msg.body))
    })

    stompClient.subscribe(`/topic/auction/${tournamentId}/spin`, (msg) => {
      setSpinResult(JSON.parse(msg.body))
    })

    stompClient.subscribe(`/topic/dashboard/${tournamentId}`, (msg) => {
      setDashboard(JSON.parse(msg.body))
    })
  })

  const spin         = ()    => sendMessage(`/app/auction/${tournamentId}/spin`, {})
  const startBidding = ()    => sendMessage(`/app/auction/${tournamentId}/start-bidding`, {})
  const bid          = (dto) => sendMessage(`/app/auction/${tournamentId}/bid`, dto)
  const control      = (action) => sendMessage(`/app/auction/${tournamentId}/control`, { action })

  return { spin, startBidding, bid, control }
}