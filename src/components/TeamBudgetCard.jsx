import { motion } from 'framer-motion'

export default function TeamBudgetCard({ team }) {
  const usedPct = Math.min(team.budgetUsedPercent || 0, 100)
  const barColor = usedPct > 80 ? '#ef4444' : usedPct > 50 ? '#f59e0b' : '#22c55e'

  return (
    <div className="team-budget-card"
      style={{ borderTop: `4px solid ${team.teamColor || '#666'}` }}>

      <div className="tbc-header">
        <div className="tbc-team-name" style={{ color: team.teamColor }}>
          {team.teamName}
        </div>
        <div className="tbc-captain">{team.captainName}</div>
      </div>

      <div className="tbc-budget-row">
        <span>₹{team.spentBudget?.toLocaleString()}</span>
        <span className="tbc-slash">/</span>
        <span>₹{team.totalBudget?.toLocaleString()}</span>
      </div>

      <div className="tbc-bar-bg">
        <motion.div className="tbc-bar-fill"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${usedPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }} />
      </div>
      <div className="tbc-bar-label">
        {usedPct.toFixed(1)}% used &nbsp;|&nbsp;
        ₹{team.remainingBudget?.toLocaleString()} left
      </div>

      <div className="tbc-players-row">
        {team.players?.slice(0, 8).map(p => (
          <div key={p.playerId} className="tbc-player-dot"
            title={`${p.playerName} — ₹${p.soldPrice}`}>
            {p.photoPath
              ? <img src={`/${p.photoPath}`} alt={p.playerName} />
              : <span>{p.playerName?.charAt(0)}</span>}
          </div>
        ))}
        {(team.playerCount || 0) > 8 && (
          <div className="tbc-more">+{team.playerCount - 8}</div>
        )}
      </div>
    </div>
  )
}