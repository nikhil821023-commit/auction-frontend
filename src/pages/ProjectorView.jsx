import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '../hooks/useWebSocket'
import { getDashboard } from '../api/auctionApi'
import { useAuctionStore } from '../store/auctionStore'
import { playerImageUrl } from '../utils/imageUrl'

const TIER_COLORS = {
  PLATINUM: '#e5c100',
  GOLD:     '#f97316',
  SILVER:   '#94a3b8',
  BRONZE:   '#cd7f32',
}

// Particle burst on SOLD
function Particles({ color }) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * 360,
    distance: 80 + Math.random() * 120,
    size: 4 + Math.random() * 8,
  }))
  return (
    <div className="pv-particles">
      {particles.map(p => (
        <motion.div key={p.id}
          className="pv-particle"
          style={{
            background: color,
            width: p.size,
            height: p.size,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
      ))}
    </div>
  )
}

export default function ProjectorView() {
  const { tid }    = useParams()

  const {
    auctionState, timerState, spinResult, dashboard,
    setAuctionState, setTimerState, setSpinResult, setDashboard
  } = useAuctionStore()

  const [phase, setPhase]           = useState('IDLE')
  const [soldEvent, setSoldEvent]   = useState(null)
  const [bidWarActive, setBidWar]   = useState(false)
  const [lastBid, setLastBid]       = useState(null)
  const [showParticles, setParticles] = useState(false)
  const bidWarTimer                 = useRef(null)

  // WS connection
  useWebSocket(useCallback((client) => {
    client.subscribe(`/topic/auction/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      setAuctionState(data)
      if (data.phase) setPhase(data.phase)

      if (data.event === 'BID_PLACED') {
        setLastBid({
          team:   data.highBidderTeamName,
          captain:data.highBidderCaptainName,
          amount: data.currentBid,
          color:  data.highBidderTeamColor,
        })
      }

      if (data.event === 'PLAYER_SOLD') {
        setSoldEvent({
          player: data.currentPlayerName,
          team:   data.highBidderTeamName,
          captain:data.highBidderCaptainName,
          price:  data.currentBid,
          color:  data.highBidderTeamColor || '#22c55e',
          tier:   data.currentPlayerTier,
        })
        setParticles(true)
        setTimeout(() => {
          setSoldEvent(null)
          setParticles(false)
        }, 5000)
      }

      if (data.isBidWar) {
        setBidWar(true)
        clearTimeout(bidWarTimer.current)
        bidWarTimer.current = setTimeout(
          () => setBidWar(false), 4000)
      }
    })

    client.subscribe(`/topic/auction/${tid}/timer`, (msg) => {
      setTimerState(JSON.parse(msg.body))
    })

    client.subscribe(`/topic/auction/${tid}/spin`, (msg) => {
      const d = JSON.parse(msg.body)
      if (d.event === 'PLAYER_REVEALED' && d.player) {
        setSpinResult(d.player)
        setPhase('PLAYER_REVEAL')
      }
    })

    client.subscribe(`/topic/dashboard/${tid}`, (msg) => {
      setDashboard(JSON.parse(msg.body))
    })
  }, [tid]))

  useEffect(() => {
    getDashboard(tid)
      .then(r => setDashboard(r.data))
      .catch(() => {})
  }, [tid])

  const remaining = timerState?.remainingSeconds ?? 0
  const total     = timerState?.totalSeconds ?? 30
  const timerPct  = total > 0 ? (remaining / total) * 100 : 0
  const isLow     = remaining <= 10 && remaining > 0
  const timerColor = timerState?.isPaused ? '#f59e0b'
                   : isLow ? '#ef4444' : '#22d3ee'

  const player = spinResult
  const tc = TIER_COLORS[
    player?.playerTier || player?.tier
  ] || '#22d3ee'

  return (
    <div className={`pv-bg ${bidWarActive ? 'bid-war-mode' : ''}`}>

      {/* Animated background grid */}
      <div className="pv-grid-bg" aria-hidden />

      {/* Particles on sold */}
      <AnimatePresence>
        {showParticles && soldEvent && (
          <div className="pv-particles-wrap">
            <Particles color={soldEvent.color} />
          </div>
        )}
      </AnimatePresence>

      {/* ── BID WAR OVERLAY ─────────────────────────────── */}
      <AnimatePresence>
        {bidWarActive && (
          <motion.div className="pv-bid-war-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div className="pv-bid-war-text"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}>
              🔥 BID WAR 🔥
            </motion.div>
            <div className="pv-bid-war-teams">
              {auctionState?.alertMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOLD OVERLAY ─────────────────────────────────── */}
      <AnimatePresence>
        {soldEvent && (
          <motion.div className="pv-sold-overlay"
            style={{ '--sc': soldEvent.color }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4 }}>

            <motion.div className="pv-sold-gavel"
              animate={{ rotate: [-20, 10, -20] }}
              transition={{ repeat: 3, duration: 0.3 }}>
              🔨
            </motion.div>

            <motion.div className="pv-sold-word"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}>
              SOLD!
            </motion.div>

            <motion.div className="pv-sold-player"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}>
              {soldEvent.player}
            </motion.div>

            <motion.div className="pv-sold-arrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}>
              →
            </motion.div>

            <motion.div className="pv-sold-team"
              style={{ color: soldEvent.color }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}>
              {soldEvent.team}
            </motion.div>

            <motion.div className="pv-sold-price"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7,
                type: 'spring', stiffness: 200 }}>
              ₹{Number(soldEvent.price).toLocaleString()}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN LAYOUT ──────────────────────────────────── */}
      <div className="pv-main">

        {/* LEFT: Player card */}
        <div className="pv-left">
          <AnimatePresence mode="wait">
            {player && (phase === 'PLAYER_REVEAL'
                     || phase === 'BIDDING'
                     || phase === 'PAUSED') ? (
              <motion.div key={player.playerName || player.name}
                className="pv-player-card"
                style={{ '--tc': tc }}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.6 }}>

                {/* Tier glow */}
                <div className="pv-tier-glow"
                  style={{ background: tc }} />

                {/* Tier ribbon */}
                <div className="pv-tier-ribbon"
                  style={{ background: tc }}>
                  {player.playerTier || player.tier}
                </div>

                {/* Player photo */}
                <div className="pv-player-photo-wrap">
                  <ProjectorPhoto player={player} tc={tc} />
                </div>

                {/* Name */}
                <h1 className="pv-player-name">
                  {player.playerName || player.name}
                </h1>

                {/* Role badge */}
                <div className="pv-role-badge">
                  {player.playerRole || player.role}
                </div>

                {/* Stats row */}
                <div className="pv-stats-row">
                  {player.matches && (
                    <div className="pv-stat">
                      <span className="pv-stat-val">
                        {player.matches}
                      </span>
                      <span className="pv-stat-lbl">Matches</span>
                    </div>
                  )}
                  {player.average && (
                    <div className="pv-stat">
                      <span className="pv-stat-val">
                        {player.average}
                      </span>
                      <span className="pv-stat-lbl">Average</span>
                    </div>
                  )}
                  {player.strikeRate && (
                    <div className="pv-stat">
                      <span className="pv-stat-val">
                        {player.strikeRate}
                      </span>
                      <span className="pv-stat-lbl">S/R</span>
                    </div>
                  )}
                  {player.nationality && (
                    <div className="pv-stat">
                      <span className="pv-stat-val flag">
                        {player.nationality}
                      </span>
                      <span className="pv-stat-lbl">
                        Nationality
                      </span>
                    </div>
                  )}
                </div>

                {/* Base price */}
                <div className="pv-base-price">
                  BASE PRICE:
                  <span>
                    ₹{Number(
                        player.basePrice ||
                        player.currentPlayerBasePrice || 0
                      ).toLocaleString()}
                  </span>
                </div>

              </motion.div>
            ) : (
              <motion.div key="idle"
                className="pv-idle-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <div className="pv-idle-wheel">🎰</div>
                <div className="pv-idle-text">
                  {phase === 'IDLE'      && 'Waiting for spin...'}
                  {phase === 'SPINNING'  && 'Spinning!'}
                  {phase === 'SOLD'      && 'SOLD! Next player soon...'}
                  {phase === 'UNSOLD'    && 'UNSOLD. Next player...'}
                  {phase === 'PAUSED'    && '⏸ Auction Paused'}
                  {phase === 'COMPLETED' && '🏆 Auction Complete!'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CENTER: Bid + Timer */}
        <div className="pv-center">

          {/* Tournament name */}
          <div className="pv-tournament-name">
            {dashboard?.tournamentName}
          </div>

          {/* Circular timer */}
          <div className="pv-timer-wrap">
            <svg className="pv-timer-svg"
              viewBox="0 0 200 200">
              {/* Background circle */}
              <circle cx="100" cy="100" r="88"
                fill="none" stroke="#1e2235"
                strokeWidth="12" />
              {/* Progress arc */}
              <circle cx="100" cy="100" r="88"
                fill="none"
                stroke={timerColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={
                  `${(timerPct / 100) * 553} 553`
                }
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 0.9s ease,stroke 0.3s' }}
              />
              {/* Timer glow */}
              {isLow && !timerState?.isPaused && (
                <circle cx="100" cy="100" r="88"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray={
                    `${(timerPct / 100) * 553} 553`
                  }
                  transform="rotate(-90 100 100)"
                  opacity="0.4"
                  filter="blur(4px)"
                />
              )}
              {/* Timer text */}
              <text x="100" y="92"
                textAnchor="middle"
                fill={timerColor}
                fontSize="48"
                fontFamily="Bebas Neue, sans-serif"
                letterSpacing="2">
                {timerState?.isPaused ? '⏸' : remaining}
              </text>
              <text x="100" y="118"
                textAnchor="middle"
                fill="#8891aa"
                fontSize="14"
                fontFamily="DM Sans, sans-serif"
                letterSpacing="1">
                {timerState?.isPaused ? 'PAUSED' : 'SECONDS'}
              </text>
            </svg>

            {/* Pulsing ring on urgency */}
            {isLow && !timerState?.isPaused && (
              <motion.div className="pv-timer-pulse"
                animate={{ scale: [1, 1.15, 1],
                           opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity,
                              duration: 0.8 }} />
            )}
          </div>

          {/* Current bid display */}
          <AnimatePresence mode="wait">
            {auctionState?.currentBid ? (
              <motion.div className="pv-bid-display"
                key={auctionState.currentBid}
                initial={{ scale: 1.25, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                exit={{ scale: 0.9,     opacity: 0 }}>

                <div className="pv-bid-label">
                  CURRENT BID
                </div>
                <div className="pv-bid-amount">
                  ₹{Number(auctionState.currentBid)
                      .toLocaleString()}
                </div>
                {auctionState.highBidderTeamName && (
                  <div className="pv-bid-leader"
                    style={{
                      color: auctionState.highBidderTeamColor
                             || '#22c55e'
                    }}>
                    <span className="pv-bl-icon">🏆</span>
                    <span className="pv-bl-team">
                      {auctionState.highBidderTeamName}
                    </span>
                  </div>
                )}
                {auctionState.highBidderCaptainName && (
                  <div className="pv-bid-captain">
                    {auctionState.highBidderCaptainName}
                  </div>
                )}

              </motion.div>
            ) : (
              <motion.div key="no-bid" className="pv-no-bid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}>
                <div className="pv-no-bid-label">BASE PRICE</div>
                <div className="pv-no-bid-amount">
                  ₹{Number(
                      auctionState?.currentPlayerBasePrice || 0
                    ).toLocaleString()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats bar */}
          <div className="pv-stats-bar">
            <div className="pv-sb-item">
              <span className="pv-sb-val">
                {auctionState?.playersRemaining ?? '...'}
              </span>
              <span className="pv-sb-lbl">Remaining</span>
            </div>
            <div className="pv-sb-divider" />
            <div className="pv-sb-item">
              <span className="pv-sb-val">
                {auctionState?.playersSold ?? 0}
              </span>
              <span className="pv-sb-lbl">Sold</span>
            </div>
            <div className="pv-sb-divider" />
            <div className="pv-sb-item">
              <span className="pv-sb-val">
                {dashboard?.totalTeams ?? 0}
              </span>
              <span className="pv-sb-lbl">Teams</span>
            </div>
          </div>

        </div>

        {/* RIGHT: Team scoreboard */}
        <div className="pv-right">
          <div className="pv-board-title">TEAM BUDGETS</div>
          <div className="pv-team-board">
            {dashboard?.teams?.map((t, i) => (
              <motion.div key={t.teamId}
                className={`pv-team-row ${
                  auctionState?.highBidderTeamId === t.teamId
                  ? 'leading' : ''}`}
                style={{ '--tc': t.teamColor || '#888' }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                layout>

                {/* Color bar */}
                <div className="pvt-bar"
                  style={{ background: t.teamColor }} />

                <div className="pvt-info">
                  <span className="pvt-name"
                    style={{ color: t.teamColor }}>
                    {t.teamName}
                  </span>
                  <span className="pvt-captain">
                    {t.captainName}
                  </span>
                </div>

                <div className="pvt-right">
                  <span className="pvt-players">
                    👥 {t.playerCount}
                  </span>
                  <span className="pvt-budget">
                    ₹{Number(t.remainingBudget || 0)
                        .toLocaleString()}
                  </span>

                  {/* Budget progress */}
                  <div className="pvt-budget-bar">
                    <motion.div
                      style={{
                        background: t.teamColor,
                        width: `${t.budgetUsedPercent || 0}%`
                      }}
                      animate={{
                        width: `${t.budgetUsedPercent || 0}%`
                      }}
                      transition={{ duration: 0.6 }} />
                  </div>
                </div>

                {/* Leading indicator */}
                {auctionState?.highBidderTeamId
                 === t.teamId && (
                  <motion.div className="pvt-leading"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      repeat: Infinity, duration: 0.8
                    }}>
                    🏆
                  </motion.div>
                )}

              </motion.div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="pv-recent-title">LAST SOLD</div>
          <div className="pv-recent-list">
            {dashboard?.recentActivity
              ?.filter(a => a.event === 'SOLD')
              ?.slice(0, 4)
              ?.map((a, i) => (
              <div key={i} className="pv-recent-row">
                <span className="pv-recent-player">
                  {a.playerName}
                </span>
                <span className="pv-recent-arrow">→</span>
                <span className="pv-recent-team"
                  style={{ color: a.teamColor }}>
                  {a.teamName}
                </span>
                <span className="pv-recent-price">
                  ₹{Number(a.soldPrice || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom ticker */}
      <div className="pv-ticker">
        <div className="pv-ticker-inner">
          {dashboard?.recentActivity?.map((a, i) => (
            <span key={i} className="pv-ticker-item">
              {a.event === 'SOLD'
                ? `🔨 ${a.playerName} → ${a.teamName} @ ₹${Number(a.soldPrice).toLocaleString()}`
                : `❌ ${a.playerName} UNSOLD`}
              &nbsp;&nbsp;•&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}

function ProjectorPhoto({ player, tc }) {
  const [err, setErr] = useState(false)
  const src = playerImageUrl(
    player?.playerPhotoPath || player?.photoPath)

  if (src && !err) {
    return (
      <img src={src} alt={player?.playerName || player?.name}
        className="pv-player-photo"
        onError={() => setErr(true)} />
    )
  }
  return (
    <div className="pv-player-avatar" style={{ color: tc }}>
      {(player?.playerName || player?.name)?.charAt(0)}
    </div>
  )
}