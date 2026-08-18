import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getSummary, getAllSquads, getLeaderboard,
  getUnsold, getChartData
} from '../api/postAuctionApi'
import SquadCard        from '../components/SquadCard'
import StatsCharts      from '../components/StatsCharts'
import TournamentSummary from '../components/TournamentSummary'
import { playerImageUrl } from '../utils/imageUrl'

const TABS = [
  { key: 'overview',    icon: '🏆', label: 'Overview'    },
  { key: 'squads',      icon: '👥', label: 'All Squads'  },
  { key: 'leaderboard', icon: '📊', label: 'Leaderboard' },
  { key: 'charts',      icon: '📈', label: 'Stats'       },
  { key: 'unsold',      icon: '❌', label: 'Unsold'      },
]

export default function PostAuction() {
  const { tid }    = useParams()
  const navigate   = useNavigate()
  const [tab, setTab]             = useState('overview')
  const [summary, setSummary]     = useState(null)
  const [squads, setSquads]       = useState([])
  const [leaderboard, setLboard]  = useState([])
  const [charts, setCharts]       = useState(null)
  const [unsold, setUnsold]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [shareTeam, setShareTeam] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [sumRes, sqRes, lbRes, chRes, unRes] = await Promise.all([
          getSummary(tid),
          getAllSquads(tid),
          getLeaderboard(tid),
          getChartData(tid),
          getUnsold(tid),
        ])
        setSummary(sumRes.data)
        setSquads(sqRes.data)
        setLboard(lbRes.data)
        setCharts(chRes.data)
        setUnsold(unRes.data)
      } catch (err) {
        toast.error('Failed to load results: ' + (err.response?.data?.error || err.message))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tid])

  if (loading) return <LoadingScreen />

  return (
    <div className="pa-bg">

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="pa-hero">
        <motion.div className="pa-hero-inner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}>
          <div className="pa-trophy">🏆</div>
          <div className="pa-hero-text">
            <h1 className="pa-tournament-name">
              {summary?.tournamentName}
            </h1>
            <p className="pa-hero-sub">
              {summary?.sportType?.toUpperCase()} AUCTION — FINAL RESULTS
            </p>
          </div>
          <div className="pa-hero-pills">
            <span className="pa-pill sold">
              🔨 {summary?.playersSold} Sold
            </span>
            <span className="pa-pill unsold">
              ❌ {summary?.playersUnsold} Unsold
            </span>
            <span className="pa-pill money">
              💰 ₹{Number(summary?.totalMoneySpent || 0).toLocaleString()}
            </span>
            <span className="pa-pill teams">
              👥 {summary?.totalTeams} Teams
            </span>
          </div>
        </motion.div>

        {/* Back button */}
        <motion.button className="pa-back-btn"
          onClick={() => navigate(`/dashboard/${tid}`)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          ← Live Dashboard
        </motion.button>
        <motion.button className="pa-back-btn"
          onClick={() => navigate(`/bid-history/${tid}`)}>
          📋 Bid History
        </motion.button>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div className="pa-tabbar">
        {TABS.map(t => (
          <motion.button
            key={t.key}
            className={`pa-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            whileTap={{ scale: 0.97 }}>
            <span className="pa-tab-icon">{t.icon}</span>
            <span className="pa-tab-label">{t.label}</span>
            {t.key === 'unsold' && unsold.length > 0 && (
              <span className="pa-tab-badge">{unsold.length}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────── */}
      <div className="pa-content">
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <motion.div key="overview" className="pa-tab-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}>
              <TournamentSummary
                summary={summary}
                leaderboard={leaderboard}
                onViewSquad={(teamId) => {
                  setTab('squads')
                  setShareTeam(teamId)
                }}
              />
            </motion.div>
          )}

          {/* ALL SQUADS */}
          {tab === 'squads' && (
            <motion.div key="squads" className="pa-tab-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}>
              <div className="pa-squads-grid">
                {squads.map((squad, i) => (
                  <motion.div key={squad.teamId}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}>
                    <SquadCard
                      squad={squad}
                      highlight={shareTeam === squad.teamId}
                      onShare={() => handleShareSquad(squad)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* LEADERBOARD */}
          {tab === 'leaderboard' && (
            <motion.div key="leaderboard" className="pa-tab-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}>
              <Leaderboard entries={leaderboard} />
            </motion.div>
          )}

          {/* CHARTS */}
          {tab === 'charts' && (
            <motion.div key="charts" className="pa-tab-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}>
              <StatsCharts charts={charts} squads={squads} />
            </motion.div>
          )}

          {/* UNSOLD */}
          {tab === 'unsold' && (
            <motion.div key="unsold" className="pa-tab-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}>
              <UnsoldPanel players={unsold} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <motion.div
        className="pa-feedback-strip"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 1.5 }}>
        <span className="pa-fs-text">
          🎉 Auction complete! How was your experience?
        </span>
        <motion.button
          className="pa-fs-btn"
          onClick={() => navigate(`/feedback/${tid}`)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}>
          📝 Give Feedback
        </motion.button>
        <button className="pa-fs-close"
          onClick={e => {
            e.currentTarget.parentElement.style.display = 'none'
          }}>
          ✕
        </button>
      </motion.div>
    </div>
  )
}

// ── Leaderboard ─────────────────────────────────────────────────────
function Leaderboard({ entries }) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="lb-wrap">
      <h2 className="pa-section-title">📊 Team Leaderboard</h2>
      <p className="pa-section-sub">
        Ranked by squad depth, tier quality and budget efficiency
      </p>

      <div className="lb-list">
        {entries.map((team, i) => (
          <motion.div
            key={team.teamId}
            className={`lb-row ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}
            style={{ '--tc': team.teamColor || '#888' }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}>

            <div className="lb-rank">
              {i < 3 ? medals[i] : <span className="lb-rank-num">{i + 1}</span>}
            </div>

            <div className="lb-team-color-bar"
              style={{ background: team.teamColor || '#888' }} />

            <div className="lb-team-info">
              <span className="lb-team-name">{team.teamName}</span>
              <span className="lb-captain">{team.captainName}</span>
            </div>

            <div className="lb-stats">
              <div className="lb-stat">
                <span className="lb-stat-val">{team.playerCount}</span>
                <span className="lb-stat-lbl">Players</span>
              </div>
              <div className="lb-stat">
                <span className="lb-stat-val">
                  {team.tierBreakdown?.PLATINUM || 0}P /
                  {team.tierBreakdown?.GOLD || 0}G
                </span>
                <span className="lb-stat-lbl">PLAT / GOLD</span>
              </div>
              <div className="lb-stat">
                <span className="lb-stat-val">
                  ₹{Number(team.remainingBudget || 0).toLocaleString()}
                </span>
                <span className="lb-stat-lbl">Remaining</span>
              </div>
              <div className="lb-stat highlight">
                <span className="lb-stat-val score">
                  {team.score}
                </span>
                <span className="lb-stat-lbl">Score</span>
              </div>
            </div>

            {/* Budget bar */}
            <div className="lb-bar-wrap">
              <div className="lb-bar-bg">
                <motion.div className="lb-bar-fill"
                  style={{ background: team.teamColor || '#888' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${team.budgetUsedPct || 0}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06 }} />
              </div>
              <span className="lb-bar-pct">{team.budgetUsedPct}%</span>
            </div>

          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Unsold Panel ────────────────────────────────────────────────────
function UnsoldPanel({ players }) {
  const tierColors = {
    PLATINUM: '#e5c100', GOLD: '#f97316',
    SILVER: '#94a3b8',   BRONZE: '#b45309'
  }

  if (players.length === 0) {
    return (
      <div className="unsold-empty">
        <span>🎉</span>
        <p>All players were sold!</p>
      </div>
    )
  }

  return (
    <div className="unsold-wrap">
      <h2 className="pa-section-title">❌ Unsold Players ({players.length})</h2>
      <p className="pa-section-sub">These players went unsold during the auction</p>
      <div className="unsold-grid">
        {players.map((p, i) => {
          const [imgErr, setImgErr] = useState(false)
          const src = playerImageUrl(p.photo)
          return (
            <motion.div key={p.id} className="unsold-card"
              style={{ '--tc': tierColors[p.tier] || '#555' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}>

              <div className="unsold-tier-dot"
                style={{ background: tierColors[p.tier] || '#555' }} />

              <div className="unsold-photo">
                {src && !imgErr ? (
                  <img src={src} alt={p.name}
                    onError={() => setImgErr(true)} />
                ) : (
                  <div className="unsold-avatar">
                    {p.name?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="unsold-info">
                <span className="unsold-name">{p.name}</span>
                <span className="unsold-role">{p.role}</span>
                <span className="unsold-price">
                  Base ₹{p.basePrice?.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Loading Screen ──────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="pa-loading">
      <motion.div className="pa-loading-trophy"
        animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}>
        🏆
      </motion.div>
      <p>Loading final results...</p>
    </div>
  )
}

// ── Share squad (Web Share API with clipboard fallback) ──────────────
function handleShareSquad(squad) {
  const text = `🏆 ${squad.teamName} Squad\n` +
    `👤 Captain: ${squad.captainName}\n` +
    `👥 Players: ${squad.playerCount}\n` +
    `💰 Spent: ₹${Number(squad.spentBudget).toLocaleString()}\n` +
    squad.players
      ?.map(p => `  • ${p.name} (${p.role}) — ₹${p.soldPrice}`)
      .join('\n')

  if (navigator.share) {
    navigator.share({ title: squad.teamName + ' Squad', text })
      .catch(() => {})
  } else {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Squad copied to clipboard!'))
      .catch(() => toast.error('Could not copy'))
  }
}
