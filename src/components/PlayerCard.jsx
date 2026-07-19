import { useState } from 'react'
import { motion } from 'framer-motion'
import { playerImageUrl } from '../utils/imageUrl'  // ✅ correct import

const tierColors = {
  PLATINUM: '#e5c100', GOLD: '#f97316',
  SILVER: '#94a3b8',   BRONZE: '#b45309'
}

export default function PlayerCard({ player, currentBid, compact = false }) {
  const [imgError, setImgError] = useState(false)
  if (!player) return null

  const tc        = tierColors[player.playerTier] || tierColors[player.tier] || '#888'
  const photoPath = player.playerPhotoPath || player.photoPath
  const imgSrc    = playerImageUrl(photoPath)
  const tierLabel = player.playerTier || player.tier

  return (
    <motion.div
      className={`player-reveal-card ${compact ? 'compact' : ''}`}
      style={{ borderColor: tc }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}>

      <div className="tier-ribbon" style={{ background: tc }}>
        {tierLabel}
      </div>

      <div className="player-photo-wrap">
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={player.playerName || player.name}
            onError={() => setImgError(true)}
            className="player-card-photo"
          />
        ) : (
          <div className="player-avatar" style={{ borderColor: tc }}>
            {(player.playerName || player.name)?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="player-card-info">
        <h2 className="player-card-name">
          {player.playerName || player.name}
        </h2>
        <span className="player-card-role">
          {player.playerRole || player.role}
        </span>

        <div className="player-stats-row">
          {player.matches    && <span>🎯 {player.matches}M</span>}
          {player.average    && <span>📊 Avg {player.average}</span>}
          {player.strikeRate && <span>⚡ SR {player.strikeRate}</span>}
        </div>

        <div className="base-price-tag">
          Base ₹{player.basePrice?.toLocaleString()}
        </div>

        {currentBid != null && (
          <motion.div className="current-bid-tag"
            key={currentBid}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}>
            CURRENT ₹{Number(currentBid).toLocaleString()}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}