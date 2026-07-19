import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playerImageUrl } from '../utils/imageUrl'

const tierColors = {
  PLATINUM: '#e5c100', GOLD: '#f97316',
  SILVER: '#94a3b8',   BRONZE: '#b45309'
}
const tierOrder = { PLATINUM: 0, GOLD: 1, SILVER: 2, BRONZE: 3 }

export default function SquadCard({ squad, highlight = false, onShare }) {
  const [expanded, setExpanded] = useState(highlight)
  const [filter, setFilter]     = useState('ALL')

  const roles = ['ALL', ...new Set(squad.players?.map(p => p.role) || [])]

  const filtered = filter === 'ALL'
    ? squad.players
    : squad.players?.filter(p => p.role === filter)

  const sorted = [...(filtered || [])].sort(
    (a, b) => (tierOrder[a.tier] ?? 4) - (tierOrder[b.tier] ?? 4)
  )

  const usedPct = squad.budgetUsedPct || 0
  const barColor = usedPct > 85 ? '#ef4444'
                 : usedPct > 60 ? '#f59e0b'
                 : '#22c55e'

  return (
    <div className={`squad-card ${highlight ? 'highlighted' : ''}`}
      style={{ '--tc': squad.teamColor || '#e63946' }}>

      {/* ── Card header ─────────────────────────────────── */}
      <div className="sc-header"
        style={{ borderBottom: `3px solid ${squad.teamColor}` }}>

        <div className="sc-team-row">
          <div className="sc-color-swatch"
            style={{ background: squad.teamColor }} />
          <div className="sc-team-info">
            <h3 className="sc-team-name"
              style={{ color: squad.teamColor }}>
              {squad.teamName}
            </h3>
            <span className="sc-captain">👤 {squad.captainName}</span>
          </div>
          {highlight && (
            <div className="sc-champion-badge">🥇 CHAMPION</div>
          )}
        </div>

        {/* Budget bar */}
        <div className="sc-budget-info">
          <div className="sc-budget-row">
            <span>₹{Number(squad.spentBudget || 0).toLocaleString()} spent</span>
            <span className="sc-budget-remaining">
              ₹{Number(squad.remainingBudget || 0).toLocaleString()} left
            </span>
          </div>
          <div className="sc-bar-bg">
            <motion.div className="sc-bar-fill"
              style={{ background: barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 0.7 }} />
          </div>
          <div className="sc-bar-labels">
            <span>{usedPct}% used</span>
            <span>Total ₹{Number(squad.totalBudget || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Tier chips */}
        <div className="sc-tier-chips">
          {Object.entries(squad.tierBreakdown || {}).map(([tier, count]) => (
            <span key={tier} className="sc-tier-chip"
              style={{ background: tierColors[tier] + '22',
                       color: tierColors[tier],
                       border: `1px solid ${tierColors[tier]}55` }}>
              {tier} ×{count}
            </span>
          ))}
        </div>

        {/* Action row */}
        <div className="sc-actions">
          <button className="sc-expand-btn"
            onClick={() => setExpanded(v => !v)}>
            {expanded ? '▲ Collapse' : `▼ View ${squad.playerCount} Players`}
          </button>
          <button className="sc-share-btn" onClick={onShare}>
            📤 Share
          </button>
        </div>
      </div>

      {/* ── Expanded player list ─────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div className="sc-players-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}>

            {/* Role filter */}
            {roles.length > 2 && (
              <div className="sc-role-filters">
                {roles.map(r => (
                  <button key={r}
                    className={`sc-role-btn ${filter === r ? 'active' : ''}`}
                    onClick={() => setFilter(r)}>
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Player list */}
            <div className="sc-player-list">
              {sorted?.map((p, i) => (
                <PlayerRow key={p.id || i} player={p} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlayerRow({ player, index }) {
  const [imgErr, setImgErr] = useState(false)
  const src = playerImageUrl(player.photo)
  const tc  = tierColors[player.tier] || '#888'

  return (
    <motion.div className="sc-player-row"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}>

      {/* Photo */}
      <div className="sc-player-photo"
        style={{ borderColor: tc }}>
        {src && !imgErr ? (
          <img src={src} alt={player.name}
            onError={() => setImgErr(true)} />
        ) : (
          <span>{player.name?.charAt(0)}</span>
        )}
      </div>

      {/* Info */}
      <div className="sc-player-details">
        <span className="sc-player-name">{player.name}</span>
        <span className="sc-player-role">{player.role}</span>
      </div>

      {/* Tier badge */}
      <span className="sc-player-tier"
        style={{ color: tc, borderColor: tc + '55' }}>
        {player.tier}
      </span>

      {/* Price */}
      <div className="sc-player-price-col">
        <span className="sc-sold-price">
          ₹{Number(player.soldPrice || 0).toLocaleString()}
        </span>
        <span className="sc-base-price">
          base ₹{Number(player.basePrice || 0).toLocaleString()}
        </span>
      </div>

    </motion.div>
  )
}