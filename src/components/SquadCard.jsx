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

      {/* All CSS lives here so the component is fully self-contained */}
      <style>{`
        .squad-card {
          background: #12141c;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
          color: #e5e7eb;
          font-family: inherit;
        }

        .squad-card.highlighted {
          border-color: #e5c100;
          box-shadow: 0 0 0 1px rgba(229,193,0,0.4), 0 0 24px rgba(229,193,0,0.15);
        }

        .sc-header {
          padding: 16px;
        }

        .sc-team-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .sc-color-swatch {
          width: 10px;
          height: 34px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .sc-team-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .sc-team-name {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.3px;
        }

        .sc-captain {
          font-size: 12px;
          color: #94a3b8;
        }

        .sc-champion-badge {
          background: rgba(229,193,0,0.15);
          color: #e5c100;
          border: 1px solid rgba(229,193,0,0.4);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .sc-budget-info {
          margin-bottom: 12px;
        }

        .sc-budget-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
          color: #e5e7eb;
        }

        .sc-budget-remaining {
          color: #22c55e;
          font-weight: 600;
        }

        .sc-bar-bg {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .sc-bar-fill {
          height: 100%;
          border-radius: 999px;
        }

        .sc-bar-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .sc-tier-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }

        .sc-tier-chip {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 6px;
        }

        .sc-actions {
          display: flex;
          gap: 8px;
        }

        .sc-expand-btn,
        .sc-share-btn {
          flex: 1;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #e5e7eb;
          transition: background 0.15s ease;
        }

        .sc-expand-btn:hover,
        .sc-share-btn:hover {
          background: rgba(255,255,255,0.08);
        }

        .sc-share-btn {
          flex: 0 0 auto;
        }

        .sc-players-section {
          border-top: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .sc-role-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px 12px 0;
        }

        .sc-role-btn {
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sc-role-btn.active {
          background: var(--tc, #e63946);
          border-color: var(--tc, #e63946);
          color: #fff;
        }

        /* Player grid — ALL players visible at once, no scroll */
        .sc-player-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
          padding: 12px;
          max-height: none;
          overflow: visible;
          perspective: 800px;
        }

        .sc-player-tile {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 6px 8px;
          overflow: hidden;
          transform-style: preserve-3d;
        }

        .sc-tile-glow {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          pointer-events: none;
        }

        .sc-tile-name-mask {
          display: block;
          overflow: hidden;
          max-width: 100%;
          line-height: 1.2;
        }

        .sc-tile-tier {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border: 1px solid;
          border-radius: 4px;
        }

        .sc-tile-photo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
          background: rgba(255,255,255,0.05);
          font-weight: 700;
          font-size: 16px;
        }

        .sc-tile-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sc-tile-name {
          display: block;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sc-tile-role {
          font-size: 10px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .sc-tile-price {
          font-size: 11px;
          font-weight: 700;
          color: #22c55e;
        }

        .sc-tile-base-price {
          font-size: 9px;
          color: #64748b;
        }

        @media (max-width: 480px) {
          .sc-player-grid {
            grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
            gap: 8px;
          }
          .sc-tile-photo {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>

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

      {/* ── Expanded player grid ─────────────────────────── */}
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

            {/* Player grid — all players visible at once, no scrolling */}
            <div className="sc-player-grid">
              {sorted?.map((p, i) => (
                <PlayerTile key={p.id || i} player={p} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlayerTile({ player, index }) {
  const [imgErr, setImgErr] = useState(false)
  const src = playerImageUrl(player.photo)
  const tc  = tierColors[player.tier] || '#888'

  const stagger = index * 0.09

  return (
    <motion.div className="sc-player-tile"
      style={{ '--tier-color': tc }}
      initial={{ opacity: 0, y: 24, scale: 0.75, rotateX: -25 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{
        delay: stagger,
        type: 'spring',
        stiffness: 260,
        damping: 18
      }}>

      {/* Glow flash sweeping in on reveal */}
      <motion.span className="sc-tile-glow"
        style={{ background: `radial-gradient(circle, ${tc}55 0%, transparent 70%)` }}
        initial={{ opacity: 0.9, scale: 0.4 }}
        animate={{ opacity: 0, scale: 1.6 }}
        transition={{ delay: stagger, duration: 0.6, ease: 'easeOut' }} />

      {/* Tier badge, top corner */}
      <motion.span className="sc-tile-tier"
        style={{ color: tc, borderColor: tc + '55' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: stagger + 0.25, type: 'spring', stiffness: 400 }}>
        {player.tier}
      </motion.span>

      {/* Photo */}
      <motion.div className="sc-tile-photo"
        style={{ borderColor: tc }}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: stagger + 0.1, type: 'spring', stiffness: 300, damping: 15 }}>
        {src && !imgErr ? (
          <img src={src} alt={player.name}
            onError={() => setImgErr(true)} />
        ) : (
          <span>{player.name?.charAt(0)}</span>
        )}
      </motion.div>

      {/* Name — presentation-style reveal, slides up under a clipping mask */}
      <span className="sc-tile-name-mask">
        <motion.span className="sc-tile-name"
          initial={{ y: '110%' }}
          animate={{ y: '0%' }}
          transition={{ delay: stagger + 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          {player.name}
        </motion.span>
      </span>

      <motion.span className="sc-tile-role"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: stagger + 0.3, duration: 0.3 }}>
        {player.role}
      </motion.span>

      {/* Price */}
      <motion.span className="sc-tile-price"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: stagger + 0.35, duration: 0.3 }}>
        ₹{Number(player.soldPrice || 0).toLocaleString()}
      </motion.span>
      <motion.span className="sc-tile-base-price"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: stagger + 0.4, duration: 0.3 }}>
        base ₹{Number(player.basePrice || 0).toLocaleString()}
      </motion.span>
    </motion.div>
  )
}
