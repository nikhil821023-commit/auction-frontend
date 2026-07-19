import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactConfetti from 'react-confetti'
import toast from 'react-hot-toast'
import { useAuctionStore } from '../store/auctionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { getTeams } from '../api/teamApi'
import {
  getDashboard,
  initAuction,
  spinWheel,
  startBidding,
  soldPlayer,
  markUnsold,
  pauseAuction,
  resumeAuction,
  reAuction,
  getBidMode,
  setBidMode,
  completeAuction,
} from '../api/auctionApi'
import SpinWheel from '../components/SpinWheel'
import PlayerCard from '../components/PlayerCard'
import BidPanel from '../components/BidPanel'
import TimerRing from '../components/TimerRing'
import AuctionFeed from '../components/AuctionFeed'
import { useAuctionSounds } from '../hooks/useAuctionSounds'
import SoundToggle from '../components/SoundToggle'

export default function AuctionRoom() {
  const { tid } = useParams()
  const navigate = useNavigate()

  const {
    auctionState,
    timerState,
    spinResult,
    dashboard,
    setAuctionState,
    setTimerState,
    setSpinResult,
    setDashboard,
  } = useAuctionStore()

  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [teamsError, setTeamsError] = useState('')
  const [phase, setPhase] = useState('IDLE')
  const [showConfetti, setConfetti] = useState(false)
  const [initStatus, setInitStatus] = useState('pending')
  const [initError, setInitError] = useState('')
  const [playerCount, setPlayerCount] = useState(null)
  const [bidMode, setBidModeState] = useState('ORGANIZER_CONTROLLED')
  const initCalledRef = useRef(false)

  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const sounds = useAuctionSounds()

  // ── WebSocket ─────────────────────────────────────────────────────
  useWebSocket(
    useCallback(
      (client) => {
        client.subscribe(`/topic/auction/${tid}`, (msg) => {
          const data = JSON.parse(msg.body)
          setAuctionState(data)
          if (data.phase) setPhase(data.phase)
          if (data.playersRemaining != null)
            setPlayerCount(data.playersRemaining)

          if (data.event === 'PLAYER_REVEALED') {
            const tier = data.currentPlayerTier || 'BRONZE'
            sounds.playReveal(tier)
          }
          if (data.event === 'BID_PLACED') {
            sounds.playBid()
          }

          if (data.event === 'BID_MODE_CHANGED') {
            setBidModeState(data.bidMode)
            toast(
              data.bidMode === 'CAPTAIN_SELF'
                ? '📱 Captains can now self-bid!'
                : '🎙️ Organizer bid mode active',
              { icon: '🔄' }
            )
          }

          if (data.event === 'PLAYER_SOLD') {
            sounds.playSold(
              data.highBidderTeamName || '',
              data.currentBid || 0,
              data.currentPlayerName || ''
            )
            setConfetti(true)
            setTimeout(() => setConfetti(false), 3500)
            toast.success(
              `🔨 SOLD: ${data.currentPlayerName} → ${data.highBidderTeamName}`
            )
            loadTeams()
          }

          if (data.event === 'PLAYER_UNSOLD') {
            sounds.playUnsold(data.currentPlayerName || '')
            toast('❌ Unsold: ' + data.currentPlayerName, { icon: '😔' })
          }

          if (data.isBidWar && data.alertMessage) {
            const parts = data.alertMessage.split('vs')
            const team1 = parts[0]?.trim() || ''
            const team2 = parts[1]?.trim() || ''
            sounds.playBidWar(team1, team2)
            toast('🔥 BID WAR!', { icon: '🔥', duration: 2000 })
          }

          if (data.event === 'AUCTION_COMPLETED') {
            sounds.playComplete()
          }
        })

        client.subscribe(`/topic/auction/${tid}/timer`, (msg) => {
          const timerData = JSON.parse(msg.body)
          setTimerState(timerData)

          const remaining = timerData.remainingSeconds
          if (remaining <= 5 && remaining > 0) sounds.playUrgentTick()
          else if (remaining <= 10 && remaining > 0) sounds.playTick()
        })

        client.subscribe(`/topic/auction/${tid}/spin`, (msg) => {
          const data = JSON.parse(msg.body)
          if (data.event === 'PLAYER_REVEALED' && data.player) {
            setSpinResult(data.player)
            setPhase('PLAYER_REVEAL')
          }
        })

        client.subscribe(`/topic/dashboard/${tid}`, (msg) => {
          const dash = JSON.parse(msg.body)
          setDashboard(dash)

          if (dash.teams?.length > 0) {
            setTeams((prev) =>
              prev.map((t) => {
                const fresh = dash.teams.find(
                  (d) => d.teamId === (t.id || t.teamId)
                )
                if (!fresh) return t
                return {
                  ...t,
                  remainingBudget: fresh.remainingBudget,
                  spentBudget: fresh.spentBudget,
                }
              })
            )
          }
        })
      },
      [tid, setAuctionState, setTimerState, setSpinResult, setDashboard, sounds]
    )
  )

  // ── Load teams helper ─────────────────────────────────────────────
  const loadTeams = useCallback(async () => {
    setTeamsLoading(true)
    setTeamsError('')
    try {
      const res = await getTeams(tid)
      const data = res.data

      if (!Array.isArray(data)) {
        throw new Error(
          'Server returned invalid team data: ' + JSON.stringify(data)
        )
      }
      if (data.length === 0) {
        setTeamsError('No teams registered for this tournament yet')
        setTeams([])
        return
      }

      setTeams(data)
      console.log(`✅ Loaded ${data.length} teams for tournament ${tid}`)
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || 'Failed to load teams'
      setTeamsError(msg)
      setTeams([])
      console.error('loadTeams error:', err)
    } finally {
      setTeamsLoading(false)
    }
  }, [tid])

  // ── Bootstrap on mount ────────────────────────────────────────────
  useEffect(() => {
    if (initCalledRef.current) return
    initCalledRef.current = true

    const bootstrap = async () => {
      await loadTeams()

      setInitStatus('loading')
      try {
        const res = await initAuction(tid)
        const data = res.data
        if (data.status === 'INIT_FAILED') {
          setInitStatus('error')
          setInitError(data.error || 'Init failed')
          toast.error('⚠️ ' + data.error, { duration: 6000 })
          return
        }
        setPlayerCount(data.totalPlayers)
        setInitStatus('ready')
        toast.success(`✅ Auction ready! ${data.totalPlayers} players`, {
          duration: 3000,
        })
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Init failed'
        if (err.response?.status === 409 || msg.includes('already')) {
          setInitStatus('ready')
        } else {
          setInitStatus('error')
          setInitError(msg)
          toast.error('Init error: ' + msg, { duration: 6000 })
        }
      }

      try {
        const modeRes = await getBidMode(tid)
        setBidModeState(modeRes.data.bidMode || 'ORGANIZER_CONTROLLED')
      } catch {
        /* default */
      }

      try {
        const dashRes = await getDashboard(tid)
        setDashboard(dashRes.data)
      } catch {
        /* silent */
      }
    }

    bootstrap()
  }, [tid, loadTeams, setDashboard])

  // ── Bid mode toggle ───────────────────────────────────────────────
  const handleToggleBidMode = async () => {
    const next =
      bidMode === 'ORGANIZER_CONTROLLED'
        ? 'CAPTAIN_SELF'
        : 'ORGANIZER_CONTROLLED'
    try {
      await setBidMode(tid, next)
      setBidModeState(next)
      toast.success(
        next === 'CAPTAIN_SELF'
          ? '📱 Captains can now bid from their screens'
          : '🎙️ Organizer bid mode activated'
      )
    } catch {
      toast.error('Could not switch bid mode')
    }
  }

  // ── Action handlers ───────────────────────────────────────────────
  const handleSpin = async () => {
    if (initStatus !== 'ready') {
      toast.error(
        initStatus === 'loading'
          ? 'Still initializing...'
          : initError || 'Auction not ready'
      )
      return
    }

    sounds.playWheelSpin()

    try {
      setPhase('SPINNING')
      await spinWheel(tid)
    } catch (err) {
      setPhase('IDLE')
      toast.error(err.response?.data?.error || 'Spin failed')
    }
  }

  const handleBidding = async () => {
    try {
      await startBidding(tid)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    }
  }

  const handleSold = async () => {
    try {
      await soldPlayer(tid)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    }
  }

  const handleUnsold = async () => {
    try {
      await markUnsold(tid)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    }
  }

  const handlePause = async () => {
    try {
      phase === 'PAUSED' ? await resumeAuction(tid) : await pauseAuction(tid)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    }
  }

  const handleReAuction = async () => {
    try {
      await reAuction(tid)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    }
  }

  const handleBiddingEndAuction = async () => {
    try {
      await completeAuction(tid)
      toast.success('🏆 Auction ended!')
      setTimeout(() => navigate(`/post-auction/${tid}`), 1500)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not end auction')
    } finally {
      setShowEndConfirm(false)
    }
  }

  const isReady = initStatus === 'ready'
  const isLoading = initStatus === 'loading' || initStatus === 'pending'

  return (
    <div className="auction-bg">
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={350} />}

      {/* TOP BAR */}
      <div className="auction-topbar stadium-topbar">
        <div className="stadium-topbar-left">
          <span className="stadium-logo-dot" />
          <span className="stadium-title">AUCTIONX</span>
          <span className="stadium-live-badge">● LIVE</span>
        </div>

        <div className="stadium-topbar-center">
          {isLoading ? (
            <span className="stadium-badge loading">⚙ INITIALIZING</span>
          ) : isReady ? (
            <span className="stadium-badge ready">✓ READY</span>
          ) : (
            <span className="stadium-badge error">✕ ERROR</span>
          )}
          <span className="stadium-stat">
            🟢 {playerCount ?? '—'} REMAINING
          </span>
          <span className="stadium-stat">
            ⚡ {auctionState?.playersSold ?? 0} SOLD
          </span>
          <span className="stadium-stat">
            ✕ {auctionState?.playersUnsold ?? 0} UNSOLD
          </span>
        </div>

        <div className="stadium-topbar-right">
          

          <motion.button
            className="stadium-btn cyan"
            onClick={() => window.open(`/projector/${tid}`, '_blank')}
            whileTap={{ scale: 0.97 }}
          >
            🖥 PROJECTOR
          </motion.button>

          <motion.button
            className="stadium-btn yellow"
            onClick={() => navigate(`/dashboard/${tid}`)}
            whileTap={{ scale: 0.97 }}
          >
            📊 DASHBOARD
          </motion.button>

          <motion.button
            className="btn-outline"
            onClick={() => {
              const url = `${window.location.origin}/spectate/${tid}`
              navigator.clipboard.writeText(url)
              toast.success('Spectator link copied!')
            }}
            whileTap={{ scale: 0.97 }}
          >
            👀 Share Watch Link
          </motion.button>

          {phase === 'COMPLETED' ? (
            <motion.button
              className="btn-primary"
              onClick={() => navigate(`/post-auction/${tid}`)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              🏆 View Final Results
            </motion.button>
          ) : (
            <motion.button
              className="stadium-btn red"
              onClick={() => setShowEndConfirm(true)}
              whileTap={{ scale: 0.97 }}
            >
              🏁 END
            </motion.button>
          )}
        </div>
      </div>

      {/* End Auction Confirm Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="end-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              className="end-confirm-box"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ecb-icon">🏁</div>
              <h3 className="ecb-title">End Auction?</h3>
              <p className="ecb-body">
                This will close the auction and take everyone to the final
                results screen.
                {auctionState?.playersRemaining > 0 && (
                  <span className="ecb-warn">
                    &nbsp;⚠️ {auctionState.playersRemaining} players still
                    remaining!
                  </span>
                )}
              </p>
              <div className="ecb-actions">
                <motion.button
                  className="ecb-cancel"
                  onClick={() => setShowEndConfirm(false)}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="ecb-confirm"
                  onClick={handleBiddingEndAuction}
                  whileTap={{ scale: 0.97 }}
                >
                  🏆 Yes, End Auction
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR BANNERS */}
      <AnimatePresence>
        {initStatus === 'error' && (
          <motion.div
            className="error-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span>⚠️ {initError}</span>
            <div className="error-banner-actions">
              {initError?.toLowerCase().includes('player') && (
                <button
                  className="btn-outline"
                  onClick={() => navigate(`/organizer/players/${tid}`)}
                >
                  ➕ Add Players
                </button>
              )}
            </div>
          </motion.div>
        )}

        {teamsError && (
          <motion.div
            className="error-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span>👥 Teams: {teamsError}</span>
            <button className="btn-accent" onClick={loadTeams}>
              🔄 Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="auction-main">
        {/* LEFT: Wheel / Player Card + Controls */}
        <div className="auction-left">
          <AnimatePresence mode="wait">
            {phase === 'IDLE' || phase === 'SPINNING' ? (
              <motion.div
                key="wheel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SpinWheel
                  players={Array.from({ length: playerCount ?? 8 }, (_, i) => ({
                    name: `P${i + 1}`,
                  }))}
                  isSpinning={phase === 'SPINNING'}
                  onSpin={handleSpin}
                  disabled={!isReady}
                />
              </motion.div>
            ) : (
              <motion.div
                key="card"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <PlayerCard
                  player={spinResult}
                  currentBid={auctionState?.currentBid}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auction-controls">
            {phase === 'PLAYER_REVEAL' && (
              <motion.button
                className="btn-primary"
                onClick={handleBidding}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                🔔 Start Bidding
              </motion.button>
            )}

            {(phase === 'BIDDING' || phase === 'PAUSED') && (
              <>
                <motion.button
                  className="btn-sold"
                  onClick={handleSold}
                  whileTap={{ scale: 0.96 }}
                >
                  🔨 SOLD
                </motion.button>
                <motion.button
                  className="btn-unsold"
                  onClick={handleUnsold}
                  whileTap={{ scale: 0.96 }}
                >
                  ❌ UNSOLD
                </motion.button>
                <motion.button
                  className="btn-pause"
                  onClick={handlePause}
                  whileTap={{ scale: 0.96 }}
                >
                  {phase === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
                </motion.button>
              </>
            )}

            {(phase === 'SOLD' || phase === 'UNSOLD') &&
              !auctionState?.autoSpin && (
                <motion.button
                  className="btn-primary"
                  onClick={handleSpin}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  🎰 Spin Next
                </motion.button>
              )}

            {auctionState?.playersRemaining === 0 &&
              auctionState?.playersUnsold > 0 && (
                <motion.button className="btn-accent" onClick={handleReAuction}>
                  🔄 Re-Auction Unsold ({auctionState.playersUnsold})
                </motion.button>
              )}

            {phase === 'COMPLETED' && (
              <motion.button
                className="btn-primary"
                onClick={() => navigate(`/post-auction/${tid}`)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                🏆 View Final Results
              </motion.button>
            )}
          </div>
        </div>

        {/* CENTER: Mode toggle + Timer + Bid Panel */}
        <div className="auction-center">
          <div className="bid-mode-switcher">
            <span className="bms-label">Bid Mode</span>
            <div className="bms-toggle-wrap">
              <motion.button
                className={`bms-opt ${
                  bidMode === 'ORGANIZER_CONTROLLED' ? 'active' : ''
                }`}
                onClick={() =>
                  bidMode !== 'ORGANIZER_CONTROLLED' && handleToggleBidMode()
                }
                whileTap={{ scale: 0.97 }}
              >
                🎙️ Organizer
              </motion.button>
              <motion.button
                className={`bms-opt ${bidMode === 'CAPTAIN_SELF' ? 'active' : ''}`}
                onClick={() =>
                  bidMode !== 'CAPTAIN_SELF' && handleToggleBidMode()
                }
                whileTap={{ scale: 0.97 }}
              >
                📱 Self-Bid
              </motion.button>
            </div>
          </div>

          <TimerRing
            remaining={timerState?.remainingSeconds ?? 0}
            total={timerState?.totalSeconds ?? 30}
            isPaused={timerState?.isPaused ?? false}
          />

          <AnimatePresence>
            {auctionState?.currentBid != null && (
              <motion.div
                className="current-bid-box"
                key={auctionState.currentBid}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="bid-amount">
                  ₹{Number(auctionState.currentBid).toLocaleString()}
                </div>
                {auctionState.highBidderCaptainName && (
                  <div
                    className="bid-leader"
                    style={{ color: auctionState.highBidderTeamColor || '#fff' }}
                  >
                    🏆 {auctionState.highBidderCaptainName}
                    <span className="bid-leader-team">
                      &nbsp;— {auctionState.highBidderTeamName}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {bidMode === 'ORGANIZER_CONTROLLED' && (
            <BidPanel
              teams={teams}
              teamsLoading={teamsLoading}
              teamsError={teamsError}
              onRetryTeams={loadTeams}
              phase={phase}
              tournamentId={Number(tid)}
              bidIncrement={50}
              currentBid={auctionState?.currentBid || 0}
            />
          )}

          {bidMode === 'CAPTAIN_SELF' && (
            <div className="self-bid-info-box">
              <div className="sbi-icon">📱</div>
              <div className="sbi-text">
                <strong>Captain Self-Bid Active</strong>
                <p>Captains are bidding from their screens. Monitor the feed.</p>
              </div>
              <div className="sbi-teams">
                {teams.map((t) => (
                  <div key={t.id} className="sbi-team-row">
                    <div
                      className="sbi-dot"
                      style={{ background: t.teamColor }}
                    />
                    <span>{t.captainName}</span>
                    <span className="sbi-budget">
                      ₹{(t.remainingBudget ?? t.totalBudget)?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Activity Feed */}
        <div className="auction-right">
          <AuctionFeed feed={dashboard?.recentActivity || []} />
        </div>
      </div>
    </div>
  )
}