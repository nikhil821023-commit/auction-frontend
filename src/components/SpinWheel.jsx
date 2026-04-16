import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function SpinWheel({ players = [], isSpinning, onSpin }) {
  const [rotation, setRotation]   = useState(0)
  const [spinning, setSpinning]   = useState(false)
  const prevSpinning              = useRef(false)

  useEffect(() => {
    if (isSpinning && !prevSpinning.current) {
      setSpinning(true)
      const spins = 5 + Math.random() * 5
      setRotation(r => r + spins * 360 + Math.random() * 360)
      setTimeout(() => setSpinning(false), 3200)
    }
    prevSpinning.current = isSpinning
  }, [isSpinning])

  const count = Math.max(players.length, 8)
  const segAngle = 360 / count
  const colors = ['#e63946','#2a9d8f','#e9c46a','#f4a261','#264653',
                  '#6d6875','#b5e48c','#48cae4']

  return (
    <div className="spin-wheel-wrap">
      <div className="wheel-pointer">▼</div>

      <motion.div
        className="wheel-disc"
        animate={{ rotate: rotation }}
        transition={{ duration: 3.2, ease: [0.17, 0.67, 0.21, 0.98] }}>
        <svg viewBox="0 0 300 300" width="300" height="300">
          {Array.from({ length: count }, (_, i) => {
            const startAngle = (i * segAngle - 90) * (Math.PI / 180)
            const endAngle   = ((i + 1) * segAngle - 90) * (Math.PI / 180)
            const x1 = 150 + 140 * Math.cos(startAngle)
            const y1 = 150 + 140 * Math.sin(startAngle)
            const x2 = 150 + 140 * Math.cos(endAngle)
            const y2 = 150 + 140 * Math.sin(endAngle)
            const mx = 150 + 90 * Math.cos((startAngle + endAngle) / 2)
            const my = 150 + 90 * Math.sin((startAngle + endAngle) / 2)
            const name = players[i]?.name || `P${i+1}`
            return (
              <g key={i}>
                <path
                  d={`M150,150 L${x1},${y1} A140,140 0 0,1 ${x2},${y2} Z`}
                  fill={colors[i % colors.length]}
                  stroke="#1a1a2e" strokeWidth="1.5"
                />
                <text x={mx} y={my} fill="white"
                  fontSize="10" textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${i * segAngle + segAngle/2}, ${mx}, ${my})`}>
                  {name.slice(0, 10)}
                </text>
              </g>
            )
          })}
          <circle cx="150" cy="150" r="22" fill="#1a1a2e" stroke="#e63946" strokeWidth="3" />
          <text x="150" y="154" fill="white" fontSize="12"
            textAnchor="middle" dominantBaseline="middle">🏏</text>
        </svg>
      </motion.div>

      <motion.button
        className="btn-spin"
        onClick={onSpin}
        disabled={spinning}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}>
        {spinning ? '🌀 Spinning...' : '🎰 SPIN'}
      </motion.button>
    </div>
  )
}