import { motion, AnimatePresence } from 'framer-motion'

export default function AuctionFeed({ feed = [], full = false }) {
  return (
    <div className={`auction-feed ${full ? 'full' : ''}`}>
      <div className="feed-title">📜 Activity Feed</div>
      <div className="feed-list">
        <AnimatePresence initial={false}>
          {feed.map((item, i) => (
            <motion.div
              key={`${item.playerName}-${item.timestamp}`}
              className={`feed-item ${item.event === 'SOLD' ? 'sold' : 'unsold'}`}
              initial={{ opacity:0, x:30 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0 }}
              transition={{ delay: i * 0.03 }}
              layout>
              <div className="feed-icon">
                {item.event === 'SOLD' ? '🔨' : '❌'}
              </div>
              <div className="feed-content">
                <span className="feed-player">{item.playerName}</span>
                {item.event === 'SOLD' && (
                  <span className="feed-team"
                    style={{ color: item.teamColor }}>
                    → {item.teamName}
                  </span>
                )}
                {item.event === 'SOLD' && (
                  <span className="feed-price">₹{item.soldPrice?.toLocaleString()}</span>
                )}
                {item.event === 'UNSOLD' && (
                  <span className="feed-unsold-tag">Unsold</span>
                )}
              </div>
              <div className="feed-tier tier-{item.playerTier?.toLowerCase()}">
                {item.playerTier}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}