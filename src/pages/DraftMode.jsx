import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useWebSocket } from '../hooks/useWebSocket'
import { playerImageUrl } from './PlayerManage'

// ── API helpers ───────────────────────────────────────────────────
const draftApi = {
  start:    (tid, body)  => api.post(`/draft/${tid}/start`, body),
  state:    (tid)        => api.get(`/draft/${tid}/state`),
  sold:     (tid, body)  => api.post(`/draft/${tid}/sold`, body),
  unsold:   (tid, body)  => api.post(`/draft/${tid}/unsold`, body),
  skip:     (tid)        => api.post(`/draft/${tid}/skip-round`),
  summary:  (tid)        => api.get(`/draft/${tid}/summary`),
}

// ── Role config ───────────────────────────────────────────────────
const ROLE_CONFIG = {
  Batsman:      { icon: '🏏', color: '#3b82f6', label: 'Batsmen'         },
  Bowler:       { icon: '⚡', color: '#ef4444', label: 'Bowlers'         },
  'All-Rounder':{ icon: '🌟', color: '#c8ff00', label: 'All-Rounders'    },
  'WK-Batsman': { icon: '🧤', color: '#f59e0b', label: 'Wicket-Keepers'  },
  ALL:          { icon: '🎰', color: '#8b5cf6', label: 'Open Round'      },
}

const DEFAULT_ROUNDS = [
  { roleFilter:'Batsman',      name:'Batsmen Round',         playerCount:999, icon:'🏏', color:'#3b82f6' },
  { roleFilter:'Bowler',       name:'Bowlers Round',         playerCount:999, icon:'⚡', color:'#ef4444' },
  { roleFilter:'All-Rounder',  name:'All-Rounders Round',    playerCount:999, icon:'🌟', color:'#c8ff00' },
  { roleFilter:'WK-Batsman',   name:'Wicket-Keepers Round',  playerCount:999, icon:'🧤', color:'#f59e0b' },
  { roleFilter:'ALL',          name:'Remaining Players',     playerCount:999, icon:'🎰', color:'#8b5cf6' },
]

// ─────────────────────────────────────────────────────────────────
export default function DraftMode() {
  const { tid }    = useParams()
  const navigate   = useNavigate()

  const [view, setView]       = useState('setup')  // setup | live | summary
  const [draftState, setDS]   = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  // Setup form state
  const [rounds, setRounds]       = useState(DEFAULT_ROUNDS)
  const [maxPerTeam, setMaxPerTeam] = useState(0)
  const [timer, setTimer]         = useState(30)
  const [autoAdvance, setAuto]    = useState(true)

  // Live auction state (mirrors AuctionRoom)
  const [phase, setPhase]         = useState('IDLE')
  const [currentBid, setCurrentBid] = useState(null)
  const [highBidder, setHighBidder] = useState(null)
  const [timerLeft, setTimerLeft] = useState(0)
  const [showSoldFlash, setSoldFlash] = useState(null)

  // WebSocket
  useWebSocket(useCallback((client) => {
    // Draft-specific topic
    client.subscribe(`/topic/draft/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      setDS(data)

      if (data.event === 'DRAFT_COMPLETED') {
        setView('summary')
        draftApi.summary(tid).then(r => setSummary(r.data)).catch(() => {})
        toast.success('🏆 Draft Complete!')
      }
      if (data.event === 'ROUND_COMPLETED') {
        toast(`✅ ${data.currentRound?.roundName || 'Round'} complete!`,
          { icon: '🎯' })
      }
    })

    // Normal auction events for the bid panel
    client.subscribe(`/topic/auction/${tid}`, (msg) => {
      const data = JSON.parse(msg.body)
      if (data.event === 'BID_PLACED') {
        setCurrentBid(data.currentBid)
        setHighBidder({
          name:  data.highBidderCaptainName,
          team:  data.highBidderTeamName,
          color: data.highBidderTeamColor,
        })
      }
      if (data.event === 'PLAYER_SOLD') {
        setSoldFlash({
          player: data.currentPlayerName,
          team:   data.highBidderTeamName,
          price:  data.currentBid,
          color:  data.highBidderTeamColor || '#c8ff00',
        })
        setTimeout(() => setSoldFlash(null), 3500)
        // Notify draft engine
        draftApi.sold(tid, {
          playerId:  data.currentPlayerId,
          teamId:    data.highBidderTeamId,
          soldPrice: data.currentBid,
          totalBids: data.recentBids?.length || 0,
        }).catch(() => {})
      }
      if (data.event === 'PLAYER_UNSOLD') {
        draftApi.unsold(tid, { playerId: data.currentPlayerId }).catch(() => {})
      }
      if (data.phase) setPhase(data.phase)
    })

    client.subscribe(`/topic/auction/${tid}/timer`, (msg) => {
      const d = JSON.parse(msg.body)
      setTimerLeft(d.remainingSeconds ?? 0)
    })

  }, [tid]))

  // Load existing draft state on mount
  useEffect(() => {
    draftApi.state(tid)
      .then(r => { setDS(r.data); setView('live') })
      .catch(() => {}) // no active draft — show setup
  }, [tid])

  const handleStartDraft = async () => {
    setLoading(true)
    try {
      const res = await draftApi.start(tid, {
        roundConfigs: rounds,
        maxPlayersPerTeamPerRound: maxPerTeam,
        bidTimerSeconds: timer,
        autoAdvance,
      })
      setDS(res.data)
      setView('live')
      toast.success('🎯 Draft Mode started!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start draft')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipRound = async () => {
    try {
      await draftApi.skip(tid)
      toast('⏭ Moved to next round', { icon: '→' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Skip failed')
    }
  }

  return (
    <div className="dm-root">

      {/* SOLD Flash */}
      <AnimatePresence>
        {showSoldFlash && (
          <motion.div className="dm-sold-flash"
            style={{ '--sc': showSoldFlash.color }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}>
            <div className="dm-sf-hammer">🔨</div>
            <div className="dm-sf-sold">SOLD</div>
            <div className="dm-sf-player">{showSoldFlash.player}</div>
            <div className="dm-sf-to">→</div>
            <div className="dm-sf-team" style={{ color: showSoldFlash.color }}>
              {showSoldFlash.team}
            </div>
            <div className="dm-sf-price">
              ₹{Number(showSoldFlash.price || 0).toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ══ SETUP VIEW ══════════════════════════════════════════ */}
        {view === 'setup' && (
          <motion.div className="dm-setup"
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>

            <div className="dm-setup-header">
              <button className="dm-back-btn"
                onClick={() => navigate(-1)}>← Back</button>
              <div>
                <h1 className="dm-setup-title">Draft Mode Setup</h1>
                <p className="dm-setup-sub">
                  Configure category rounds — players auctioned
                  by role in order
                </p>
              </div>
            </div>

            <div className="dm-setup-body">

              {/* Round configurator */}
              <div className="dm-config-card">
                <h3 className="dm-card-title">
                  📋 Auction Rounds
                  <span className="dm-card-hint">
                    Players within each round ordered by base price
                    (highest first)
                  </span>
                </h3>

                <div className="dm-rounds-list">
                  {rounds.map((round, i) => {
                    const rc = ROLE_CONFIG[round.roleFilter]
                             || ROLE_CONFIG.ALL
                    return (
                      <motion.div key={i}
                        className="dm-round-row"
                        style={{ '--rc': rc.color }}
                        layout>

                        <div className="dm-rr-drag">⋮⋮</div>

                        <div className="dm-rr-icon"
                          style={{ background: rc.color + '22',
                                   border: `1px solid ${rc.color}44` }}>
                          {round.icon}
                        </div>

                        <div className="dm-rr-body">
                          <input
                            className="dm-rr-name-input"
                            value={round.name}
                            onChange={e => {
                              const next = [...rounds]
                              next[i] = { ...next[i], name: e.target.value }
                              setRounds(next)
                            }}
                          />
                          <div className="dm-rr-meta">
                            <select
                              className="dm-rr-select"
                              value={round.roleFilter}
                              onChange={e => {
                                const next = [...rounds]
                                const rc2  = ROLE_CONFIG[e.target.value]
                                           || ROLE_CONFIG.ALL
                                next[i] = {
                                  ...next[i],
                                  roleFilter: e.target.value,
                                  icon:  rc2.icon,
                                  color: rc2.color,
                                }
                                setRounds(next)
                              }}>
                              <option value="Batsman">🏏 Batsmen only</option>
                              <option value="Bowler">⚡ Bowlers only</option>
                              <option value="All-Rounder">🌟 All-Rounders only</option>
                              <option value="WK-Batsman">🧤 Wicket-Keepers only</option>
                              <option value="ALL">🎰 All remaining</option>
                            </select>

                            <div className="dm-rr-count-wrap">
                              <span className="dm-rr-count-label">
                                Max players
                              </span>
                              <input
                                type="number"
                                className="dm-rr-count-input"
                                value={round.playerCount === 999
                                  ? '' : round.playerCount}
                                placeholder="All"
                                min={1}
                                onChange={e => {
                                  const next = [...rounds]
                                  next[i] = {
                                    ...next[i],
                                    playerCount: e.target.value
                                      ? parseInt(e.target.value) : 999
                                  }
                                  setRounds(next)
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          className="dm-rr-remove"
                          disabled={rounds.length <= 1}
                          onClick={() =>
                            setRounds(rounds.filter((_, j) => j !== i))
                          }>
                          ✕
                        </button>
                      </motion.div>
                    )
                  })}
                </div>

                <button className="dm-add-round-btn"
                  onClick={() => setRounds([...rounds, {
                    roleFilter: 'ALL',
                    name: `Round ${rounds.length + 1}`,
                    playerCount: 999,
                    icon: '🎰',
                    color: '#8b5cf6',
                  }])}>
                  + Add Round
                </button>
              </div>

              {/* Settings */}
              <div className="dm-settings-row">

                <div className="dm-config-card half">
                  <h3 className="dm-card-title">⚙️ Auction Settings</h3>

                  <div className="dm-setting-item">
                    <label>Bid Timer (seconds)</label>
                    <div className="dm-timer-options">
                      {[15, 20, 30, 45, 60].map(s => (
                        <button key={s}
                          className={`dm-timer-opt ${timer === s ? 'active' : ''}`}
                          onClick={() => setTimer(s)}>
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dm-setting-item">
                    <label>
                      Max picks per team per round
                      <span className="dm-setting-hint">
                        0 = no limit
                      </span>
                    </label>
                    <div className="dm-timer-options">
                      {[0, 1, 2, 3].map(n => (
                        <button key={n}
                          className={`dm-timer-opt ${maxPerTeam === n ? 'active' : ''}`}
                          onClick={() => setMaxPerTeam(n)}>
                          {n === 0 ? 'No limit' : n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="dm-toggle-row">
                    <input type="checkbox"
                      checked={autoAdvance}
                      onChange={e => setAuto(e.target.checked)} />
                    <span>Auto-advance to next player after sold/unsold</span>
                  </label>
                </div>

                {/* Preview */}
                <div className="dm-config-card half">
                  <h3 className="dm-card-title">👁 Round Preview</h3>
                  <div className="dm-preview-rounds">
                    {rounds.map((r, i) => {
                      const rc = ROLE_CONFIG[r.roleFilter] || ROLE_CONFIG.ALL
                      return (
                        <div key={i} className="dm-preview-round"
                          style={{ '--rc': rc.color }}>
                          <span className="dm-pr-num">{i + 1}</span>
                          <span className="dm-pr-icon">{r.icon}</span>
                          <span className="dm-pr-name">{r.name}</span>
                          <span className="dm-pr-limit">
                            {r.playerCount === 999 ? 'All' : r.playerCount + ' max'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Start button */}
              <motion.button className="dm-start-btn"
                onClick={handleStartDraft}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                {loading
                  ? '⏳ Starting...'
                  : `🎯 Start Draft — ${rounds.length} rounds`}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ══ LIVE VIEW ═══════════════════════════════════════════ */}
        {view === 'live' && draftState && (
          <motion.div className="dm-live"
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>

            {/* Top bar */}
            <div className="dm-live-topbar">
              <div className="dm-ltb-left">
                <span className="dm-live-dot" />
                <span className="dm-ltb-title">DRAFT MODE</span>
                <span className="dm-ltb-tournament">
                  {draftState.tournamentName}
                </span>
              </div>
              <div className="dm-ltb-center">
                {draftState.currentRound && (
                  <div className="dm-ltb-current-round"
                    style={{ '--rc': draftState.currentRound.color ||'#c8ff00' }}>
                    <span>{draftState.currentRound.icon}</span>
                    <span>{draftState.currentRound.roundName}</span>
                    <span className="dm-ltb-progress">
                      {draftState.currentRound.sold}/
                      {draftState.currentRound.totalPlayers} done
                    </span>
                  </div>
                )}
              </div>
              <div className="dm-ltb-right">
                <motion.button className="dm-skip-btn"
                  onClick={handleSkipRound}
                  whileTap={{ scale: 0.97 }}>
                  Skip Round ⏭
                </motion.button>
                <motion.button className="dm-auction-btn"
                  onClick={() => navigate(`/organizer/auction/${tid}`)}
                  whileTap={{ scale: 0.97 }}>
                  ← Auction Room
                </motion.button>
              </div>
            </div>

            <div className="dm-live-body">

              {/* LEFT: Round sidebar */}
              <div className="dm-rounds-sidebar">
                <div className="dm-sidebar-title">Rounds</div>
                {(draftState.roundOverview || []).map((round, i) => {
                  const isCurrent =
                    i === draftState.currentRoundIndex
                  const isDone    =
                    round.status === 'COMPLETED'
                  return (
                    <div key={i}
                      className={`dm-sidebar-round
                        ${isCurrent ? 'current' : ''}
                        ${isDone    ? 'done'    : ''}`}
                      style={{ '--rc': round.color || '#888' }}>

                      <div className="dm-sr-icon-wrap">
                        <span className="dm-sr-icon">{round.icon}</span>
                        {isDone && (
                          <span className="dm-sr-done-tick">✓</span>
                        )}
                        {isCurrent && (
                          <span className="dm-sr-active-dot" />
                        )}
                      </div>

                      <div className="dm-sr-info">
                        <span className="dm-sr-name">{round.roundName}</span>
                        <div className="dm-sr-stats">
                          <span className="dm-sr-sold">
                            🔨 {round.sold}
                          </span>
                          <span className="dm-sr-unsold">
                            ❌ {round.unsold}
                          </span>
                          <span className="dm-sr-total">
                            / {round.totalPlayers}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="dm-sr-bar">
                        <div className="dm-sr-bar-fill"
                          style={{
                            width: round.totalPlayers > 0
                              ? `${((round.sold + round.unsold)
                                  / round.totalPlayers) * 100}%`
                              : '0%',
                            background: round.color || '#c8ff00'
                          }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* CENTER: Current player + bid */}
              <div className="dm-center-panel">

                {draftState.currentPlayer ? (
                  <>
                    {/* Round label */}
                    <div className="dm-center-round-label"
                      style={{
                        color: draftState.currentRound?.color || '#c8ff00',
                        borderColor: draftState.currentRound?.color + '44'
                      }}>
                      <span>{draftState.currentRound?.icon}</span>
                      <span>{draftState.currentRound?.roundName}</span>
                    </div>

                    {/* Player card */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={draftState.currentPlayer.id}
                        className="dm-player-card"
                        style={{
                          '--tc': tierColor(draftState.currentPlayer.tier)
                        }}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0,  opacity: 1 }}
                        exit={{ rotateY: -90,   opacity: 0 }}
                        transition={{ duration: 0.5 }}>

                        <div className="dm-pc-tier-bar"
                          style={{
                            background:
                              tierColor(draftState.currentPlayer.tier)
                          }} />

                        <div className="dm-pc-tier-badge"
                          style={{
                            color: tierColor(draftState.currentPlayer.tier),
                            border: `1px solid ${tierColor(draftState.currentPlayer.tier)}55`
                          }}>
                          {draftState.currentPlayer.tier}
                        </div>

                        <DraftPlayerPhoto
                          player={draftState.currentPlayer} />

                        <h2 className="dm-pc-name">
                          {draftState.currentPlayer.name}
                        </h2>

                        <div className="dm-pc-role-row">
                          <span className="dm-pc-role"
                            style={{
                              color: ROLE_CONFIG[
                                draftState.currentPlayer.role
                              ]?.color || '#888',
                              background: (ROLE_CONFIG[
                                draftState.currentPlayer.role
                              ]?.color || '#888') + '18'
                            }}>
                            {ROLE_CONFIG[draftState.currentPlayer.role]?.icon}
                            &nbsp;
                            {draftState.currentPlayer.role}
                          </span>
                          {draftState.currentPlayer.nationality && (
                            <span className="dm-pc-nat">
                              {draftState.currentPlayer.nationality}
                            </span>
                          )}
                        </div>

                        <div className="dm-pc-stats">
                          {draftState.currentPlayer.matches > 0 && (
                            <div className="dm-pc-stat">
                              <span>{draftState.currentPlayer.matches}</span>
                              <small>Matches</small>
                            </div>
                          )}
                          {draftState.currentPlayer.average > 0 && (
                            <div className="dm-pc-stat">
                              <span>{draftState.currentPlayer.average}</span>
                              <small>Average</small>
                            </div>
                          )}
                          {draftState.currentPlayer.strikeRate > 0 && (
                            <div className="dm-pc-stat">
                              <span>{draftState.currentPlayer.strikeRate}</span>
                              <small>SR</small>
                            </div>
                          )}
                        </div>

                        <div className="dm-pc-base">
                          BASE PRICE
                          <span>
                            ₹{Number(
                              draftState.currentPlayer.basePrice || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        {/* Live bid */}
                        {currentBid && (
                          <motion.div className="dm-pc-current-bid"
                            key={currentBid}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1,   opacity: 1 }}>
                            <span className="dm-pcb-label">
                              CURRENT BID
                            </span>
                            <span className="dm-pcb-amount">
                              ₹{Number(currentBid).toLocaleString()}
                            </span>
                            {highBidder && (
                              <span className="dm-pcb-leader"
                                style={{ color: highBidder.color }}>
                                🏆 {highBidder.team}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Timer bar */}
                    <div className="dm-timer-bar-wrap">
                      <div className="dm-timer-bar-bg">
                        <motion.div className="dm-timer-bar-fill"
                          style={{
                            width: draftState.bidTimerSeconds > 0
                              ? `${(timerLeft / draftState.bidTimerSeconds) * 100}%`
                              : '0%',
                            background: timerLeft <= 5 ? '#ef4444'
                              : timerLeft <= 10 ? '#f59e0b' : '#c8ff00'
                          }}
                          animate={{
                            width: `${(timerLeft /
                              (draftState.bidTimerSeconds || 30)) * 100}%`
                          }}
                          transition={{ duration: 0.9 }}
                        />
                      </div>
                      <span className="dm-timer-secs"
                        style={{ color: timerLeft <= 5 ? '#ef4444' : '#c8ff00' }}>
                        {timerLeft}s
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="dm-center-empty">
                    {draftState.status === 'ROUND_BREAK' ? (
                      <>
                        <div className="dm-empty-icon">✅</div>
                        <h3>Round Complete!</h3>
                        <p>
                          Ready for&nbsp;
                          {draftState.roundOverview?.[
                            draftState.currentRoundIndex
                          ]?.roundName}
                        </p>
                        <motion.button className="dm-next-round-btn"
                          onClick={() => navigate(
                            `/organizer/auction/${tid}`)}
                          whileTap={{ scale: 0.97 }}>
                          Start Next Round in Auction Room →
                        </motion.button>
                      </>
                    ) : draftState.status === 'COMPLETED' ? (
                      <>
                        <div className="dm-empty-icon">🏆</div>
                        <h3>Draft Complete!</h3>
                        <motion.button className="dm-next-round-btn"
                          onClick={() => {
                            setView('summary')
                            draftApi.summary(tid)
                              .then(r => setSummary(r.data))
                              .catch(() => {})
                          }}
                          whileTap={{ scale: 0.97 }}>
                          View Draft Summary →
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <div className="dm-empty-icon">🎯</div>
                        <p>Go to Auction Room and spin to start bidding</p>
                        <motion.button className="dm-next-round-btn"
                          onClick={() =>
                            navigate(`/organizer/auction/${tid}`)}
                          whileTap={{ scale: 0.97 }}>
                          Open Auction Room →
                        </motion.button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT: Current round results */}
              <div className="dm-results-panel">
                <div className="dm-rp-title">
                  {draftState.currentRound?.icon}
                  &nbsp;
                  {draftState.currentRound?.roundName} Results
                </div>

                <div className="dm-rp-list">
                  <AnimatePresence>
                    {(draftState.currentRound?.results || [])
                      .slice().reverse()
                      .map((r, i) => (
                        <motion.div key={i}
                          className={`dm-rp-item ${
                            r.status === 'SOLD' ? 'sold' : 'unsold'}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          layout>
                          <div className="dm-rpi-left">
                            <div className="dm-rpi-avatar">
                              {r.playerName?.charAt(0)}
                            </div>
                            <div className="dm-rpi-info">
                              <span className="dm-rpi-name">
                                {r.playerName}
                              </span>
                              <span className="dm-rpi-role">
                                {r.playerRole}
                              </span>
                            </div>
                          </div>
                          <div className="dm-rpi-right">
                            {r.status === 'SOLD' ? (
                              <>
                                <span className="dm-rpi-price">
                                  ₹{Number(r.soldPrice || 0)
                                     .toLocaleString()}
                                </span>
                                <span className="dm-rpi-team"
                                  style={{ color: r.teamColor }}>
                                  {r.teamName}
                                </span>
                              </>
                            ) : (
                              <span className="dm-rpi-unsold">
                                Unsold
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  {(!draftState.currentRound?.results?.length) && (
                    <div className="dm-rp-empty">
                      No results yet in this round
                    </div>
                  )}
                </div>

                {/* Round stats */}
                {draftState.currentRound && (
                  <div className="dm-rp-footer">
                    <div className="dm-rpf-stat">
                      <span>Remaining</span>
                      <strong>
                        {draftState.currentRound.remaining ?? '—'}
                      </strong>
                    </div>
                    <div className="dm-rpf-stat">
                      <span>Sold</span>
                      <strong className="sold-txt">
                        {draftState.currentRound.sold}
                      </strong>
                    </div>
                    <div className="dm-rpf-stat">
                      <span>Unsold</span>
                      <strong className="unsold-txt">
                        {draftState.currentRound.unsold}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ SUMMARY VIEW ════════════════════════════════════════ */}
        {view === 'summary' && summary && (
          <motion.div className="dm-summary"
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}>

            <div className="dm-sum-header">
              <h1 className="dm-sum-title">🏆 Draft Complete</h1>
              <p className="dm-sum-sub">{summary.tournamentName}</p>
              <div className="dm-sum-stats">
                <div className="dm-sum-stat">
                  <span>{summary.totalRounds}</span>
                  <small>Rounds</small>
                </div>
                <div className="dm-sum-stat">
                  <span>{summary.totalSold}</span>
                  <small>Sold</small>
                </div>
                <div className="dm-sum-stat">
                  <span>
                    ₹{Number(summary.totalValue || 0).toLocaleString()}
                  </span>
                  <small>Total Value</small>
                </div>
              </div>
            </div>

            {(summary.rounds || []).map((round, i) => (
              <div key={i} className="dm-sum-round"
                style={{ '--rc': round.color || '#888' }}>
                <div className="dm-sum-round-header">
                  <span className="dm-sum-round-icon">{round.icon}</span>
                  <span className="dm-sum-round-name">{round.roundName}</span>
                  <span className="dm-sum-round-stats">
                    {round.sold} sold · {round.unsold} unsold ·
                    ₹{Number(round.totalValue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="dm-sum-results">
                  {(round.results || []).map((r, j) => (
                    <div key={j}
                      className={`dm-sum-result-row ${
                        r.status === 'SOLD' ? 'sold' : 'unsold'}`}>
                      <div className="dm-srr-player">
                        <div className="dm-srr-av"
                          style={{
                            borderColor: tierColor(r.playerTier)
                          }}>
                          {r.playerName?.charAt(0)}
                        </div>
                        <div>
                          <div className="dm-srr-name">{r.playerName}</div>
                          <div className="dm-srr-role">{r.playerRole}</div>
                        </div>
                      </div>
                      <div className="dm-srr-tier"
                        style={{ color: tierColor(r.playerTier) }}>
                        {r.playerTier}
                      </div>
                      {r.status === 'SOLD' ? (
                        <>
                          <div className="dm-srr-price">
                            ₹{Number(r.soldPrice || 0).toLocaleString()}
                          </div>
                          <div className="dm-srr-team"
                            style={{ color: r.teamColor }}>
                            → {r.teamName}
                          </div>
                          <div className="dm-srr-bids">
                            {r.totalBids} bids
                          </div>
                        </>
                      ) : (
                        <div className="dm-srr-unsold">UNSOLD</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="dm-sum-actions">
              <motion.button className="dm-start-btn"
                onClick={() => navigate(`/post-auction/${tid}`)}
                whileTap={{ scale: 0.97 }}>
                🏆 View Full Results
              </motion.button>
              <motion.button
                style={{ background: 'transparent',
                         border: '1px solid rgba(255,255,255,0.15)',
                         color: '#fff', borderRadius: 10,
                         padding: '0.85rem 1.8rem',
                         cursor: 'pointer', fontSize: '1rem' }}
                onClick={() => navigate(`/organizer/auction/${tid}`)}
                whileTap={{ scale: 0.97 }}>
                ← Back to Auction
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── All styles ─────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

        :root {
          --dm-bg:     #04060f;
          --dm-bg2:    #080c1a;
          --dm-bg3:    #0d1225;
          --dm-border: rgba(255,255,255,0.08);
          --dm-text:   #f0f2ff;
          --dm-muted:  #6a7a9c;
          --dm-accent: #c8ff00;
          --dm-cyan:   #00e5ff;
        }

        .dm-root {
          min-height: 100vh;
          background: var(--dm-bg);
          color: var(--dm-text);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        /* SOLD Flash */
        .dm-sold-flash {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 9999; gap: 0.4rem;
          border: 3px solid var(--sc);
          box-shadow: inset 0 0 100px color-mix(in srgb, var(--sc) 15%, transparent);
        }
        .dm-sf-hammer { font-size: 4rem; }
        .dm-sf-sold {
          font-family: 'Bebas Neue'; font-size: clamp(4rem,10vw,8rem);
          color: #22c55e; letter-spacing: 6px; line-height: 1;
          text-shadow: 0 0 60px #22c55e80;
        }
        .dm-sf-player { font-family: 'Bebas Neue'; font-size: clamp(2rem,5vw,4rem); letter-spacing: 2px; }
        .dm-sf-to     { color: var(--dm-muted); font-size: 2rem; }
        .dm-sf-team   { font-family: 'Bebas Neue'; font-size: clamp(1.5rem,4vw,3rem); letter-spacing: 2px; }
        .dm-sf-price  { font-family: 'Bebas Neue'; font-size: clamp(2rem,5vw,4rem); color: #f59e0b; letter-spacing: 2px; }

        /* ── SETUP ─────────────────────────────────────────────── */
        .dm-setup { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .dm-setup-header { display:flex; align-items:flex-start; gap:1.25rem; margin-bottom:2rem; }
        .dm-back-btn { background:none; border:1px solid var(--dm-border); color:var(--dm-muted); border-radius:8px; padding:0.5rem 1rem; cursor:pointer; font-size:0.85rem; white-space:nowrap; margin-top:0.25rem; }
        .dm-setup-title { font-family:'Bebas Neue'; font-size:2.2rem; letter-spacing:2px; color:var(--dm-accent); margin:0 0 0.25rem; }
        .dm-setup-sub { font-size:0.9rem; color:var(--dm-muted); margin:0; }
        .dm-setup-body { display:flex; flex-direction:column; gap:1.5rem; }

        .dm-config-card { background:var(--dm-bg2); border:1px solid var(--dm-border); border-radius:16px; padding:1.5rem; }
        .dm-config-card.half { flex:1; }
        .dm-card-title { font-size:0.95rem; font-weight:700; margin:0 0 1.2rem; display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; }
        .dm-card-hint { font-size:0.75rem; color:var(--dm-muted); font-weight:400; }

        .dm-rounds-list { display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1rem; }
        .dm-round-row {
          display:flex; align-items:center; gap:0.75rem;
          background:var(--dm-bg3); border:1px solid var(--dm-border);
          border-left:3px solid var(--rc); border-radius:10px; padding:0.7rem 0.85rem;
        }
        .dm-rr-drag { color:var(--dm-muted); cursor:grab; font-size:1rem; letter-spacing:-2px; }
        .dm-rr-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
        .dm-rr-body { flex:1; display:flex; flex-direction:column; gap:0.4rem; }
        .dm-rr-name-input { background:transparent; border:none; color:var(--dm-text); font-size:0.9rem; font-weight:700; font-family:inherit; outline:none; width:100%; padding:0; }
        .dm-rr-meta { display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap; }
        .dm-rr-select { background:var(--dm-bg2); border:1px solid var(--dm-border); color:var(--dm-muted); border-radius:6px; padding:0.25rem 0.5rem; font-size:0.78rem; cursor:pointer; }
        .dm-rr-count-wrap { display:flex; align-items:center; gap:0.4rem; }
        .dm-rr-count-label { font-size:0.72rem; color:var(--dm-muted); }
        .dm-rr-count-input { background:var(--dm-bg2); border:1px solid var(--dm-border); color:var(--dm-text); border-radius:6px; padding:0.2rem 0.5rem; font-size:0.8rem; width:60px; text-align:center; }
        .dm-rr-remove { background:none; border:none; color:var(--dm-muted); cursor:pointer; font-size:0.9rem; padding:0.2rem; transition:color 0.12s; }
        .dm-rr-remove:hover:not(:disabled) { color:#ef4444; }
        .dm-rr-remove:disabled { opacity:0.3; cursor:not-allowed; }

        .dm-add-round-btn { background:none; border:1px dashed var(--dm-border); color:var(--dm-muted); border-radius:8px; padding:0.55rem 1rem; cursor:pointer; font-size:0.85rem; width:100%; transition:all 0.15s; }
        .dm-add-round-btn:hover { border-color:var(--dm-accent); color:var(--dm-accent); }

        .dm-settings-row { display:flex; gap:1.25rem; }
        .dm-setting-item { margin-bottom:1.1rem; }
        .dm-setting-item label { font-size:0.8rem; color:var(--dm-muted); display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; }
        .dm-setting-hint { font-size:0.7rem; opacity:0.7; }
        .dm-timer-options { display:flex; gap:0.4rem; flex-wrap:wrap; }
        .dm-timer-opt { background:var(--dm-bg3); border:1px solid var(--dm-border); color:var(--dm-muted); border-radius:7px; padding:0.35rem 0.8rem; cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.12s; }
        .dm-timer-opt.active { background:var(--dm-accent); border-color:var(--dm-accent); color:#000; }
        .dm-toggle-row { display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; cursor:pointer; }
        .dm-toggle-row input { accent-color:var(--dm-accent); width:16px; height:16px; cursor:pointer; }

        .dm-preview-rounds { display:flex; flex-direction:column; gap:0.4rem; }
        .dm-preview-round { display:flex; align-items:center; gap:0.6rem; background:var(--dm-bg3); border-radius:7px; padding:0.45rem 0.7rem; border-left:3px solid var(--rc); }
        .dm-pr-num { font-family:'Bebas Neue'; font-size:1.1rem; color:var(--rc); min-width:20px; }
        .dm-pr-icon { font-size:1rem; }
        .dm-pr-name { flex:1; font-size:0.85rem; font-weight:600; }
        .dm-pr-limit { font-size:0.72rem; color:var(--dm-muted); }

        .dm-start-btn { background:var(--dm-accent); border:none; color:#000; border-radius:12px; padding:1rem 2rem; font-size:1.05rem; font-weight:800; cursor:pointer; width:100%; font-family:inherit; letter-spacing:0.5px; transition:opacity 0.15s; }
        .dm-start-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .dm-start-btn:hover:not(:disabled) { opacity:0.88; }

        /* ── LIVE ──────────────────────────────────────────────── */
        .dm-live { display:flex; flex-direction:column; height:100vh; }
        .dm-live-topbar { display:flex; align-items:center; background:#000; border-bottom:2px solid var(--dm-accent); padding:0.65rem 1.5rem; gap:1.5rem; flex-shrink:0; }
        .dm-live-dot { width:8px; height:8px; border-radius:50%; background:#ef4444; animation:livePulse 0.8s ease-in-out infinite; }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .dm-ltb-left  { display:flex; align-items:center; gap:0.6rem; flex-shrink:0; }
        .dm-ltb-title { font-family:'Bebas Neue'; font-size:1.3rem; letter-spacing:3px; color:var(--dm-accent); }
        .dm-ltb-tournament { font-size:0.82rem; color:var(--dm-muted); }
        .dm-ltb-center { flex:1; display:flex; justify-content:center; }
        .dm-ltb-current-round { display:flex; align-items:center; gap:0.5rem; background:color-mix(in srgb,var(--rc) 12%,transparent); border:1px solid color-mix(in srgb,var(--rc) 30%,transparent); border-radius:20px; padding:0.3rem 1rem; font-size:0.88rem; font-weight:700; color:var(--rc); }
        .dm-ltb-progress { font-size:0.75rem; opacity:0.7; font-weight:400; }
        .dm-ltb-right { display:flex; gap:0.5rem; flex-shrink:0; }
        .dm-skip-btn { background:rgba(255,255,255,0.06); border:1px solid var(--dm-border); color:var(--dm-muted); border-radius:7px; padding:0.4rem 0.9rem; cursor:pointer; font-size:0.8rem; }
        .dm-auction-btn { background:var(--dm-accent); border:none; color:#000; border-radius:7px; padding:0.4rem 0.9rem; cursor:pointer; font-size:0.8rem; font-weight:700; }

        .dm-live-body { display:grid; grid-template-columns:220px 1fr 280px; flex:1; overflow:hidden; }

        /* Sidebar */
        .dm-rounds-sidebar { background:var(--dm-bg2); border-right:1px solid var(--dm-border); padding:1rem 0.75rem; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem; }
        .dm-sidebar-title { font-size:0.68rem; letter-spacing:3px; color:var(--dm-muted); text-transform:uppercase; margin-bottom:0.5rem; padding:0 0.25rem; }
        .dm-sidebar-round { background:var(--dm-bg3); border:1px solid var(--dm-border); border-left:3px solid transparent; border-radius:10px; padding:0.65rem 0.75rem; cursor:default; transition:all 0.15s; }
        .dm-sidebar-round.current { border-left-color:var(--rc); background:color-mix(in srgb,var(--rc) 8%,var(--dm-bg3)); }
        .dm-sidebar-round.done    { opacity:0.5; }
        .dm-sr-icon-wrap { position:relative; width:32px; height:32px; margin-bottom:0.4rem; }
        .dm-sr-icon { font-size:1.1rem; }
        .dm-sr-done-tick { position:absolute; top:-4px; right:-4px; background:#22c55e; color:#000; border-radius:50%; width:14px; height:14px; font-size:0.6rem; display:flex; align-items:center; justify-content:center; font-weight:900; }
        .dm-sr-active-dot { position:absolute; top:-3px; right:-3px; width:8px; height:8px; border-radius:50%; background:var(--rc); animation:livePulse 1s ease-in-out infinite; }
        .dm-sr-name { font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.2rem; }
        .dm-sr-stats { display:flex; gap:0.5rem; font-size:0.72rem; }
        .dm-sr-sold   { color:#22c55e; }
        .dm-sr-unsold { color:#ef4444; }
        .dm-sr-total  { color:var(--dm-muted); }
        .dm-sr-bar    { height:3px; background:rgba(255,255,255,0.08); border-radius:50px; overflow:hidden; margin-top:0.5rem; }
        .dm-sr-bar-fill { height:100%; border-radius:50px; transition:width 0.5s ease; }

        /* Center */
        .dm-center-panel { display:flex; flex-direction:column; align-items:center; padding:1.5rem 1rem; overflow-y:auto; gap:1rem; }
        .dm-center-round-label { display:flex; align-items:center; gap:0.5rem; border:1px solid; border-radius:20px; padding:0.3rem 1rem; font-size:0.85rem; font-weight:700; }
        .dm-player-card { background:var(--dm-bg2); border:2px solid var(--tc); border-radius:20px; padding:1.5rem; width:100%; max-width:360px; text-align:center; position:relative; box-shadow:0 0 40px color-mix(in srgb,var(--tc) 20%,transparent); }
        .dm-pc-tier-bar { position:absolute; top:0; left:0; right:0; height:3px; background:var(--tc); border-radius:18px 18px 0 0; }
        .dm-pc-tier-badge { display:inline-block; font-size:0.7rem; font-weight:800; border:1px solid; border-radius:20px; padding:0.15rem 0.6rem; letter-spacing:1px; margin:0.75rem 0 0.5rem; }
        .dm-pc-name { font-family:'Bebas Neue'; font-size:2rem; letter-spacing:2px; margin:0.4rem 0 0.3rem; }
        .dm-pc-role-row { display:flex; align-items:center; justify-content:center; gap:0.6rem; margin-bottom:0.75rem; }
        .dm-pc-role { font-size:0.78rem; font-weight:700; padding:0.2rem 0.7rem; border-radius:20px; }
        .dm-pc-nat  { font-size:0.75rem; color:var(--dm-muted); }
        .dm-pc-stats { display:flex; justify-content:center; gap:0.75rem; margin:0.6rem 0; }
        .dm-pc-stat { background:rgba(255,255,255,0.05); border-radius:8px; padding:0.4rem 0.75rem; display:flex; flex-direction:column; }
        .dm-pc-stat span  { font-family:'Bebas Neue'; font-size:1.2rem; color:var(--dm-cyan); line-height:1; }
        .dm-pc-stat small { font-size:0.62rem; color:var(--dm-muted); margin-top:0.1rem; }
        .dm-pc-base { font-size:0.75rem; color:var(--dm-muted); letter-spacing:2px; margin-top:0.5rem; }
        .dm-pc-base span { color:var(--tc); font-family:'Bebas Neue'; font-size:1.1rem; margin-left:0.4rem; }
        .dm-pc-current-bid { background:rgba(0,0,0,0.4); border:1px solid rgba(200,255,0,0.3); border-radius:10px; padding:0.6rem 1rem; margin-top:0.75rem; }
        .dm-pcb-label  { font-size:0.65rem; letter-spacing:3px; color:var(--dm-muted); display:block; }
        .dm-pcb-amount { font-family:'Bebas Neue'; font-size:1.8rem; color:var(--dm-accent); display:block; line-height:1; }
        .dm-pcb-leader { font-size:0.8rem; font-weight:700; display:block; margin-top:0.2rem; }

        .dm-timer-bar-wrap { display:flex; align-items:center; gap:0.6rem; width:100%; max-width:360px; }
        .dm-timer-bar-bg   { flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:50px; overflow:hidden; }
        .dm-timer-bar-fill { height:100%; border-radius:50px; }
        .dm-timer-secs     { font-family:'Bebas Neue'; font-size:1.1rem; min-width:30px; text-align:right; }

        .dm-center-empty { text-align:center; padding:3rem 1rem; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .dm-empty-icon { font-size:4rem; }
        .dm-empty-icon + h3 { font-family:'Bebas Neue'; font-size:1.8rem; color:var(--dm-accent); margin:0; }
        .dm-empty-icon + h3 + p { color:var(--dm-muted); font-size:0.9rem; margin:0; }
        .dm-next-round-btn { background:var(--dm-accent); border:none; color:#000; border-radius:10px; padding:0.75rem 1.8rem; font-size:0.95rem; font-weight:700; cursor:pointer; font-family:inherit; }

        /* Right panel */
        .dm-results-panel { background:var(--dm-bg2); border-left:1px solid var(--dm-border); display:flex; flex-direction:column; overflow:hidden; }
        .dm-rp-title { font-size:0.78rem; font-weight:700; letter-spacing:1px; padding:0.85rem 1rem; border-bottom:1px solid var(--dm-border); color:var(--dm-muted); display:flex; align-items:center; gap:0.4rem; }
        .dm-rp-list { flex:1; overflow-y:auto; padding:0.6rem; display:flex; flex-direction:column; gap:0.4rem; }
        .dm-rp-item { display:flex; justify-content:space-between; align-items:center; padding:0.55rem 0.65rem; border-radius:8px; border:1px solid transparent; }
        .dm-rp-item.sold   { background:rgba(34,197,94,0.07);  border-color:rgba(34,197,94,0.2); }
        .dm-rp-item.unsold { background:rgba(239,68,68,0.07);  border-color:rgba(239,68,68,0.2); }
        .dm-rpi-left  { display:flex; align-items:center; gap:0.5rem; }
        .dm-rpi-avatar { width:28px; height:28px; border-radius:50%; background:var(--dm-bg3); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue'; font-size:0.85rem; color:var(--dm-muted); flex-shrink:0; }
        .dm-rpi-name  { font-size:0.8rem; font-weight:700; display:block; }
        .dm-rpi-role  { font-size:0.68rem; color:var(--dm-muted); }
        .dm-rpi-right { text-align:right; }
        .dm-rpi-price { font-family:'Bebas Neue'; font-size:0.95rem; color:#f59e0b; display:block; }
        .dm-rpi-team  { font-size:0.68rem; font-weight:600; }
        .dm-rpi-unsold { font-size:0.72rem; color:#ef4444; font-weight:700; }
        .dm-rp-empty { text-align:center; color:var(--dm-muted); font-size:0.82rem; padding:2rem; }
        .dm-rp-footer { border-top:1px solid var(--dm-border); display:flex; padding:0.65rem 1rem; }
        .dm-rpf-stat  { flex:1; display:flex; flex-direction:column; align-items:center; }
        .dm-rpf-stat span { font-size:0.65rem; color:var(--dm-muted); text-transform:uppercase; letter-spacing:0.5px; }
        .dm-rpf-stat strong { font-family:'Bebas Neue'; font-size:1.2rem; }
        .sold-txt   { color:#22c55e !important; }
        .unsold-txt { color:#ef4444 !important; }

        /* ── SUMMARY ──────────────────────────────────────────── */
        .dm-summary { padding:2rem; max-width:900px; margin:0 auto; }
        .dm-sum-header { text-align:center; margin-bottom:2.5rem; }
        .dm-sum-title  { font-family:'Bebas Neue'; font-size:3rem; letter-spacing:3px; color:var(--dm-accent); margin:0 0 0.25rem; }
        .dm-sum-sub    { color:var(--dm-muted); margin:0 0 1.5rem; }
        .dm-sum-stats  { display:flex; justify-content:center; gap:2rem; }
        .dm-sum-stat   { display:flex; flex-direction:column; align-items:center; }
        .dm-sum-stat span  { font-family:'Bebas Neue'; font-size:2rem; color:var(--dm-accent); }
        .dm-sum-stat small { font-size:0.75rem; color:var(--dm-muted); }

        .dm-sum-round { background:var(--dm-bg2); border:1px solid var(--dm-border); border-top:3px solid var(--rc); border-radius:14px; margin-bottom:1.25rem; overflow:hidden; }
        .dm-sum-round-header { display:flex; align-items:center; gap:0.75rem; padding:0.9rem 1.2rem; background:color-mix(in srgb,var(--rc) 6%,var(--dm-bg2)); }
        .dm-sum-round-icon  { font-size:1.2rem; }
        .dm-sum-round-name  { font-family:'Bebas Neue'; font-size:1.2rem; letter-spacing:1px; color:var(--rc); flex:1; }
        .dm-sum-round-stats { font-size:0.8rem; color:var(--dm-muted); }
        .dm-sum-results { padding:0.5rem; display:flex; flex-direction:column; gap:0.3rem; }
        .dm-sum-result-row { display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0.65rem; border-radius:7px; }
        .dm-sum-result-row.sold   { background:rgba(34,197,94,0.05); }
        .dm-sum-result-row.unsold { background:rgba(239,68,68,0.05); }
        .dm-srr-player { display:flex; align-items:center; gap:0.5rem; flex:2; }
        .dm-srr-av { width:32px; height:32px; border-radius:50%; border:2px solid; background:var(--dm-bg3); display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue'; font-size:0.95rem; color:var(--dm-muted); flex-shrink:0; }
        .dm-srr-name { font-weight:700; font-size:0.88rem; }
        .dm-srr-role { font-size:0.72rem; color:var(--dm-muted); }
        .dm-srr-tier   { font-size:0.72rem; font-weight:700; min-width:60px; }
        .dm-srr-price  { font-family:'Bebas Neue'; font-size:1rem; color:#f59e0b; min-width:90px; }
        .dm-srr-team   { font-size:0.8rem; font-weight:700; flex:1; }
        .dm-srr-bids   { font-size:0.72rem; color:var(--dm-muted); }
        .dm-srr-unsold { font-size:0.72rem; color:#ef4444; font-weight:700; flex:1; }
        .dm-sum-actions { display:flex; gap:0.75rem; margin-top:2rem; }
        .dm-sum-actions .dm-start-btn { flex:2; }
      `}</style>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────
function DraftPlayerPhoto({ player }) {
  const [err, setErr] = useState(false)
  const src = playerImageUrl(player?.photo || player?.photoPath)
  if (src && !err) {
    return (
      <img src={src} alt={player.name}
        className="dm-pc-photo"
        style={{
          width:80, height:80, borderRadius:'50%', objectFit:'cover',
          border:`3px solid ${tierColor(player.tier)}`,
          margin:'0.5rem auto', display:'block'
        }}
        onError={() => setErr(true)} />
    )
  }
  return (
    <div style={{
      width:80, height:80, borderRadius:'50%',
      background:'#1c2033', margin:'0.5rem auto',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'Bebas Neue', fontSize:'2rem', color:'#8891aa',
      border:`3px solid ${tierColor(player?.tier)}`
    }}>
      {player?.name?.charAt(0)}
    </div>
  )
}

function tierColor(tier) {
  const m = { PLATINUM:'#e5c100', GOLD:'#f97316',
               SILVER:'#94a3b8', BRONZE:'#b45309' }
  return m[tier] || '#888'
}
