import { motion } from 'framer-motion'
import { playerImageUrl } from '../utils/imageUrl'

export default function TournamentSummary({ summary, leaderboard, onViewSquad }) {
  if (!summary) return null

  const winner = leaderboard?.[0]
  const mvp    = summary.mostExpensivePlayer
  const best   = summary.bestValuePlayer

  const statCards = [
    { icon: '🔨', label: 'Players Sold',    value: summary.playersSold,    color: '#22c55e' },
    { icon: '❌', label: 'Players Unsold',   value: summary.playersUnsold,  color: '#ef4444' },
    { icon: '👥', label: 'Total Teams',      value: summary.totalTeams,     color: '#22d3ee' },
    { icon: '💰', label: 'Total Money Spent',
      value: '₹' + Number(summary.totalMoneySpent || 0).toLocaleString(),
      color: '#f59e0b' },
    { icon: '🚀', label: 'Highest Bid',
      value: '₹' + Number(summary.highestBid || 0).toLocaleString(),
      color: '#e63946' },
    { icon: '🏅', label: 'Most Active Buyer', value: summary.mostActiveBuyer, color: '#a78bfa' },
  ]

  return (
    <div className="ts-wrap">

      {/* ── Stat grid ───────────────────────────────────────── */}
      <div className="ts-stat-grid">
        {statCards.map((s, i) => (
          <motion.div key={s.label} className="ts-stat-card"
            style={{ '--sc': s.color }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <div className="ts-stat-icon">{s.icon}</div>
            <div className="ts-stat-value">{s.value}</div>
            <div className="ts-stat-label">{s.label}</div>
            <div className="ts-stat-glow" />
          </motion.div>
        ))}
      </div>

      {/* ── Highlights row ──────────────────────────────────── */}
      <div className="ts-highlights">

        {/* Champion team */}
        {winner && (
          <motion.div className="ts-highlight-card champion"
            style={{ borderColor: winner.teamColor }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}>
            <div className="tsh-badge">🥇 CHAMPION SQUAD</div>
            <div className="tsh-team-name"
              style={{ color: winner.teamColor }}>
              {winner.teamName}
            </div>
            <div className="tsh-captain">👤 {winner.captainName}</div>
            <div className="tsh-stats-row">
              <span>👥 {winner.playerCount} players</span>
              <span>🏅 Score: {winner.score}</span>
              <span>💰 ₹{Number(winner.remainingBudget || 0).toLocaleString()} left</span>
            </div>
            <button className="tsh-view-btn"
              style={{ background: winner.teamColor }}
              onClick={() => onViewSquad(winner.teamId)}>
              View Full Squad →
            </button>
          </motion.div>
        )}

        {/* Most expensive player */}
        {mvp && (
          <motion.div className="ts-highlight-card mvp"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}>
            <div className="tsh-badge golden">💎 MOST EXPENSIVE</div>
            <div className="tsh-mvp-name">{mvp.name}</div>
            <div className="tsh-mvp-role">{mvp.role}</div>
            <div className="tsh-mvp-price">
              ₹{Number(mvp.price || 0).toLocaleString()}
            </div>
            <div className="tsh-mvp-team">→ {mvp.team}</div>
          </motion.div>
        )}

        {/* Best value player */}
        {best && (
          <motion.div className="ts-highlight-card value"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}>
            <div className="tsh-badge green">🎯 BEST VALUE</div>
            <div className="tsh-mvp-name">{best.name}</div>
            <div className="tsh-value-row">
              <span>Base ₹{Number(best.basePrice || 0).toLocaleString()}</span>
              <span className="tsh-arrow">→</span>
              <span className="tsh-sold">₹{Number(best.soldPrice || 0).toLocaleString()}</span>
            </div>
            <div className="tsh-mvp-team">→ {best.team}</div>
          </motion.div>
        )}
      </div>

      {/* ── Mini leaderboard ────────────────────────────────── */}
      <div className="ts-mini-lb">
        <h3 className="ts-mini-lb-title">Final Standings</h3>
        {leaderboard?.slice(0, 5).map((t, i) => (
          <motion.div key={t.teamId} className="ts-lb-row"
            style={{ '--tc': t.teamColor || '#888' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.06 }}>
            <span className="ts-lb-pos">{i + 1}</span>
            <div className="ts-lb-dot"
              style={{ background: t.teamColor }} />
            <span className="ts-lb-name">{t.teamName}</span>
            <span className="ts-lb-count">{t.playerCount} players</span>
            <span className="ts-lb-score">{t.score} pts</span>
            <button className="ts-lb-view"
              onClick={() => onViewSquad(t.teamId)}>
              View →
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}