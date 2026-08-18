import { useEffect, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuctionStore } from '../store/auctionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { getDashboard, getBidMode, verifyTeamAccess } from '../api/auctionApi'
import PlayerCard from '../components/PlayerCard'
import TimerRing from '../components/TimerRing'
import SelfBidPanel from '../components/SelfBidPanel'

export default function CaptainView() {
  const { tid } = useParams()
  const navigate = useNavigate()

  const {
    team,
    auctionState,
    timerState,
    spinResult,
    dashboard,
    setAuctionState,
    setTimerState,
    setSpinResult,
    setDashboard,
    clearIdentity
  } = useAuctionStore()

  const [myTeamCard, setMyTeamCard] = useState(null)

  // ✅ Bid Mode
  const [bidMode, setBidModeState] = useState('ORGANIZER_CONTROLLED')

  // ✅ Guards against stale/mismatched identity (e.g. bookmarked URL,
  // shared link, or leftover session data from a different team/tournament)
  const [identityChecked, setIdentityChecked] = useState(false)

  useWebSocket(useCallback((client) => {
    client.subscribe(`/topic/auction/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      setAuctionState(data)

      // ✅ Listen for mode changes
      if (data.event === 'BID_MODE_CHANGED') {
        setBidModeState(data.bidMode)
      }
    })

    client.subscribe(`/topic/auction/${tid}/timer`, (msg) => {
      setTimerState(JSON.parse(msg.body))
    })

    client.subscribe(`/topic/auction/${tid}/spin`, (msg) => {
      const d = JSON.parse(msg.body)
      if (d.event === 'PLAYER_REVEALED') setSpinResult(d.player)
    })

    client.subscribe(`/topic/dashboard/${tid}`, (msg) => {
      setDashboard(JSON.parse(msg.body))
    })
  }, [tid]))

  // ✅ Validate that the captain identity in this tab's session actually
  // belongs to this tournament/team before rendering anything sensitive.
  // With sessionStorage this mostly guards against stale/bookmarked state;
  // it's a cheap extra safety net on top of the storage fix.
  useEffect(() => {
    let cancelled = false

    if (!team?.id) {
      setIdentityChecked(true) // nothing to validate, let normal "no team" UI handle it
      return
    }

    verifyTeamAccess(tid, team.id)
      .then(() => {
        if (!cancelled) setIdentityChecked(true)
      })
      .catch(() => {
        if (!cancelled) {
          clearIdentity()
          navigate(`/auction/${tid}/join`, { replace: true })
        }
      })

    return () => { cancelled = true }
  }, [tid, team?.id])

  useEffect(() => {
    getDashboard(tid).then(r => setDashboard(r.data)).catch(() => {})

    // ✅ Get bid mode after dashboard load attempt
    getBidMode(tid).then(r => setBidModeState(r.data.bidMode)).catch(() => {})
  }, [tid])

  useEffect(() => {
    if (dashboard && team) {
      const card = dashboard.teams?.find(t => t.teamId === team.id)
      setMyTeamCard(card)
    }
  }, [dashboard, team])

  const isLeading = auctionState?.highBidderTeamId === team?.id

  // ✅ Avoid flashing another team's stale data while identity is verified
  if (!identityChecked) {
    return (
      <div className="captain-auction-bg">
        <div className="waiting-spin">
          <div className="spin-anim">🎰</div>
          <p>Loading your team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="captain-auction-bg">

      {/* My team header */}
      <div
        className="captain-header"
        style={{ borderColor: team?.teamColor }}
      >
        <div
          className="captain-team-name"
          style={{ color: team?.teamColor }}
        >
          {team?.teamName}
        </div>
        <div className="captain-budget-row">
          <span>
            Budget: ₹{myTeamCard?.remainingBudget?.toLocaleString() || team?.totalBudget}
          </span>
          <span>Players: {myTeamCard?.playerCount || 0}</span>
        </div>
      </div>

      <div className="captain-main">

        {/* Current player on block */}
        <div className="captain-left">
          {spinResult ? (
            <PlayerCard
              player={spinResult}
              currentBid={auctionState?.currentBid}
              compact
            />
          ) : (
            <div className="waiting-spin">
              <div className="spin-anim">🎰</div>
              <p>Waiting for next player...</p>
            </div>
          )}
        </div>

        {/* Timer + bid status */}
        <div className="captain-center">

          <TimerRing
            remaining={timerState?.remainingSeconds ?? 0}
            total={timerState?.totalSeconds ?? 30}
            isPaused={timerState?.isPaused ?? false}
          />

          {/* Current bid display */}
          <AnimatePresence>
            {auctionState?.currentBid != null && (
              <motion.div
                className={`captain-bid-status ${isLeading ? 'leading' : 'trailing'}`}
                key={auctionState.currentBid}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="bid-amount">
                  ₹{Number(auctionState.currentBid).toLocaleString()}
                </div>
                <div className={`bid-leader-tag ${isLeading ? 'you' : ''}`}>
                  {isLeading
                    ? '🏆 YOU ARE LEADING!'
                    : `${auctionState.highBidderCaptainName} is leading`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode 2: Captain self-bid panel */}
          {bidMode === 'CAPTAIN_SELF' ? (
            <SelfBidPanel
              tournamentId={Number(tid)}
              team={team}
              currentBid={auctionState?.currentBid ?? 0}
              basePrice={spinResult?.basePrice ?? 0}
              phase={auctionState?.phase}   // keep phase source consistent with server state
              bidIncrement={50}
              isHighBidder={isLeading}
            />
          ) : (
            /* Mode 1: Captain just watches */
            <div className="captain-watch-mode">
              <div className="cwm-icon">🎙️</div>
              <p className="cwm-text">Organizer-controlled bidding</p>
              <p className="cwm-sub">Shout your bid amount to the organizer</p>
              {auctionState?.phase === 'BIDDING' && (
                <motion.div
                  className="cwm-shout-hint"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  📢 Shout your bid!
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* My squad */}
        <div className="captain-right">
          <h4>My Squad ({myTeamCard?.playerCount || 0})</h4>
          <div className="captain-squad-grid">
            {myTeamCard?.players?.map(p => (
              <div key={p.playerId} className="squad-mini">
                <div className="squad-thumb">
                  {p.photoPath
                    ? <img src={`/${p.photoPath}`} alt={p.playerName} />
                    : <span>{p.playerName?.charAt(0)}</span>}
                </div>
                <span className="squad-name">{p.playerName}</span>
                <span className="squad-price">₹{p.soldPrice}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
