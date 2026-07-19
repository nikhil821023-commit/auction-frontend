// Add to imports:
import { useNavigate } from 'react-router-dom'

// Add button in hero section after "← Live Dashboard":
<motion.button className="btn-accent"
  onClick={() => navigate(`/feedback/${tid}`)}
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.96 }}>
  📝 Give Feedback
</motion.button>