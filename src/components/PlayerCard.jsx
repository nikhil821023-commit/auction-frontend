import { motion } from 'framer-motion'

const tierColors = {
  PLATINUM: '#e5c100', GOLD: '#f97316',
  SILVER: '#94a3b8',   BRONZE: '#b45309'
}

export default function PlayerCard({ player, currentBid, compact = false }) {
  if (!player) return null
  const tc = tierColors[player.playerTier] || '#888'

  return (
    <motion.div
      className={`player-reveal-card ${compact ? 'compact' : ''}`}
      style={{ borderColor: tc }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}>

      <div className="tier-ribbon" style={{ background: tc }}>
        {player.playerTier}
      </div>

      <div className="player-photo-wrap">
        {player.playerPhotoPath
          ? <img src={`/${player.playerPhotoPath}`} alt={player.playerName} />
          : <div className="player-avatar">{player.playerName?.charAt(0)}</div>
        }
      </div>

      <div className="player-card-info">
        <h2 className="player-card-name">{player.playerName}</h2>
        <span className="player-card-role">{player.playerRole}</span>
        <div className="player-stats-row">
          {player.matches  && <span>🎯 {player.matches}M</span>}
          {player.average  && <span>📊 Avg {player.average}</span>}
          {player.strikeRate && <span>⚡ SR {player.strikeRate}</span>}
        </div>
        <div className="base-price-tag">
          Base ₹{player.basePrice?.toLocaleString()}
        </div>
        {currentBid && (
          <motion.div className="current-bid-tag"
            key={currentBid}
            initial={{ scale:1.3 }} animate={{ scale:1 }}>
            Current ₹{currentBid?.toLocaleString()}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}