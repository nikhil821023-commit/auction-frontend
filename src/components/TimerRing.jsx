import { motion } from 'framer-motion'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

export default function TimerRing({ remaining, total, isPaused }) {
  const pct  = total > 0 ? (remaining / total) * 100 : 0
  const isLow = remaining <= 10 && remaining > 0
  const color = isPaused ? '#f59e0b' : isLow ? '#ef4444' : '#22d3ee'

  return (
    <div className="timer-ring-wrap">
      <motion.div
        animate={isLow && !isPaused ? { scale:[1, 1.06, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}>
        <CircularProgressbar
          value={pct}
          text={isPaused ? '⏸' : `${remaining}s`}
          styles={buildStyles({
            textSize: '22px',
            pathColor: color,
            textColor: color,
            trailColor: '#1e293b',
            pathTransition: 'stroke-dashoffset 0.9s ease'
          })}
        />
      </motion.div>
      {isPaused && (
        <div className="paused-label">PAUSED</div>
      )}
    </div>
  )
}