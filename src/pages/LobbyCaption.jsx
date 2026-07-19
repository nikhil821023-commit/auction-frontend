import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuctionStore } from '../store/auctionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { getLobbyStatus } from '../api/lobbyApi'  // ← ADD THIS IMPORT

export default function LobbyCaption() {
  const { tid }   = useParams()
  const navigate  = useNavigate()
  const { team }  = useAuctionStore()
  const [lobby, setLobby]     = useState(null)
  const [isReady, setIsReady] = useState(false)

  // ── Poll initial lobby state via REST (don't rely solely on WS) ──
  useEffect(() => {
    getLobbyStatus(tid).then(r => setLobby(r.data)).catch(() => {})
  }, [tid])

  const { sendMessage } = useWebSocket(useCallback((client) => {

    // Subscribe FIRST, then join
    client.subscribe(`/topic/lobby/${tid}`, (msg) => {
      setLobby(JSON.parse(msg.body))
    })

    client.subscribe(`/topic/lobby/${tid}/start`, () => {
      toast.success('🚀 Auction is starting!')
      navigate(`/captain/auction/${tid}`)
    })

    // FIX: send tournamentId + teamId directly, don't rely on nested joinCode
    client.publish({
      destination: '/app/lobby/join',
      body: JSON.stringify({
        joinCode:    team?.joinCode || team?.tournament?.joinCode || '',
        teamId:      team?.id,
        captainName: team?.captainName,
        tournamentId: Number(tid)   // ← send this as backup
      })
    })

  }, [tid, team]))

  const toggleReady = () => {
    const next = !isReady
    setIsReady(next)
    sendMessage('/app/lobby/ready', {
      tournamentId: Number(tid),
      ready: next
    })
  }

  return (
    <div className="page-bg">
      <motion.div className="lobby-captain-card"
        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}>

        <div className="team-hero"
          style={{ borderColor: team?.teamColor || '#e63946' }}>
          <h2 style={{ color: team?.teamColor }}>{team?.teamName}</h2>
          <p>Captain: {team?.captainName}</p>
          <p className="budget-display">
            Budget: ₹{team?.totalBudget?.toLocaleString()}
          </p>
        </div>

        <div className="lobby-stats">
          <div className="stat-box">
            <span className="stat-num">{lobby?.totalTeams || 0}</span>
            <span className="stat-label">Teams</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{lobby?.readyTeams || 0}</span>
            <span className="stat-label">Ready</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{lobby?.totalPlayersInPool || 0}</span>
            <span className="stat-label">Players</span>
          </div>
        </div>

        <div className="captain-list">
          {lobby?.connectedCaptains?.map(c => (
            <div key={c.sessionId} className="captain-row">
              <div className="captain-color-dot"
                style={{ background: c.teamColor }} />
              <div className="captain-info">
                <span>{c.captainName}</span>
                <span className="captain-team">{c.teamName}</span>
              </div>
              <div className={`ready-badge ${c.isReady ? 'ready' : 'not-ready'}`}>
                {c.isReady ? '✅' : '⏳'}
              </div>
            </div>
          ))}
        </div>

        <motion.button
          className={`btn-ready ${isReady ? 'ready-active' : ''}`}
          onClick={toggleReady}
          whileTap={{ scale: 0.96 }}>
          {isReady ? "✅ I'm Ready!" : '👋 Mark as Ready'}
        </motion.button>

        <p className="lobby-waiting-text">
          Waiting for organizer to start the auction...
        </p>
      </motion.div>
    </div>
  )
}