import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useWebSocket } from '../hooks/useWebSocket'
import { getDashboard } from '../api/auctionApi'
import { useAuctionStore } from '../store/auctionStore'
import PlayerCard  from '../components/PlayerCard'
import TimerRing   from '../components/TimerRing'
import ReactionBar from '../components/ReactionBar'

const EMOJIS = [
  { e: '🔥', label: 'Fire' },
  { e: '👏', label: 'Clap' },
  { e: '😮', label: 'Wow' },
  { e: '💰', label: 'Money' },
  { e: '🚀', label: 'Rocket' },
  { e: '😱', label: 'Shocked' },
  { e: '🎉', label: 'Party' },
  { e: '👑', label: 'Crown' },
  { e: '🤯', label: 'Mind Blown' },
  { e: '💪', label: 'Strong' },
]

export default function SpectatorView() {
  const { tid }    = useParams()
  const navigate   = useNavigate()

  const { auctionState, timerState, spinResult, dashboard,
          setAuctionState, setTimerState, setSpinResult, setDashboard }
        = useAuctionStore()

  const [nickname, setNickname]       = useState('')
  const [joined, setJoined]           = useState(false)
  const [spectatorCount, setCount]    = useState(0)
  const [reactions, setReactions]     = useState([])   // floating emojis
  const [reactionCounts, setCounts]   = useState({})
  const [phase, setPhase]             = useState('IDLE')
  const [lastEvent, setLastEvent]     = useState('')
  const [soldFlash, setSoldFlash]     = useState(null)
  const sendRef                       = useRef(null)
  const nicknameRef                   = useRef('')

  // ── WebSocket ─────────────────────────────────────────────────
  const { sendMessage } = useWebSocket(useCallback((client) => {
    sendRef.current = client

    // Auction events — same as captain view (read-only)
    client.subscribe(`/topic/auction/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      setAuctionState(data)
      if (data.phase) setPhase(data.phase)
      if (data.event === 'PLAYER_REVEALED') setSpinResult(data)
      if (data.event === 'PLAYER_SOLD') {
        setSoldFlash({
          player: data.currentPlayerName,
          team:   data.highBidderTeamName,
          price:  data.currentBid,
          color:  data.highBidderTeamColor
        })
        setTimeout(() => setSoldFlash(null), 4000)
        setLastEvent(`🔨 ${data.currentPlayerName} SOLD → ${data.highBidderTeamName}`)
      }
      if (data.event === 'PLAYER_UNSOLD') {
        setLastEvent(`❌ ${data.currentPlayerName} went UNSOLD`)
      }
      if (data.isBidWar) {
        setLastEvent(`🔥 BID WAR! ${data.alertMessage}`)
      }
    })

    client.subscribe(`/topic/auction/${tid}/timer`, (msg) => {
      setTimerState(JSON.parse(msg.body))
    })

    client.subscribe(`/topic/dashboard/${tid}`, (msg) => {
      setDashboard(JSON.parse(msg.body))
    })

    // Spectator-specific topics
    client.subscribe(`/topic/spectators/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      if (data.spectatorCount != null) setCount(data.spectatorCount)
      if (data.event === 'SPECTATOR_JOINED' && data.message) {
        toast(data.message, { icon: '👀', duration: 2000 })
      }
    })

    client.subscribe(`/topic/reactions/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      if (data.counts) setCounts(data.counts)

      // Add floating emoji animation
      const id = Date.now() + Math.random()
      setReactions(prev => [...prev, {
        id,
        emoji:  data.emoji,
        name:   data.spectatorName,
        x:      10 + Math.random() * 80  // random horizontal position %
      }])
      // Remove after animation completes
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id))
      }, 2500)
    })

  }, [tid]))

  // ── Load dashboard ────────────────────────────────────────────
  useEffect(() => {
    getDashboard(tid).then(r => setDashboard(r.data)).catch(() => {})
  }, [tid])

  // ── Join as spectator ─────────────────────────────────────────
  const handleJoin = () => {
    const name = nickname.trim() || 'Anonymous'
    nicknameRef.current = name
    sendRef.current?.publish({
      destination: `/app/spectator/${tid}/join`,
      body: JSON.stringify({ nickname: name })
    })
    setJoined(true)
    toast.success(`👀 Watching as ${name}`)
  }

  // ── Send reaction ─────────────────────────────────────────────
  const handleReact = (emoji) => {
    if (!joined) return toast.error('Join first to react!')
    sendRef.current?.publish({
      destination: `/app/spectator/${tid}/react`,
      body: JSON.stringify({
        emoji,
        nickname: nicknameRef.current || 'Anonymous',
        context:  phase
      })
    })
  }

  // ── Join screen ───────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="spec-join-bg">
        <motion.div className="spec-join-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}>
          <div className="spec-join-icon">👀</div>
          <h2 className="spec-join-title">Watch Live Auction</h2>
          <p className="spec-join-sub">
            Join as a spectator — watch and react with emojis
          </p>
          <input
            className="spec-nickname-input"
            placeholder="Your nickname (optional)"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={20}
          />
          <motion.button className="btn-primary full-width"
            onClick={handleJoin}
            whileTap={{ scale: 0.97 }}>
            👀 Watch Now
          </motion.button>
          <button className="spec-back-btn"
            onClick={() => navigate('/')}>
            ← Back
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="spec-bg">

      {/* Floating emoji reactions */}
      <div className="spec-float-layer" aria-hidden>
        <AnimatePresence>
          {reactions.map(r => (
            <motion.div key={r.id}
              className="spec-float-emoji"
              style={{ left: `${r.x}%` }}
              initial={{ y: 0, opacity: 1, scale: 0.8 }}
              animate={{ y: -220, opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}>
              <div className="spec-float-bubble">
                <span className="spec-float-e">{r.emoji}</span>
                <span className="spec-float-name">{r.name}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="spec-header">
        <div className="spec-header-left">
          <span className="spec-live-dot" />
          <span className="spec-live-label">LIVE</span>
          <span className="spec-tournament-name">
            {dashboard?.tournamentName}
          </span>
        </div>
        <div className="spec-header-center">
          {lastEvent && (
            <motion.span className="spec-last-event"
              key={lastEvent}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}>
              {lastEvent}
            </motion.span>
          )}
        </div>
        <div className="spec-header-right">
          <span className="spec-watcher-count">
            👀 {spectatorCount} watching
          </span>
        </div>
      </div>

      {/* SOLD flash overlay */}
      <AnimatePresence>
        {soldFlash && (
          <motion.div className="spec-sold-flash"
            style={{ '--sc': soldFlash.color || '#22c55e' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}>
            <div className="ssf-hammer">🔨</div>
            <div className="ssf-sold">SOLD!</div>
            <div className="ssf-player">{soldFlash.player}</div>
            <div className="ssf-arrow">→</div>
            <div className="ssf-team"
              style={{ color: soldFlash.color }}>
              {soldFlash.team}
            </div>
            <div className="ssf-price">
              ₹{Number(soldFlash.price || 0).toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main spectator layout */}
      <div className="spec-main">

        {/* LEFT: player card + stats */}
        <div className="spec-left">
          {spinResult ? (
            <PlayerCard
              player={spinResult}
              currentBid={auctionState?.currentBid}
            />
          ) : (
            <div className="spec-waiting">
              <div className="spec-waiting-icon">🎰</div>
              <p>Waiting for next player...</p>
            </div>
          )}

          {/* Current bid */}
          {auctionState?.currentBid && (
            <motion.div className="spec-bid-display"
              key={auctionState.currentBid}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}>
              <div className="spec-bid-amount">
                ₹{Number(auctionState.currentBid).toLocaleString()}
              </div>
              {auctionState.highBidderTeamName && (
                <div className="spec-bid-leader"
                  style={{ color: auctionState.highBidderTeamColor }}>
                  🏆 {auctionState.highBidderTeamName}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* CENTER: timer + reactions */}
        <div className="spec-center">
          <TimerRing
            remaining={timerState?.remainingSeconds ?? 0}
            total={timerState?.totalSeconds ?? 30}
            isPaused={timerState?.isPaused ?? false}
          />

          {/* Phase badge */}
          <div className={`spec-phase-badge phase-${phase?.toLowerCase()}`}>
            {phase === 'BIDDING'       && '💰 BIDDING'}
            {phase === 'PLAYER_REVEAL' && '🎴 PLAYER REVEALED'}
            {phase === 'SOLD'          && '🔨 SOLD'}
            {phase === 'UNSOLD'        && '❌ UNSOLD'}
            {phase === 'SPINNING'      && '🎰 SPINNING'}
            {phase === 'PAUSED'        && '⏸ PAUSED'}
            {phase === 'IDLE'          && '⏳ WAITING'}
            {phase === 'COMPLETED'     && '🏆 FINISHED'}
          </div>

          {/* Reaction bar */}
          <ReactionBar
            emojis={EMOJIS}
            counts={reactionCounts}
            onReact={handleReact}
            disabled={!joined}
          />

          {/* Stats mini */}
          <div className="spec-mini-stats">
            <div className="spec-ms-item">
              <span className="spec-ms-val">
                {auctionState?.playersSold ?? dashboard?.playersSold ?? 0}
              </span>
              <span className="spec-ms-lbl">Sold</span>
            </div>
            <div className="spec-ms-item">
              <span className="spec-ms-val">
                {auctionState?.playersRemaining ?? dashboard?.playersRemaining ?? 0}
              </span>
              <span className="spec-ms-lbl">Left</span>
            </div>
            <div className="spec-ms-item">
              <span className="spec-ms-val">
                {dashboard?.totalTeams ?? 0}
              </span>
              <span className="spec-ms-lbl">Teams</span>
            </div>
          </div>
        </div>

        {/* RIGHT: team scoreboard */}
        <div className="spec-right">
          <div className="spec-board-title">🏆 Teams</div>
          <div className="spec-team-board">
            {dashboard?.teams?.map(t => (
              <div key={t.teamId} className="spec-team-row"
                style={{ borderLeft: `3px solid ${t.teamColor}` }}>
                <div className="spec-team-info">
                  <span className="spec-team-name"
                    style={{ color: t.teamColor }}>
                    {t.teamName}
                  </span>
                  <span className="spec-team-captain">
                    {t.captainName}
                  </span>
                </div>
                <div className="spec-team-nums">
                  <span className="spec-team-players">
                    👥 {t.playerCount}
                  </span>
                  <span className="spec-team-budget">
                    ₹{Number(t.remainingBudget || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}