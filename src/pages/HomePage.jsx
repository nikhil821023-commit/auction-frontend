import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout, isLoggedIn } = useAuthStore()

  return (
    <div className="home-bg">
      {/* Top right nav area */}
      <div className="hp-nav-ctas" style={{ position: "absolute", top: 24, right: 32, display: "flex", gap: 18 }}>
        {isLoggedIn() ? (
          <div className="hp-user-row" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="hp-user-badge" style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="hp-user-av" style={{
                background: "#ececee", fontWeight: 700, borderRadius: "50%", width: 34,
                height: 34, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
              <span className="hp-user-name">{user?.name}</span>
            </div>
            <motion.button className="hp-nav-ghost"
              onClick={() => { logout(); navigate('/auth') }}
              whileTap={{ scale: 0.97 }}>
              Logout
            </motion.button>
          </div>
        ) : (
          <>
            <motion.button className="hp-nav-ghost"
              onClick={() => navigate('/auth')}
              whileTap={{ scale: 0.97 }}>
              Login
            </motion.button>
            <motion.button className="hp-nav-solid"
              onClick={() => navigate('/auth')}
              whileTap={{ scale: 0.97 }}>
              Host Free →
            </motion.button>
          </>
        )}
      </div>

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
          <motion.button className="btn-outline"
            onClick={() => navigate('/my-tournaments')}
            whileTap={{ scale: 0.97 }}>
            📋 My Tournaments
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}