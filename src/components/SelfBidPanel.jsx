import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { selfBid, getCaptainToken } from '../api/auctionApi'
import toast from 'react-hot-toast'

/**
 * MODE 2 — CAPTAIN_SELF
 * Captain sees current bid, their budget, and places their own bid.
 * Quick-bid buttons + custom amount input.
 */
export default function SelfBidPanel({
  tournamentId,
  team,
  currentBid = 0,
  basePrice = 0,
  phase,
  bidIncrement = 50,
  isHighBidder = false
}) {
  const [token, setToken]           = useState(null)
  const [customAmt, setCustomAmt]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastBid, setLastBid]       = useState(null)
  const [showCustom, setShowCustom] = useState(false)

  const remaining = team?.remainingBudget ?? team?.totalBudget ?? 0
  const minBid    = Math.max(currentBid + 1, basePrice)

  // Quick-bid increments above current
  const quickAmounts = [
    currentBid + bidIncrement,
    currentBid + bidIncrement * 2,
    currentBid + bidIncrement * 5,
    currentBid + bidIncrement * 10,
  ].filter(a => a <= remaining)

  // Fetch captain token on mount
  useEffect(() => {
    if (!team?.id && !team?.teamId) return
    const tid2 = team?.id || team?.teamId
    getCaptainToken(tournamentId, tid2)
      .then(r => setToken(r.data.token))
      .catch(() => setToken('fallback'))
  }, [tournamentId, team])

  const handleBid = async (amount) => {
    if (!amount || amount <= currentBid) {
      toast.error(`Bid must be above ₹${currentBid}`)
      return
    }
    if (amount < basePrice) {
      toast.error(`Bid cannot be below base price ₹${basePrice}`)
      return
    }
    if (amount > remaining) {
      toast.error(`Insufficient budget. You have ₹${remaining}`)
      return
    }

    setSubmitting(true)
    try {
      await selfBid(tournamentId, {
        teamId:       team.id || team.teamId,
        captainName:  team.captainName,
        teamName:     team.teamName,
        teamColor:    team.teamColor,
        bidAmount:    amount,
        useAutoIncrement: false,
        bidMode:      'CAPTAIN_SELF',
        captainToken: token
      })
      setLastBid(amount)
      setCustomAmt('')
      setShowCustom(false)
      toast.success(`🎯 Bid ₹${amount.toLocaleString()} placed!`, { duration: 2000 })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bid failed', { duration: 4000 })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCustomSubmit = () => {
    const amount = parseFloat(customAmt)
    if (isNaN(amount)) {
      toast.error('Enter a valid amount')
      return
    }
    handleBid(amount)
  }

  if (phase !== 'BIDDING') return null

  return (
    <div className="self-bid-panel">

      {/* Status bar */}
      <div className={`sbp-status-bar ${isHighBidder ? 'leading' : 'trailing'}`}>
        {isHighBidder ? (
          <motion.div className="sbp-leading"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}>
            🏆 YOU ARE THE HIGHEST BIDDER
          </motion.div>
        ) : (
          <div className="sbp-trailing">
            ⚔️ {currentBid > 0
              ? `You've been outbid — Current: ₹${currentBid.toLocaleString()}`
              : 'Place your bid now!'}
          </div>
        )}
      </div>

      {/* Budget display */}
      <div className="sbp-budget-row">
        <div className="sbp-budget-item">
          <span className="sbp-budget-label">Your Budget</span>
          <span className="sbp-budget-value">
            ₹{remaining.toLocaleString()}
          </span>
        </div>
        <div className="sbp-budget-divider" />
        <div className="sbp-budget-item">
          <span className="sbp-budget-label">Base Price</span>
          <span className="sbp-budget-value dim">
            ₹{basePrice.toLocaleString()}
          </span>
        </div>
        <div className="sbp-budget-divider" />
        <div className="sbp-budget-item">
          <span className="sbp-budget-label">Min Bid</span>
          <span className="sbp-budget-value accent">
            ₹{minBid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Quick bid buttons */}
      {quickAmounts.length > 0 && (
        <div className="sbp-quick-section">
          <span className="sbp-section-label">⚡ Quick Bid</span>
          <div className="sbp-quick-grid">
            {quickAmounts.map((amt, i) => (
              <motion.button
                key={amt}
                className={`sbp-quick-btn ${i === 0 ? 'primary' : ''}`}
                style={{ '--tc': team?.teamColor || '#e63946' }}
                onClick={() => handleBid(amt)}
                disabled={submitting}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}>
                <span className="sbp-quick-amount">
                  ₹{amt.toLocaleString()}
                </span>
                <span className="sbp-quick-delta">
                  +₹{(amt - currentBid).toLocaleString()}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Custom amount */}
      <div className="sbp-custom-section">
        <button
          className="sbp-custom-toggle"
          onClick={() => setShowCustom(v => !v)}>
          {showCustom ? '▲ Hide' : '✏️ Enter Custom Amount'}
        </button>

        <AnimatePresence>
          {showCustom && (
            <motion.div className="sbp-custom-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}>
              <span className="sbp-rupee-sign">₹</span>
              <input
                type="number"
                className="sbp-custom-input"
                placeholder={`Min ₹${minBid}`}
                value={customAmt}
                min={minBid}
                max={remaining}
                onChange={e => setCustomAmt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                autoFocus
              />
              <motion.button
                className="sbp-custom-submit"
                style={{ background: team?.teamColor || '#e63946' }}
                onClick={handleCustomSubmit}
                disabled={submitting || !customAmt}
                whileTap={{ scale: 0.97 }}>
                {submitting ? '⏳' : 'BID'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Last bid confirmation */}
      <AnimatePresence>
        {lastBid && (
          <motion.div className="sbp-last-bid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            key={lastBid}>
            ✅ Your last bid: ₹{lastBid.toLocaleString()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No budget warning */}
      {quickAmounts.length === 0 && remaining < minBid && (
        <div className="sbp-no-budget">
          ⚠️ Insufficient budget to bid on this player
        </div>
      )}

    </div>
  )
}