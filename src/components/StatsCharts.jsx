import { useState } from 'react'
import { motion } from 'framer-motion'

const TIER_COLORS = {
  PLATINUM: '#e5c100', GOLD: '#f97316',
  SILVER: '#94a3b8',   BRONZE: '#b45309'
}
const ROLE_COLORS = ['#22d3ee','#e63946','#22c55e','#f59e0b','#a78bfa','#f472b6']

export default function StatsCharts({ charts, squads }) {
  const [priceView, setPriceView] = useState('bar') // 'bar' | 'line'

  if (!charts) return <div className="charts-loading">Loading charts...</div>

  return (
    <div className="charts-wrap">

      {/* ── Row 1: Budget vs Remaining ──────────────────── */}
      <div className="chart-section">
        <h3 className="chart-title">💰 Budget Utilisation by Team</h3>
        <div className="budget-chart">
          {charts.budgetChart?.map((t, i) => (
            <motion.div key={i} className="bc-team-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>

              {/* Stacked bar */}
              <div className="bc-bar-wrap">
                <div className="bc-bar-total">
                  {/* Spent */}
                  <motion.div className="bc-bar-spent"
                    style={{ background: t.color || '#e63946' }}
                    title={`Spent: ₹${Number(t.spent).toLocaleString()}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${t.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07 }} />
                  {/* Remaining */}
                  <motion.div className="bc-bar-remaining"
                    title={`Remaining: ₹${Number(t.remaining).toLocaleString()}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${100 - t.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07 }} />
                </div>
                <span className="bc-pct">{t.pct}%</span>
              </div>

              {/* Team label */}
              <div className="bc-label">
                <div className="bc-dot" style={{ background: t.color }} />
                <span>{t.team}</span>
              </div>
              <span className="bc-spent-amt">
                ₹{Number(t.spent || 0).toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="bc-legend">
          <span className="bc-legend-item spent">■ Spent</span>
          <span className="bc-legend-item remaining">■ Remaining</span>
        </div>
      </div>

      {/* ── Row 2: Tier + Role distribution ─────────────── */}
      <div className="charts-row-2">

        {/* Tier Donut */}
        <div className="chart-section half">
          <h3 className="chart-title">🏅 Tier Distribution</h3>
          <TierDonut data={charts.tierDist} />
        </div>

        {/* Role Bar */}
        <div className="chart-section half">
          <h3 className="chart-title">⚾ Role Distribution</h3>
          <RoleBarChart data={charts.roleDist} />
        </div>
      </div>

      {/* ── Row 3: Price progression ─────────────────────── */}
      <div className="chart-section">
        <div className="chart-title-row">
          <h3 className="chart-title">📈 Auction Price Progression</h3>
          <div className="price-view-toggle">
            <button className={priceView === 'bar' ? 'active' : ''}
              onClick={() => setPriceView('bar')}>Bar</button>
            <button className={priceView === 'line' ? 'active' : ''}
              onClick={() => setPriceView('line')}>Line</button>
          </div>
        </div>
        <PriceProgressChart
          data={charts.priceProgress}
          view={priceView}
        />
      </div>

      {/* ── Row 4: Per-team tier breakdown ───────────────── */}
      <div className="chart-section">
        <h3 className="chart-title">👥 Per-Team Tier Breakdown</h3>
        <TeamTierBreakdown squads={squads} />
      </div>

    </div>
  )
}

// ── Tier donut (pure CSS/SVG) ────────────────────────────────────────
function TierDonut({ data }) {
  if (!data) return null
  const entries = Object.entries(data)
  const total   = entries.reduce((s, [, v]) => s + Number(v), 0)
  if (total === 0) return <div className="chart-empty">No data</div>

  let cumPct = 0
  const segments = entries.map(([tier, count]) => {
    const pct   = (Number(count) / total) * 100
    const start = cumPct
    cumPct += pct
    return { tier, count, pct, start }
  })

  // SVG circle donut
  const r = 60, cx = 80, cy = 80, stroke = 38
  const circ = 2 * Math.PI * r

  return (
    <div className="donut-wrap">
      <svg width="160" height="160" className="donut-svg">
        {segments.map(({ tier, pct, start }, i) => (
          <circle key={tier}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={TIER_COLORS[tier] || '#555'}
            strokeWidth={stroke}
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            strokeDashoffset={-((start / 100) * circ)}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}>
            <title>{tier}: {pct.toFixed(1)}%</title>
          </circle>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle"
          fill="white" fontSize="18" fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle"
          fill="#8891aa" fontSize="10">
          PLAYERS
        </text>
      </svg>

      <div className="donut-legend">
        {segments.map(({ tier, count, pct }) => (
          <div key={tier} className="donut-legend-row">
            <span className="donut-dot"
              style={{ background: TIER_COLORS[tier] }} />
            <span className="donut-tier">{tier}</span>
            <span className="donut-count">{count}</span>
            <span className="donut-pct">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Role horizontal bar chart ────────────────────────────────────────
function RoleBarChart({ data }) {
  if (!data) return null
  const entries  = Object.entries(data).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...entries.map(([, v]) => Number(v)), 1)

  return (
    <div className="role-chart">
      {entries.map(([role, count], i) => (
        <div key={role} className="rc-row">
          <span className="rc-label">{role}</span>
          <div className="rc-bar-bg">
            <motion.div className="rc-bar-fill"
              style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${(Number(count) / maxCount) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.06 }} />
          </div>
          <span className="rc-count">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Price progression chart ──────────────────────────────────────────
function PriceProgressChart({ data, view }) {
  if (!data?.length) return <div className="chart-empty">No sales data</div>
  const maxPrice = Math.max(...data.map(d => d.price), 1)
  const display  = data.slice(0, 30) // cap at 30 for readability

  if (view === 'line') {
    const w = 600, h = 180, pad = 30
    const points = display.map((d, i) => {
      const x = pad + (i / (display.length - 1)) * (w - pad * 2)
      const y = h - pad - ((d.price / maxPrice) * (h - pad * 2))
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="line-chart-wrap">
        <svg viewBox={`0 0 ${w} ${h}`} className="line-chart-svg">
          <polyline points={points}
            fill="none" stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinejoin="round" />
          {display.map((d, i) => {
            const x = pad + (i / Math.max(display.length - 1, 1)) * (w - pad * 2)
            const y = h - pad - ((d.price / maxPrice) * (h - pad * 2))
            return (
              <circle key={i} cx={x} cy={y} r="4"
                fill={TIER_COLORS[d.tier] || '#22d3ee'}
                stroke="#0d0f1a" strokeWidth="2">
                <title>{d.player} — ₹{d.price}</title>
              </circle>
            )
          })}
        </svg>
        <div className="line-axis">
          <span>0</span>
          <span>₹{Number(maxPrice).toLocaleString()}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="price-bar-chart">
      {display.map((d, i) => (
        <div key={i} className="pbc-col"
          title={`${d.player}\n${d.team}\n₹${d.price}`}>
          <motion.div className="pbc-bar"
            style={{ background: TIER_COLORS[d.tier] || '#22d3ee' }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.price / maxPrice) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }} />
          <span className="pbc-label">{d.player?.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  )
}

// ── Per-team tier breakdown ──────────────────────────────────────────
function TeamTierBreakdown({ squads }) {
  return (
    <div className="ttb-grid">
      {squads?.map(squad => (
        <div key={squad.teamId} className="ttb-card">
          <div className="ttb-team-name"
            style={{ color: squad.teamColor }}>
            {squad.teamName}
          </div>
          <div className="ttb-tiers">
            {['PLATINUM','GOLD','SILVER','BRONZE'].map(tier => {
              const count = squad.tierBreakdown?.[tier] || 0
              return (
                <div key={tier} className="ttb-tier-row">
                  <span className="ttb-dot"
                    style={{ background: TIER_COLORS[tier] }} />
                  <span className="ttb-tier-name">{tier}</span>
                  <div className="ttb-mini-bar-bg">
                    <div className="ttb-mini-bar-fill"
                      style={{
                        background: TIER_COLORS[tier],
                        width: count > 0
                          ? `${Math.min((count / (squad.playerCount || 1)) * 100, 100)}%`
                          : '0%'
                      }} />
                  </div>
                  <span className="ttb-tier-count">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}