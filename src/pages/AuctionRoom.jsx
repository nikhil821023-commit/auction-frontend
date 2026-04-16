import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactConfetti from 'react-confetti'
import toast from 'react-hot-toast'
import { useAuctionStore } from '../store/auctionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { getTeams } from '../api/teamApi'
import { getDashboard, spinWheel, startBidding, soldPlayer,
         markUnsold, pauseAuction, resumeAuction, reAuction } from '../api/auctionApi'
import SpinWheel    from '../components/SpinWheel'
import PlayerCard   from '../components/PlayerCard'
import BidPanel     from '../components/BidPanel'
import TimerRing    from '../components/TimerRing'
import AuctionFeed  from '../components/AuctionFeed'

export default function AuctionRoom() {
  const { tid }     = useParams()
  const navigate    = useNavigate()
  const { auctionState, timerState, spinResult, dashboard,
          setAuctionState, setTimerState, setSpinResult, setDashboard } = useAuctionStore()

  const [teams, setTeams]         = useState([])
  const [showConfetti, setConfetti] = useState(false)
  const [phase, setPhase]         = useState('IDLE')

  const { sendMessage } = useWebSocket(useCallback((client) => {
    client.subscribe(`/topic/auction/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      setAuctionState(data)
      setPhase(data.phase)

      if (data.event === 'PLAYER_SOLD') {
        setConfetti(true)
        setTimeout(() => setConfetti(false), 3500)
        toast.success(`🔨 SOLD: ${data.currentPlayerName} → ${data.highBidderTeamName}`)
      }
      if (data.event === 'PLAYER_UNSOLD') {
        toast('❌ Unsold: ' + data.currentPlayerName, { icon: '😔' })
      }
      if (data.isBidWar) {
        toast('🔥 BID WAR!', { icon: '🔥', duration: 1500 })
      }
    })

    client.subscribe(`/topic/auction/${tid}/timer`, (msg) => {
      setTimerState(JSON.parse(msg.body))
    })

    client.subscribe(`/topic/auction/${tid}/spin`, (msg) => {
      const data = JSON.parse(msg.body)
      if (data.event === 'PLAYER_REVEALED') setSpinResult(data.player)
    })

    client.subscribe(`/topic/dashboard/${tid}`, (msg) => {
      setDashboard(JSON.parse(msg.body))
    })
  }, [tid]))

  useEffect(() => {
    getTeams(tid).then(r => setTeams(r.data)).catch(() => {})
    getDashboard(tid).then(r => setDashboard(r.data)).catch(() => {})
  }, [tid])

  const handleSpin      = () => spinWheel(tid)
  const handleBidding   = () => startBidding(tid)
  const handleSold      = () => soldPlayer(tid)
  const handleUnsold    = () => markUnsold(tid)
  const handlePause     = () => phase === 'PAUSED' ? resumeAuction(tid) : pauseAuction(tid)
  const handleReAuction = () => reAuction(tid)

  return (
    <div className="auction-bg">
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={350} />}

      {/* TOP BAR */}
      <div className="auction-topbar">
        <span className="auction-title">🏏 AuctionX — Live</span>
        <div className="auction-topbar-stats">
          <span>🟢 {auctionState?.playersRemaining || 0} remaining</span>
          <span>🔨 {auctionState?.playersSold || 0} sold</span>
          <span>❌ {auctionState?.playersUnsold || 0} unsold</span>
        </div>
        <motion.button className="btn-outline"
          onClick={() => navigate(`/dashboard/${tid}`)}>
          📊 Dashboard
        </motion.button>
      </div>

      <div className="auction-main">

        {/* LEFT: Wheel + Player Card */}
        <div className="auction-left">
          <AnimatePresence mode="wait">
            {phase === 'IDLE' || phase === 'SPINNING' ? (
              <motion.div key="wheel"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <SpinWheel
                  players={auctionState?.playersRemaining || []}
                  isSpinning={phase === 'SPINNING'}
                  onSpin={handleSpin}
                />
              </motion.div>
            ) : (
              <motion.div key="card"
                initial={{ scale:0.8, opacity:0 }}
                animate={{ scale:1, opacity:1 }}
                exit={{ scale:0.8, opacity:0 }}>
                <PlayerCard player={spinResult} currentBid={auctionState?.currentBid} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTROL BUTTONS */}
          <div className="auction-controls">
            {phase === 'PLAYER_REVEAL' && (
              <motion.button className="btn-primary" onClick={handleBidding}
                initial={{ scale:0 }} animate={{ scale:1 }}>
                🔔 Start Bidding
              </motion.button>
            )}
            {(phase === 'BIDDING' || phase === 'PAUSED') && (
              <>
                <motion.button className="btn-sold" onClick={handleSold}
                  whileTap={{ scale:0.96 }}>
                  🔨 SOLD
                </motion.button>
                <motion.button className="btn-unsold" onClick={handleUnsold}
                  whileTap={{ scale:0.96 }}>
                  ❌ UNSOLD
                </motion.button>
                <motion.button className="btn-pause" onClick={handlePause}
                  whileTap={{ scale:0.96 }}>
                  {phase === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
                </motion.button>
              </>
            )}
            {(phase === 'SOLD' || phase === 'UNSOLD') &&
              !auctionState?.autoSpin && (
              <motion.button className="btn-primary" onClick={handleSpin}
                initial={{ scale:0 }} animate={{ scale:1 }}>
                🎰 Spin Next
              </motion.button>
            )}
            {auctionState?.playersRemaining === 0 &&
             auctionState?.playersUnsold > 0 && (
              <motion.button className="btn-accent" onClick={handleReAuction}>
                🔄 Re-Auction Unsold ({auctionState.playersUnsold})
              </motion.button>
            )}
          </div>
        </div>

        {/* CENTER: Timer + Bid Panel */}
        <div className="auction-center">
          <TimerRing
            remaining={timerState?.remainingSeconds || 0}
            total={timerState?.totalSeconds || 30}
            isPaused={timerState?.isPaused}
          />

          {/* Current bid display */}
          <AnimatePresence>
            {auctionState?.currentBid && (
              <motion.div className="current-bid-box"
                key={auctionState.currentBid}
                initial={{ scale:1.3, opacity:0 }}
                animate={{ scale:1, opacity:1 }}>
                <div className="bid-amount">₹{auctionState.currentBid?.toLocaleString()}</div>
                {auctionState.highBidderCaptainName && (
                  <div className="bid-leader"
                    style={{ color: auctionState.highBidderTeamColor || '#fff' }}>
                    🏆 {auctionState.highBidderCaptainName}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <BidPanel
            teams={teams}
            phase={phase}
            tournamentId={Number(tid)}
            bidIncrement={50}
            currentBid={auctionState?.currentBid || 0}
          />
        </div>

        {/* RIGHT: feed */}
        <div className="auction-right">
          <AuctionFeed feed={dashboard?.recentActivity || []} />
        </div>

      </div>
    </div>
  )
}