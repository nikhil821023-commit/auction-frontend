import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuctionSounds } from '../hooks/useAuctionSounds'

/**
 * Mute / unmute button for auction room.
 * Persists preference in localStorage.
 */
export default function SoundToggle() {
  const sounds = useAuctionSounds()

  const [muted, setMuted] = useState(() => {
    return localStorage.getItem('auctionx_muted') === 'true'
  })

  // Sync mute state into sound engine (runs whenever muted changes)
  useEffect(() => {
    sounds.setMuted(muted)
  }, [muted, sounds])

  const toggle = () => {
    const next = !muted
    setMuted(next)
    localStorage.setItem('auctionx_muted', String(next))

    // Play a test sound when unmuting so user knows it works
    if (!next) sounds.playBid()
  }

  return (
    <motion.button
      className={`sound-toggle ${muted ? 'muted' : 'active'}`}
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      <span className="sound-icon">{muted ? '🔇' : '🔊'}</span>
      <span className="sound-label">{muted ? 'Muted' : 'Sound On'}</span>
    </motion.button>
  )
}