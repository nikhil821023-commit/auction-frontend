import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { placeBid } from '../api/auctionApi'
import toast from 'react-hot-toast'

export default function BidPanel({
  teams = [],
  teamsLoading = false,
  teamsError = '',
  onRetryTeams,
  phase,
  tournamentId,
  bidIncrement = 50,
  currentBid = 0,
  basePrice = 0,
  hasBids            // optional: true once at least one bid exists (recommended)
}) {
  const [selected, setSelected]     = useState(null)
  const [customAmt, setCustomAmt]   = useState('')
  const [inputMode, setInputMode]   = useState('auto')
  const [submitting, setSubmitting] = useState(false)

  // ✅ When a new player is revealed / bidding opens, reset the panel so the
  // default amount is the base price (auto mode = base price on first bid).
  useEffect(() => {
    if (phase === 'BIDDING' || phase === 'PLAYER_REVEAL') {
      setSelected(null)
      setCustomAmt('')
      setInputMode('auto')
    }
  }, [phase, basePrice])

  if (phase !== 'BIDDING') return null

  const current = currentBid ?? 0

  // ✅ First bid = nobody has bid yet. Base price itself is a valid first bid.
  // If the parent passes `hasBids`, use it (exact). Otherwise infer from the
  // displayed bid being empty or still sitting at the base price.
  const isFirstBid = hasBids !== undefined
    ? !hasBids
    : (!current || current <= basePrice)

  // First bid -> base price. Later bids -> current + increment.
  const nextAutoBid = isFirstBid ? basePrice : current + bidIncrement

  // Lowest amount accepted for a custom bid
  const minBid = isFirstBid ? basePrice : current + 1

  // ✅ Quick bid amounts. Base price is only offered while it is still a valid
  // (first) bid; afterwards the options start from the next increment.
  const quickAmounts = (isFirstBid
    ? [
        basePrice,
        basePrice + bidIncrement,
        basePrice + bidIncrement * 2,
        basePrice + bidIncrement * 5
      ]
    : [
        current + bidIncrement,
        current + bidIncrement * 2,
        current + bidIncrement * 5,
        current + bidIncrement * 10
      ]
  ).filter(v => v > 0)

  // Amount that will actually be submitted
  const effectiveAmount = inputMode === 'manual' && customAmt
    ? parseFloat(customAmt) || 0
    : nextAutoBid

  const handleSelectTeam = (team) => {
    setSelected(team)
    setCustomAmt('')
    setInputMode('auto')
  }

  const handleQuickBid = (amt) => {
    if (amt === nextAutoBid) {
      setInputMode('auto')
      setCustomAmt('')
    } else {
      setInputMode('manual')
      setCustomAmt(String(amt))
    }
  }

  const handleSubmitBid = async () => {
    if (!selected) {
      toast.error('Select a team first')
      return
    }

    const amount = inputMode === 'manual'
      ? parseFloat(customAmt)
      : nextAutoBid

    if (isNaN(amount)) {
      toast.error('Enter a valid amount')
      return
    }

    if (isFirstBid) {
      // First bid — must be >= base price (equal is fine)
      if (amount < basePrice) {
        toast.error(`Minimum bid is ₹${basePrice.toLocaleString()} (base price)`)
        return
      }
    } else {
      // Later bids — must be strictly higher than current
      if (amount <= current) {
        toast.error(`Bid must be higher than ₹${current.toLocaleString()}`)
        return
      }
    }

    setSubmitting(true)
    try {
      await placeBid(tournamentId, {
        teamId:           selected.id || selected.teamId,
        captainName:      selected.captainName,
        teamName:         selected.teamName,
        teamColor:        selected.teamColor,
        bidAmount:        amount,
        useAutoIncrement: false,
        bidMode:          'ORGANIZER_CONTROLLED'
      })
      toast.success(`✅ ₹${amount.toLocaleString()} — ${selected.captainName}`)
      setSelected(null)
      setCustomAmt('')
      setInputMode('auto')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bid failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (teamsLoading) {
    return (
      <div className="bid-panel-v2">
        <div className="bp-header">
          <span className="bp-title">🎙️ ORGANIZER BID PANEL</span>
        </div>
        <div className="bp-teams-loading">
          <div className="bp-loading-spinner" />
          <span>Loading teams...</span>
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────
  if (teamsError || teams.length === 0) {
    return (
      <div className="bid-panel-v2">
        <div className="bp-header">
          <span className="bp-title">🎙️ ORGANIZER BID PANEL</span>
        </div>
        <div className="bp-teams-error">
          <span>👥 {teamsError || 'No teams found'}</span>
          {onRetryTeams && (
            <motion.button className="btn-accent bp-retry-btn"
              onClick={onRetryTeams} whileTap={{ scale: 0.97 }}>
              🔄 Retry
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  // ── Main panel ────────────────────────────────────────────────────
  return (
    <div className="bid-panel-v2">

      <div className="bp-header">
        <span className="bp-title">🎙️ ORGANIZER BID PANEL</span>
        <span className="bp-subtitle">Select captain who shouted the bid</span>
      </div>

      {/* Current / Next auto bid */}
      <div className="bp-current-bar">
        <span className="bp-current-label">{isFirstBid ? 'Base price' : 'Current'}</span>
        <span className="bp-current-amount">
          ₹{(isFirstBid ? basePrice : current).toLocaleString()}
        </span>
        <span className="bp-next-label">{isFirstBid ? 'First bid' : 'Next auto'}</span>
        <span className="bp-next-amount">₹{nextAutoBid.toLocaleString()}</span>
      </div>

      {/* Captain grid */}
      <div className="bp-captains-grid">
        {teams.map((team, i) => {
          const teamId     = team.id || team.teamId
          const isSelected = selected?.id === teamId || selected?.teamId === teamId
          const budget     = team.remainingBudget ?? team.totalBudget ?? 0
          const canAfford  = budget >= nextAutoBid

          return (
            <motion.button
              key={teamId}
              className={`bp-captain-btn ${isSelected ? 'selected' : ''} ${!canAfford ? 'broke' : ''}`}
              style={{ '--tc': team.teamColor || '#e63946' }}
              onClick={() => canAfford && handleSelectTeam(team)}
              title={!canAfford ? `₹${budget.toLocaleString()} remaining — cannot afford ₹${nextAutoBid.toLocaleString()}` : ''}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={canAfford ? { scale: 1.02 } : {}}
              whileTap={canAfford ? { scale: 0.97 } : {}}>

              <div className="bp-btn-colorbar"
                style={{ background: team.teamColor || '#e63946' }} />

              <div className="bp-btn-body">
                <span className="bp-btn-captain">{team.captainName}</span>
                <span className="bp-btn-team">{team.teamName}</span>
                <span className={`bp-btn-budget ${!canAfford ? 'low' : ''}`}>
                  ₹{budget.toLocaleString()}
                  {!canAfford && ' ⚠️'}
                </span>
              </div>

              {isSelected && (
                <motion.div className="bp-selected-tick"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}>✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Confirm panel */}
      <AnimatePresence>
        {selected && (
          <motion.div className="bp-confirm-panel"
            style={{ borderColor: selected.teamColor || '#e63946' }}
            initial={{ opacity: 0, y: 16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}>

            <div className="bp-confirm-header">
              <div className="bp-confirm-dot"
                style={{ background: selected.teamColor }} />
              <span className="bp-confirm-name">{selected.captainName}</span>
              <span className="bp-confirm-team">— {selected.teamName}</span>
              <button className="bp-cancel-btn"
                onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Quick bid buttons */}
            <div className="bp-quick-bids">
              {quickAmounts.map((amt, i) => {
                const selectedBudget =
                  selected.remainingBudget ?? selected.totalBudget ?? 0
                const tooExpensive = amt > selectedBudget

                return (
                  <motion.button
                    key={amt}
                    className={`bp-quick-btn ${
                      effectiveAmount === amt ? 'active' : ''} ${
                      tooExpensive ? 'disabled' : ''}`}
                    disabled={tooExpensive}
                    onClick={() => handleQuickBid(amt)}
                    whileTap={tooExpensive ? {} : { scale: 0.95 }}>
                    {isFirstBid && i === 0
                      ? `₹${amt.toLocaleString()} (Base)`
                      : `₹${amt.toLocaleString()}`}
                  </motion.button>
                )
              })}
            </div>

            {/* Amount mode toggle */}
            <div className="bp-mode-toggle">
              <button
                className={`bp-mode-btn ${inputMode === 'auto' ? 'active' : ''}`}
                onClick={() => { setInputMode('auto'); setCustomAmt('') }}>
                {isFirstBid
                  ? `⚡ Base price = ₹${nextAutoBid.toLocaleString()}`
                  : `⚡ Auto +₹${bidIncrement} = ₹${nextAutoBid.toLocaleString()}`}
              </button>
              <button
                className={`bp-mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
                onClick={() => setInputMode('manual')}>
                ✏️ Custom Amount
              </button>
            </div>

            {/* Manual input */}
            <AnimatePresence>
              {inputMode === 'manual' && (
                <motion.div className="bp-manual-row"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}>
                  <span className="bp-rupee">₹</span>
                  <input
                    type="number"
                    className="bp-amount-input"
                    placeholder={`Min ₹${minBid}`}
                    value={customAmt}
                    onChange={e => setCustomAmt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitBid()}
                    autoFocus
                    min={minBid}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final amount preview */}
            <div className="bp-final-amount">
              <span className="bp-final-label">Bid Amount</span>
              <span className="bp-final-value"
                style={{ color: selected.teamColor || '#e63946' }}>
                ₹{effectiveAmount.toLocaleString()}
              </span>
            </div>

            {/* Submit */}
            <motion.button
              className="bp-submit-btn"
              style={{ background: selected.teamColor || '#e63946' }}
              onClick={handleSubmitBid}
              disabled={submitting}
              whileTap={{ scale: 0.97 }}>
              {submitting
                ? '⏳ Placing bid...'
                : `🔨 CONFIRM — ${selected.captainName.toUpperCase()}`}
            </motion.button>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
