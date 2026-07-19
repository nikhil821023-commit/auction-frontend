import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getTournamentHistory, getTeamSpending,
  getMvp, getAuctionPace
} from '../api/bidHistoryApi'
import { playerImageUrl } from '../utils/imageUrl'


const TABS = [
  { key: 'history',  icon: '📋', label: 'Bid History'    },
  { key: 'spending', icon: '💸', label: 'Team Spending'  },
  { key: 'mvp',      icon: '🏅', label: 'MVP'            },
  { key: 'pace',     icon: '⚡', label: 'Auction Pace'   },
]

const TIER_COLORS = {
  PLATINUM: '#e5c100', GOLD: '#f97316',
  SILVER: '#94a3b8',   BRONZE: '#b45309'
}

export default function BidHistory() {
  const { tid }    = useParams()
  const navigate   = useNavigate()
  const [tab, setTab]         = useState('history')
  const [history, setHistory] = useState(null)
  const [spending, setSpend]  = useState(null)
  const [mvp, setMvp]         = useState(null)
  const [pace, setPace]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [tierFilter, setTier] = useState('ALL')
  const [expanded, setExp]    = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [h, s, m, p] = await Promise.all([
          getTournamentHistory(tid),
          getTeamSpending(tid),
          getMvp(tid),
          getAuctionPace(tid),
        ])
        setHistory(h.data)
        setSpend(s.data)
        setMvp(m.data)
        setPace(p.data)
      } catch (e) {
        toast.error('Load failed: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tid])

  // ── Filter players ────────────────────────────────────────────
  const players = (history?.players || []).filter(p => {
    if (tierFilter !== 'ALL' && p.playerTier !== tierFilter) return false
    if (search && !p.playerName.toLowerCase()
            .includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return (
    <div className="bh-loading">
      <motion.div animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        ⚙️
      </motion.div>
      <p>Loading bid history...</p>
    </div>
  )

  return (
    <div className="bh-bg">

      {/* Header */}
      <div className="bh-header">
        <button className="bh-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="bh-title">📋 Auction Bid History</h1>
        <div className="bh-header-stats">
          <span>🔨 {history?.totalPlayers || 0} Players</span>
          <span>📊 {history?.totalBidsPlaced || 0} Total Bids</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bh-tabbar">
        {TABS.map(t => (
          <motion.button key={t.key}
            className={`bh-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            whileTap={{ scale: 0.97 }}>
            {t.icon} {t.label}
          </motion.button>
        ))}
      </div>

      <div className="bh-content">
        <AnimatePresence mode="wait">

          {/* ════ BID HISTORY TAB ════ */}
          {tab === 'history' && (
            <motion.div key="hist"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>

              {/* Summary cards */}
              <div className="bh-summary-row">
                {[
                  { icon:'📊', label:'Avg Bids/Player',
                    val: (history?.avgBidsPerPlayer || 0).toFixed(1) },
                  { icon:'🔥', label:'Most Contested',
                    val: history?.mostContested?.player || '—' },
                  { icon:'⚡', label:'Quickest Sold',
                    val: history?.quickestSold?.player || '—' },
                ].map((s, i) => (
                  <motion.div key={i} className="bh-sum-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}>
                    <span className="bh-sum-icon">{s.icon}</span>
                    <span className="bh-sum-val">{s.val}</span>
                    <span className="bh-sum-lbl">{s.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Filters */}
              <div className="bh-filters">
                <input className="bh-search"
                  placeholder="🔍 Search player..."
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
                <div className="bh-tier-btns">
                  {['ALL','PLATINUM','GOLD','SILVER','BRONZE'].map(t => (
                    <button key={t}
                      className={`bh-tier-btn ${tierFilter === t
                        ? 'active' : ''}`}
                      style={tierFilter === t && t !== 'ALL'
                        ? { borderColor: TIER_COLORS[t],
                            color: TIER_COLORS[t] } : {}}
                      onClick={() => setTier(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player list */}
              <div className="bh-player-list">
                {players.map((p, i) => (
                  <motion.div key={p.playerId || i}
                    className="bh-player-row"
                    style={{
                      '--tc': TIER_COLORS[p.playerTier] || '#888'
                    }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    layout>

                    {/* Main row */}
                    <div className="bhpr-main"
                      onClick={() => setExp(
                        expanded === p.playerId ? null : p.playerId)}>

                      {/* Photo */}
                      <PlayerMini player={p} />

                      {/* Info */}
                      <div className="bhpr-info">
                        <span className="bhpr-name">
                          {p.playerName}
                        </span>
                        <span className="bhpr-role">
                          {p.playerRole}
                        </span>
                      </div>

                      {/* Tier */}
                      <span className="bhpr-tier"
                        style={{ color: TIER_COLORS[p.playerTier],
                                 borderColor: TIER_COLORS[p.playerTier]
                                              + '55' }}>
                        {p.playerTier}
                      </span>

                      {/* Bid count */}
                      <div className="bhpr-bids">
                        <span className="bhpr-bid-count">
                          {p.totalBids}
                        </span>
                        <span className="bhpr-bid-lbl">bids</span>
                      </div>

                      {/* Base → Sold */}
                      <div className="bhpr-prices">
                        <span className="bhpr-base">
                          ₹{Number(p.basePrice || 0).toLocaleString()}
                        </span>
                        <span className="bhpr-arrow">→</span>
                        <span className={`bhpr-sold ${
                          p.status === 'SOLD' ? 'sold' : 'unsold'}`}>
                          {p.status === 'SOLD'
                            ? '₹' + Number(p.soldPrice || 0)
                                       .toLocaleString()
                            : 'UNSOLD'}
                        </span>
                        {p.priceJump > 0 && (
                          <span className="bhpr-jump">
                            +{p.priceJump}%
                          </span>
                        )}
                      </div>

                      {/* Team */}
                      {p.soldTo && (
                        <div className="bhpr-team"
                          style={{ color: p.soldToColor }}>
                          → {p.soldTo}
                        </div>
                      )}

                      <span className="bhpr-expand">
                        {expanded === p.playerId ? '▲' : '▼'}
                      </span>
                    </div>

                    {/* Expanded bid timeline */}
                    <AnimatePresence>
                      {expanded === p.playerId && (
                        <motion.div className="bhpr-timeline"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}>

                          <div className="bht-header">
                            📊 Bid Timeline
                          </div>

                          {p.bidTimeline?.length > 0 ? (
                            <div className="bht-bids">
                              {p.bidTimeline.map((bid, bi) => (
                                <div key={bi}
                                  className={`bht-bid ${
                                    bid.isWinner ? 'winner' : ''}`}
                                  style={{
                                    '--bc': bid.teamColor || '#888'
                                  }}>
                                  <div className="bht-dot"
                                    style={{
                                      background: bid.teamColor
                                                  || '#888'
                                    }} />
                                  <span className="bht-team">
                                    {bid.teamName}
                                  </span>
                                  {bid.second != null && (
                                    <span className="bht-time">
                                      {bid.second}s left
                                    </span>
                                  )}
                                  <span className="bht-amount">
                                    ₹{Number(bid.amount || 0)
                                       .toLocaleString()}
                                  </span>
                                  {bid.isWinner && (
                                    <span className="bht-win">
                                      🔨 SOLD
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bht-empty">
                              No detailed bid data available
                            </div>
                          )}

                          {/* Price chart for this player */}
                          {p.bidTimeline?.length > 1 && (
                            <MiniPriceChart
                              bids={p.bidTimeline}
                              base={p.basePrice}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════ TEAM SPENDING TAB ════ */}
          {tab === 'spending' && (
            <motion.div key="spend"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>
              <div className="spend-grid">
                {(spending?.teams || []).map((team, i) => (
                  <motion.div key={team.teamId}
                    className="spend-card"
                    style={{ '--tc': team.teamColor || '#888' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}>

                    <div className="sc2-header">
                      <div className="sc2-colorbar"
                        style={{ background: team.teamColor }} />
                      <div>
                        <div className="sc2-team"
                          style={{ color: team.teamColor }}>
                          {team.teamName}
                        </div>
                        <div className="sc2-captain">
                          {team.captainName}
                        </div>
                      </div>
                    </div>

                    <div className="sc2-stats">
                      <div className="sc2-s">
                        <span>💰 Spent</span>
                        <strong>
                          ₹{Number(team.totalSpent).toLocaleString()}
                        </strong>
                      </div>
                      <div className="sc2-s">
                        <span>👥 Players</span>
                        <strong>{team.playerCount}</strong>
                      </div>
                      <div className="sc2-s">
                        <span>📊 Avg/Player</span>
                        <strong>
                          ₹{Number(team.avgPerPlayer).toLocaleString()}
                        </strong>
                      </div>
                      <div className="sc2-s">
                        <span>🏆 Biggest Buy</span>
                        <strong>
                          ₹{Number(team.biggestBuy).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Budget bar */}
                    <div className="sc2-bar-wrap">
                      <div className="sc2-bar-bg">
                        <motion.div className="sc2-bar-fill"
                          style={{ background: team.teamColor }}
                          initial={{ width: 0 }}
                          animate={{ width:
                            `${team.totalBudget > 0
                              ? (team.totalSpent / team.totalBudget)
                                * 100 : 0}%` }}
                          transition={{ duration: 0.7 }} />
                      </div>
                      <span className="sc2-bar-lbl">
                        {team.totalBudget > 0
                          ? Math.round((team.totalSpent
                              / team.totalBudget) * 100) : 0}%
                        &nbsp;used
                      </span>
                    </div>

                    {/* Spend by tier */}
                    <div className="sc2-tiers">
                      {Object.entries(team.spendByTier || {})
                        .sort((a, b) => b[1] - a[1])
                        .map(([tier, amt]) => (
                        <div key={tier} className="sc2-tier-row">
                          <span className="sc2-tier-dot"
                            style={{
                              background: TIER_COLORS[tier] || '#888'
                            }} />
                          <span className="sc2-tier-name">{tier}</span>
                          <span className="sc2-tier-amt">
                            ₹{Number(amt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Top 3 players */}
                    {team.topPlayers?.length > 0 && (
                      <div className="sc2-top-players">
                        <div className="sc2-tp-title">Top Buys</div>
                        {team.topPlayers.map((p, pi) => (
                          <div key={pi} className="sc2-tp-row">
                            <span className="sc2-tp-rank">
                              {pi + 1}
                            </span>
                            <span className="sc2-tp-name">
                              {p.name}
                            </span>
                            <span className="sc2-tp-role">
                              {p.role}
                            </span>
                            <span className="sc2-tp-price">
                              ₹{Number(p.price).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════ MVP TAB ════ */}
          {tab === 'mvp' && (
            <motion.div key="mvp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>
              <div className="mvp-grid">

                {/* Main MVP */}
                {mvp?.mvp && (
                  <motion.div className="mvp-card main"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}>
                    <div className="mvp-crown">👑</div>
                    <div className="mvp-badge">
                      PLAYER OF THE TOURNAMENT
                    </div>
                    <MvpPhoto player={mvp.mvp} size={100} />
                    <div className="mvp-name">{mvp.mvp.name}</div>
                    <div className="mvp-role">{mvp.mvp.role}</div>
                    <div className="mvp-tier-badge"
                      style={{
                        color: TIER_COLORS[mvp.mvp.tier],
                        borderColor: TIER_COLORS[mvp.mvp.tier] + '55'
                      }}>
                      {mvp.mvp.tier}
                    </div>
                    <div className="mvp-price-row">
                      <div className="mvp-price-item">
                        <span>Base</span>
                        <strong>
                          ₹{Number(mvp.mvp.basePrice).toLocaleString()}
                        </strong>
                      </div>
                      <div className="mvp-price-arrow">→</div>
                      <div className="mvp-price-item sold">
                        <span>Sold</span>
                        <strong>
                          ₹{Number(mvp.mvp.soldPrice).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                    <div className="mvp-jump">
                      +{mvp.mvp.pricePct}% above base
                    </div>
                    <div className="mvp-team"
                      style={{ color: mvp.mvp.teamColor }}>
                      → {mvp.mvp.team}
                    </div>
                    <div className="mvp-bids">
                      🔥 {mvp.mvp.bids} bids placed
                    </div>
                  </motion.div>
                )}

                {/* Most Wanted */}
                {mvp?.mostWanted && (
                  <motion.div className="mvp-card secondary"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15 }}>
                    <div className="mvp-crown">🔥</div>
                    <div className="mvp-badge orange">MOST WANTED</div>
                    <div className="mvp-name">{mvp.mostWanted.name}</div>
                    <div className="mvp-bids big">
                      {mvp.mostWanted.bids} bids
                    </div>
                    <div className="mvp-price-tag">
                      ₹{Number(mvp.mostWanted.price).toLocaleString()}
                    </div>
                    <div className="mvp-team">{mvp.mostWanted.team}</div>
                  </motion.div>
                )}

                {/* Best Bargain */}
                {mvp?.bestBargain && (
                  <motion.div className="mvp-card secondary"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25 }}>
                    <div className="mvp-crown">🎯</div>
                    <div className="mvp-badge green">BEST BARGAIN</div>
                    <div className="mvp-name">
                      {mvp.bestBargain.name}
                    </div>
                    <div className="mvp-price-row">
                      <div className="mvp-price-item">
                        <span>Base</span>
                        <strong>
                          ₹{Number(mvp.bestBargain.basePrice)
                             .toLocaleString()}
                        </strong>
                      </div>
                      <div className="mvp-price-arrow">→</div>
                      <div className="mvp-price-item">
                        <span>Sold</span>
                        <strong>
                          ₹{Number(mvp.bestBargain.soldPrice)
                             .toLocaleString()}
                        </strong>
                      </div>
                    </div>
                    <div className="mvp-ratio">
                      {mvp.bestBargain.ratio}x base price
                    </div>
                    <div className="mvp-team">{mvp.bestBargain.team}</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ PACE TAB ════ */}
          {tab === 'pace' && (
            <motion.div key="pace"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>
              <div className="pace-wrap">
                <h3 className="pace-title">⚡ Auction Round Pace</h3>
                <p className="pace-sub">
                  Bids placed per player — more bids = more competition
                </p>
                <div className="pace-chart">
                  {pace.map((p, i) => {
                    const maxBids = Math.max(
                      ...pace.map(x => x.totalBids || 0), 1)
                    const pct = ((p.totalBids || 0) / maxBids) * 100
                    return (
                      <motion.div key={i} className="pace-row"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}>
                        <span className="pace-num">{i + 1}</span>
                        <div className="pace-player-info">
                          <span className="pace-pname">
                            {p.playerName}
                          </span>
                          <span className="pace-ptier"
                            style={{
                              color: TIER_COLORS[p.playerTier] || '#888'
                            }}>
                            {p.playerTier}
                          </span>
                        </div>
                        <div className="pace-bar-bg">
                          <motion.div className="pace-bar-fill"
                            style={{
                              background: p.status === 'SOLD'
                                ? (TIER_COLORS[p.playerTier] || '#22c55e')
                                : '#ef4444'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: pct + '%' }}
                            transition={{
                              duration: 0.6, delay: i * 0.02
                            }} />
                        </div>
                        <span className="pace-bids">
                          {p.totalBids} bids
                        </span>
                        <span className={`pace-status ${
                          p.status.toLowerCase()}`}>
                          {p.status === 'SOLD'
                            ? '₹' + Number(p.soldPrice || 0)
                                       .toLocaleString()
                            : 'UNSOLD'}
                        </span>
                        <span className="pace-team"
                          style={{ color: p.teamColor }}>
                          {p.teamName}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Mini components ──────────────────────────────────────────────────
function PlayerMini({ player }) {
  const [err, setErr] = useState(false)
  const src = playerImageUrl(player.playerPhoto)
  return (
    <div className="bhpr-photo"
      style={{ borderColor: TIER_COLORS[player.playerTier] || '#888' }}>
      {src && !err
        ? <img src={src} alt={player.playerName}
            onError={() => setErr(true)} />
        : <span>{player.playerName?.charAt(0)}</span>}
    </div>
  )
}

function MvpPhoto({ player, size = 80 }) {
  const [err, setErr] = useState(false)
  const src = playerImageUrl(player.photo)
  return (
    <div className="mvp-photo"
      style={{ width: size, height: size }}>
      {src && !err
        ? <img src={src} alt={player.name}
            onError={() => setErr(true)} />
        : <span>{player.name?.charAt(0)}</span>}
    </div>
  )
}

function MiniPriceChart({ bids, base }) {
  if (!bids?.length) return null
  const prices = [base, ...bids.map(b => b.amount)].filter(Boolean)
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const range = max - min || 1
  const w = 300, h = 60, pad = 8

  const pts = prices.map((price, i) => {
    const x = pad + (i / Math.max(prices.length - 1, 1))
              * (w - pad * 2)
    const y = h - pad - ((price - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bht-chart">
      <div className="bht-chart-title">Price Progression</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="bht-svg">
        <polyline points={pts}
          fill="none" stroke="#22d3ee"
          strokeWidth="2"
          strokeLinejoin="round" />
        {prices.map((price, i) => {
          const x = pad + (i / Math.max(prices.length - 1, 1))
                    * (w - pad * 2)
          const y = h - pad - ((price - min) / range) * (h - pad * 2)
          const bid = bids[i - 1]
          return (
            <circle key={i} cx={x} cy={y} r="4"
              fill={bid?.isWinner ? '#22c55e'
                : i === 0 ? '#8891aa' : '#22d3ee'}
              stroke="#0d0f1a" strokeWidth="2">
              <title>
                {i === 0 ? 'Base' : (bid?.teamName || '')}:
                ₹{Number(price).toLocaleString()}
              </title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}