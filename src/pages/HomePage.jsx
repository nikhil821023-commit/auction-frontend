import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-bg">
      <motion.div
        className="home-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="home-logo">🏏</div>
        <h1 className="home-title">AuctionX</h1>
        <p className="home-sub">Live Player Auction Platform</p>

        <div className="home-buttons">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="btn-primary"
            onClick={() => navigate('/organizer/setup')}
          >
            🎯 Organizer — Create Tournament
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="btn-secondary"
            onClick={() => navigate('/team/register')}
          >
            🧢 Captain — Register Team
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}