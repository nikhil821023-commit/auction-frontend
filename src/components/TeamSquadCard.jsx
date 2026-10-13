import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { playerImageUrl } from '../utils/imageUrl'
 
const TIER_COLORS = {
  PLATINUM: '#e5c100',
  GOLD:     '#f97316',
  SILVER:   '#94a3b8',
  BRONZE:   '#b45309',
}
 
const ROLE_ICONS = {
  'Batsman':      '🏏',
  'Bowler':       '⚡',
  'All-Rounder':  '🌟',
  'WK-Batsman':   '🧤',
  'Right Hand Batsman': '🏏',
  'Left Hand Batsman':  '🏏',
}
 
export default function TeamSquadCard({ team, maxPlayers = 11, rank = 0 }) {
  const [expanded, setExpanded] = useState(false)
 
  const bought      = team.playersBought  ?? team.playerCount ?? 0
  const needed      = team.playersNeeded  ?? Math.max(0, maxPlayers - bought)
  const max         = team.maxPlayers     ?? maxPlayers
  const progress    = max > 0 ? (bought / max) * 100 : 0
  const budgetPct   = team.budgetUsedPercent ?? 0
  const remaining   = team.remainingBudget ?? 0
  const spent       = team.spentBudget     ?? 0
  const total       = team.totalBudget     ?? 0
  const color       = team.teamColor       || '#888'
 
  const isComplete  = bought >= max
  const isLow       = needed <= 2 && !isComplete
  const budgetRisk  = remaining < (needed * 5) && needed > 0
 
  return (
    <motion.div
      className="tsq-card"
      style={{ '--tc': color }}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}>
 
      {/* Top color bar */}
      <div className="tsq-top-bar" style={{ background: color }} />
 
      {/* Header */}
      <div className="tsq-header">
        <div className="tsq-header-left">
          <div className="tsq-rank">#{rank + 1}</div>
          <div>
            <div className="tsq-team-name" style={{ color }}>
              {team.teamName}
            </div>
            <div className="tsq-captain">{team.captainName}</div>
          </div>
        </div>
 
        {/* Squad status badge */}
        <div className={`tsq-status-badge ${
          isComplete ? 'complete' :
          isLow      ? 'warning'  : 'active'}`}>
          {isComplete
            ? '✅ Squad Full'
            : `${bought}/${max} players`}
        </div>
      </div>
 
      {/* Squad progress bar */}
      <div className="tsq-squad-section">
        <div className="tsq-squad-label-row">
          <span className="tsq-label">Squad Progress</span>
          <span className="tsq-squad-fraction">
            <span className="tsq-bought">{bought}</span>
            <span className="tsq-divider">/</span>
            <span className="tsq-max">{max}</span>
          </span>
        </div>
 
        {/* Player slot dots */}
        <div className="tsq-slots">
          {Array.from({ length: max }, (_, i) => (
            <motion.div
              key={i}
              className={`tsq-slot ${i < bought ? 'filled' : 'empty'}`}
              style={i < bought ? { background: color } : {}}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02 }}
            />
          ))}
        </div>
 
        {/* Progress bar */}
        <div className="tsq-prog-bg">
          <motion.div
            className="tsq-prog-fill"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: progress + '%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
 
        {/* Still needed */}
        {!isComplete && (
          <div className={`tsq-needed ${isLow ? 'low' : ''}`}>
            {needed === 0
              ? '✅ Squad complete!'
              : `${needed} more player${needed > 1 ? 's' : ''} needed`}
            {budgetRisk && needed > 0 && (
              <span className="tsq-budget-risk">
                · ⚠️ Low budget
              </span>
            )}
          </div>
        )}
      </div>
 
      {/* Budget section */}
      <div className="tsq-budget-section">
        <div className="tsq-budget-label-row">
          <span className="tsq-label">Budget</span>
          <span className="tsq-budget-pct"
            style={{ color: budgetPct > 80 ? '#ef4444' : color }}>
            {budgetPct}% used
          </span>
        </div>
 
        <div className="tsq-budget-bar-bg">
          <motion.div
            className="tsq-budget-bar-fill"
            style={{
              background: budgetPct > 80 ? '#ef4444'
                        : budgetPct > 60 ? '#f59e0b'
                        : color
            }}
            initial={{ width: 0 }}
            animate={{ width: budgetPct + '%' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
 
        <div className="tsq-budget-nums">
          <div className="tsq-budget-item">
            <span>💰 Spent</span>
            <strong>₹{Number(spent).toLocaleString()}</strong>
          </div>
          <div className="tsq-budget-item">
            <span>🏦 Remaining</span>
            <strong style={{
              color: remaining < (needed * 5) && needed > 0
                     ? '#ef4444' : '#22c55e'
            }}>
              ₹{Number(remaining).toLocaleString()}
            </strong>
          </div>
          {needed > 0 && total > 0 && (
            <div className="tsq-budget-item">
              <span>📊 Avg/Player left</span>
              <strong>
                ₹{needed > 0
                   ? Math.floor(remaining / needed).toLocaleString()
                   : '—'}
              </strong>
            </div>
          )}
        </div>
      </div>
 
      {/* Recent players — expand/collapse */}
      {team.recentPlayers?.length > 0 && (
        <div className="tsq-players-section">
          <button
            className="tsq-expand-btn"
            onClick={() => setExpanded(v => !v)}>
            <span>🏏 Squad ({bought} players)</span>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}>
              ▼
            </motion.span>
          </button>
 
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="tsq-players-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}>
                {team.recentPlayers.map((p, i) => (
                  <motion.div
                    key={i}
                    className="tsq-player-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}>
 
                    <PlayerThumb player={p} />
 
                    <div className="tsq-pr-info">
                      <span className="tsq-pr-name">{p.name}</span>
                      <span className="tsq-pr-role">
                        {ROLE_ICONS[p.role] || '🏏'} {p.role}
                      </span>
                    </div>
 
                    <div className="tsq-pr-right">
                      <span
                        className="tsq-pr-tier"
                        style={{
                          color: TIER_COLORS[p.tier] || '#888',
                          borderColor:
                            (TIER_COLORS[p.tier] || '#888') + '44'
                        }}>
                        {p.tier}
                      </span>
                      <span className="tsq-pr-price">
                        ₹{Number(p.soldPrice || 0).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
 
    </motion.div>
  )
}
 
function PlayerThumb({ player }) {
  const [err, setErr] = useState(false)
  const src = playerImageUrl(player?.photo || player?.photoPath)
 
  if (src && !err) {
    return (
      <img
        src={src}
        alt={player.name}
        className="tsq-pr-photo"
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div className="tsq-pr-avatar">
      {player?.name?.charAt(0)?.toUpperCase()}
    </div>
  )
}
