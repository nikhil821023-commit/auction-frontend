import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAnalytics, getAdminFeedback, getTournaments } from '../api/adminApi'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'overview',    icon: '📊', label: 'Overview'    },
  { key: 'feedback',    icon: '💬', label: 'Feedback'    },
  { key: 'tournaments', icon: '🏆', label: 'Tournaments' },
  { key: 'traffic',     icon: '📈', label: 'Traffic'     },
]

const STAR = '★'

export default function AdminDashboard() {
  const [tab, setTab]           = useState('overview')
  const [analytics, setAn]      = useState(null)
  const [feedback, setFb]       = useState(null)
  const [tournaments, setTm]    = useState([])
  const [loading, setLoading]   = useState(true)
  const [fbFilter, setFbFilter] = useState('ALL')
  const [fbSort, setFbSort]     = useState('newest')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [an, fb, tm] = await Promise.all([
          getAnalytics(),
          getAdminFeedback(),
          getTournaments(),
        ])
        setAn(an.data)
        setFb(fb.data)
        setTm(tm.data)
      } catch (err) {
        toast.error('Load failed: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="admin-loading">
      <motion.div animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        ⚙️
      </motion.div>
      <p>Loading admin data...</p>
    </div>
  )

  // ── Feedback filtering ────────────────────────────────────────
  const entries = feedback?.entries || []
  const filtered = entries
    .filter(f => {
      if (fbFilter !== 'ALL' && f.role !== fbFilter) return false
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())
                 && !(f.tournament || '').toLowerCase()
                        .includes(search.toLowerCase())
                 && !(f.bestPart || '').toLowerCase()
                        .includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (fbSort === 'newest')  return b.id - a.id
      if (fbSort === 'oldest')  return a.id - b.id
      if (fbSort === 'highest') return (b.overall || 0) - (a.overall || 0)
      if (fbSort === 'lowest')  return (a.overall || 0) - (b.overall || 0)
      return 0
    })

  const pl = analytics?.platform || {}
  const tr = analytics?.traffic  || {}
  const us = analytics?.users    || {}

  return (
    <div className="admin-bg">

      {/* ── Top Bar ───────────────────────────────────────── */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="admin-logo">⚙️</span>
          <span className="admin-title">AuctionX Admin</span>
        </div>
        <div className="admin-topbar-right">
          <span className="admin-live-dot" />
          <span className="admin-live-txt">Live Platform</span>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="admin-tabbar">
        {TABS.map(t => (
          <motion.button key={t.key}
            className={`admin-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            whileTap={{ scale: 0.97 }}>
            {t.icon} {t.label}
          </motion.button>
        ))}
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">

          {/* ════ OVERVIEW TAB ════ */}
          {tab === 'overview' && (
            <motion.div key="ov"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>

              {/* Big stat cards */}
              <div className="admin-stat-grid">
                {[
                  { icon:'🌐', label:'Total Visits',    val: tr.totalVisits   || 0, color:'#22d3ee' },
                  { icon:'👤', label:'Today\'s Visits', val: tr.todayVisits   || 0, color:'#22c55e' },
                  { icon:'🏆', label:'Tournaments',     val: pl.totalTournaments || 0, color:'#f59e0b' },
                  { icon:'👥', label:'Total Teams',     val: pl.totalTeams    || 0, color:'#a78bfa' },
                  { icon:'🏏', label:'Total Players',   val: pl.totalPlayers  || 0, color:'#f97316' },
                  { icon:'🔨', label:'Total Sales',     val: pl.totalSales    || 0, color:'#e63946' },
                  { icon:'💰', label:'Money Transacted',
                    val: '₹' + Number(pl.totalMoneyTransacted || 0)
                               .toLocaleString(),
                    color:'#f59e0b' },
                  { icon:'⭐', label:'Avg Rating',
                    val: (analytics?.feedback?.averageRating || 0) + '/5',
                    color:'#fbbf24' },
                ].map((s, i) => (
                  <motion.div key={s.label}
                    className="admin-stat-card"
                    style={{ '--sc': s.color }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <span className="asc-icon">{s.icon}</span>
                    <span className="asc-val">{s.val}</span>
                    <span className="asc-label">{s.label}</span>
                    <div className="asc-glow" />
                  </motion.div>
                ))}
              </div>

              {/* User role breakdown */}
              <div className="admin-row-2">
                <div className="admin-panel">
                  <h3 className="admin-panel-title">👥 Users by Role</h3>
                  <div className="role-bars">
                    {[
                      { role:'Organizers', count: us.organizers || 0, color:'#e63946' },
                      { role:'Captains',   count: us.captains   || 0, color:'#22d3ee' },
                      { role:'Spectators', count: us.spectators || 0, color:'#22c55e' },
                    ].map(r => {
                      const total = (us.organizers||0) +
                                    (us.captains||0) +
                                    (us.spectators||0) || 1
                      const pct = Math.round((r.count / total) * 100)
                      return (
                        <div key={r.role} className="role-bar-row">
                          <span className="role-bar-label">{r.role}</span>
                          <div className="role-bar-bg">
                            <motion.div className="role-bar-fill"
                              style={{ background: r.color }}
                              initial={{ width: 0 }}
                              animate={{ width: pct + '%' }}
                              transition={{ duration: 0.8 }} />
                          </div>
                          <span className="role-bar-count">
                            {r.count} ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top pages */}
                <div className="admin-panel">
                  <h3 className="admin-panel-title">🔥 Most Visited Pages</h3>
                  <div className="top-pages">
                    {(analytics?.topPages || [])
                      .slice(0, 8).map((p, i) => (
                      <div key={i} className="top-page-row">
                        <span className="tp-rank">{i + 1}</span>
                        <span className="tp-page">{p.page}</span>
                        <span className="tp-count">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature requests from feedback */}
              <div className="admin-panel">
                <h3 className="admin-panel-title">
                  🗳️ Most Requested Features
                </h3>
                <div className="feature-req-grid">
                  {Object.entries(feedback?.featureRequests || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([feat, count], i) => (
                    <div key={feat} className="fr-item">
                      <span className="fr-name">{feat}</span>
                      <span className="fr-count">{count} votes</span>
                      <div className="fr-bar-bg">
                        <motion.div className="fr-bar-fill"
                          style={{ background: [
                            '#e63946','#f97316','#22d3ee',
                            '#a78bfa','#22c55e'
                          ][i % 5] }}
                          initial={{ width: 0 }}
                          animate={{ width: count > 0
                            ? `${(count / Math.max(
                                ...Object.values(
                                  feedback?.featureRequests || {1:1}
                                ))) * 100}%`
                            : '0%' }}
                          transition={{ duration: 0.7, delay: i * 0.06 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ FEEDBACK TAB ════ */}
          {tab === 'feedback' && (
            <motion.div key="fb"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>

              {/* Summary row */}
              <div className="fb-summary-row">
                <div className="fbs-card">
                  <span className="fbs-val">{feedback?.total || 0}</span>
                  <span className="fbs-lbl">Total Responses</span>
                </div>
                <div className="fbs-card gold">
                  <span className="fbs-val">
                    {'★'.repeat(Math.round(feedback?.avgRating || 0))}
                    &nbsp;{feedback?.avgRating}/5
                  </span>
                  <span className="fbs-lbl">Average Rating</span>
                </div>
                <div className="fbs-card green">
                  <span className="fbs-val">{feedback?.recommendPct || 0}%</span>
                  <span className="fbs-lbl">Would Recommend</span>
                </div>
              </div>

              {/* Rating distribution */}
              <div className="admin-panel">
                <h3 className="admin-panel-title">⭐ Rating Distribution</h3>
                <div className="rating-dist">
                  {[5,4,3,2,1].map(star => {
                    const count = feedback?.ratingDist?.[star] || 0
                    const total = feedback?.total || 1
                    const pct   = Math.round((count / total) * 100)
                    return (
                      <div key={star} className="rd-row">
                        <span className="rd-star">
                          {'★'.repeat(star)}
                        </span>
                        <div className="rd-bar-bg">
                          <motion.div className="rd-bar-fill"
                            style={{ background: star >= 4
                              ? '#22c55e' : star === 3
                              ? '#f59e0b' : '#ef4444' }}
                            initial={{ width: 0 }}
                            animate={{ width: pct + '%' }}
                            transition={{ duration: 0.7 }} />
                        </div>
                        <span className="rd-count">{count} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="fb-filters">
                <input className="fb-search" placeholder="🔍 Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
                <select className="admin-select"
                  value={fbFilter}
                  onChange={e => setFbFilter(e.target.value)}>
                  <option value="ALL">All Roles</option>
                  <option value="ORGANIZER">🎯 Organizer</option>
                  <option value="CAPTAIN">🧢 Captain</option>
                  <option value="SPECTATOR">👀 Spectator</option>
                </select>
                <select className="admin-select"
                  value={fbSort}
                  onChange={e => setFbSort(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>

              {/* Feedback cards */}
              <div className="fb-cards-list">
                {filtered.length === 0 && (
                  <div className="admin-empty">No feedback found</div>
                )}
                {filtered.map((f, i) => (
                  <motion.div key={f.id} className="fbc"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}>

                    {/* Header */}
                    <div className="fbc-header">
                      <div className="fbc-name-row">
                        <span className="fbc-name">{f.name}</span>
                        <span className={`fbc-role-badge role-${
                          f.role?.toLowerCase()}`}>
                          {f.role === 'ORGANIZER' ? '🎯'
                            : f.role === 'CAPTAIN' ? '🧢' : '👀'}
                          {f.role}
                        </span>
                        {f.tournament && (
                          <span className="fbc-tournament">
                            🏆 {f.tournament}
                          </span>
                        )}
                      </div>
                      <div className="fbc-ratings-row">
                        <span className="fbc-stars">
                          {'★'.repeat(f.overall || 0)}
                          {'☆'.repeat(5 - (f.overall || 0))}
                        </span>
                        <span className="fbc-rating-num">
                          {f.overall}/5
                        </span>
                        {f.recommend === true && (
                          <span className="fbc-rec yes">👍 Recommends</span>
                        )}
                        {f.recommend === false && (
                          <span className="fbc-rec no">👎</span>
                        )}
                        <span className="fbc-date">
                          {f.submittedAt
                            ? new Date(f.submittedAt)
                              .toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="fbc-body">
                      {f.bestPart && (
                        <div className="fbc-section">
                          <span className="fbc-s-label">
                            🌟 Loved:
                          </span>
                          <span className="fbc-s-text">{f.bestPart}</span>
                        </div>
                      )}
                      {f.improve && (
                        <div className="fbc-section">
                          <span className="fbc-s-label">
                            🔧 Improve:
                          </span>
                          <span className="fbc-s-text">{f.improve}</span>
                        </div>
                      )}
                      {f.comments && (
                        <div className="fbc-section">
                          <span className="fbc-s-label">
                            📝 Notes:
                          </span>
                          <span className="fbc-s-text">{f.comments}</span>
                        </div>
                      )}
                    </div>

                    {/* Sub ratings */}
                    <div className="fbc-sub-ratings">
                      {f.ease && (
                        <span className="fbc-sub">
                          Ease: {f.ease}/5
                        </span>
                      )}
                      {f.bid && (
                        <span className="fbc-sub">
                          Bidding: {f.bid}/5
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════ TOURNAMENTS TAB ════ */}
          {tab === 'tournaments' && (
            <motion.div key="tm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>
              <div className="admin-panel">
                <h3 className="admin-panel-title">
                  🏆 All Tournaments ({tournaments.length})
                </h3>
                <div className="tm-table-wrap">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Sport</th>
                        <th>Status</th>
                        <th>Teams</th>
                        <th>Players</th>
                        <th>Sold</th>
                        <th>Money</th>
                        <th>Feedback</th>
                        <th>Join Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournaments.map((t, i) => (
                        <tr key={t.id}
                          className={`tm-row status-${
                            t.status.toLowerCase()}`}>
                          <td className="tm-id">{t.id}</td>
                          <td className="tm-name">{t.name}</td>
                          <td className="tm-sport">{t.sportType}</td>
                          <td>
                            <span className={`tm-status-badge ${
                              t.status.toLowerCase()}`}>
                              {t.status === 'LIVE'      && '🔴 LIVE'}
                              {t.status === 'COMPLETED' && '✅ Done'}
                              {t.status === 'SETUP'     && '⚙️ Setup'}
                              {t.status === 'LOBBY'     && '🟡 Lobby'}
                            </span>
                          </td>
                          <td>{t.teams}</td>
                          <td>{t.players}</td>
                          <td className="tm-sold">{t.sold}</td>
                          <td className="tm-money">
                            ₹{Number(t.money).toLocaleString()}
                          </td>
                          <td className="tm-fb">
                            {t.feedback > 0
                              ? `⭐ ${t.feedback}`
                              : '—'}
                          </td>
                          <td>
                            <code className="tm-code">{t.joinCode}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ TRAFFIC TAB ════ */}
          {tab === 'traffic' && (
            <motion.div key="tr"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>

              <div className="admin-stat-grid">
                {[
                  { icon:'🌐', label:'Total Visits',         val: tr.totalVisits || 0 },
                  { icon:'📅', label:'Today',                val: tr.todayVisits || 0 },
                  { icon:'📆', label:'This Week',            val: tr.weekVisits  || 0 },
                  { icon:'👤', label:'Unique Visitors (7d)', val: tr.uniqueWeek  || 0 },
                ].map((s, i) => (
                  <motion.div key={s.label} className="admin-stat-card"
                    style={{ '--sc': '#22d3ee' }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}>
                    <span className="asc-icon">{s.icon}</span>
                    <span className="asc-val">{s.val}</span>
                    <span className="asc-label">{s.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Daily chart */}
              <div className="admin-panel">
                <h3 className="admin-panel-title">
                  📈 Daily Visits (Last 14 Days)
                </h3>
                <DailyChart data={tr.dailyChart || []} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Simple daily bar chart ───────────────────────────────────────────
function DailyChart({ data }) {
  if (!data.length) return (
    <div className="admin-empty">No traffic data yet</div>
  )
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="daily-chart">
      {data.map((d, i) => (
        <div key={i} className="dc-col">
          <motion.div className="dc-bar"
            initial={{ height: 0 }}
            animate={{ height: `${(d.count / max) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.03 }}
            title={`${d.date}: ${d.count} visits`} />
          <span className="dc-label">
            {d.date?.slice(5)}  {/* MM-DD */}
          </span>
          <span className="dc-count">{d.count}</span>
        </div>
      ))}
    </div>
  )
}