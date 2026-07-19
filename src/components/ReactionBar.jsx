import { motion, AnimatePresence } from 'framer-motion'

export default function ReactionBar({ emojis, counts = {}, onReact, disabled }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0)

  return (
    <div className="reaction-bar">
      <div className="rb-title">React to the auction!</div>

      <div className="rb-emojis">
        {emojis.map(({ e, label }) => (
          <motion.button
            key={e}
            className={`rb-emoji-btn ${disabled ? 'disabled' : ''}`}
            title={label}
            onClick={() => !disabled && onReact(e)}
            whileHover={!disabled ? { scale: 1.25, y: -4 } : {}}
            whileTap={!disabled ? { scale: 0.9 } : {}}>
            <span className="rb-emoji">{e}</span>
            {counts[e] > 0 && (
              <motion.span
                className="rb-count"
                key={counts[e]}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}>
                {counts[e]}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      {total > 0 && (
        <div className="rb-total">{total} reactions</div>
      )}
    </div>
  )
}