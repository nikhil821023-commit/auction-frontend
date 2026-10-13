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
  hasBids,
  maxSquadSize = null,
}) {
  const [selected, setSelected]     = useState(null)
  const [customAmt, setCustomAmt]   = useState('')
  const [inputMode, setInputMode]   = useState('auto')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (phase === 'BIDDING' || phase === 'PLAYER_REVEAL') {
      setSelected(null)
      setCustomAmt('')
      setInputMode('auto')
    }
  }, [phase, basePrice])

  if (phase !== 'BIDDING') return null

  const current = currentBid ?? 0

  const isFirstBid = hasBids !== undefined
    ? !hasBids
    : (!current || current <= basePrice)

  // ── Smart Budget Cap ────────────────────────────────────────────
  const getSmartCap = (team) => {
    if (!team) return null

    if (!maxSquadSize || maxSquadSize <= 0) return null


    
    const squadSize   = maxSquadSize 
    const bought      = team.playersBought || team.squadCount || 0
    const stillNeeded = squadSize - bought
    const budget      = team.remainingBudget ?? team.totalBudget ?? 0

    if (stillNeeded <= 1) return null // last player — no cap
    if (!basePrice || basePrice <= 0) return null


    const reservedBudget = (stillNeeded - 1) * basePrice
    const maxBid         = budget - reservedBudget

    return {
      stillNeeded,
      reservedBudget,
      maxBid:   Math.max(maxBid, basePrice),
      isAtCap:  maxBid <= basePrice,
    }
  }

  // First bid → base price. Later bids → current + increment.
  const nextAutoBid = isFirstBid ? basePrice : current + bidIncrement

  // Lowest amount accepted for a custom bid
  const minBid = isFirstBid ? basePrice : current + 1

  // Quick amounts — filtered by cap
  const selectedCap = selected ? getSmartCap(selected) : null

  const quickAmounts = (isFirstBid
    ? [
        basePrice,
        basePrice + bidIncrement,
        basePrice + bidIncrement * 2,
        basePrice + bidIncrement * 5,
      ]
    : [
        current + bidIncrement,
        current + bidIncrement * 2,
        current + bidIncrement * 5,
        current + bidIncrement * 10,
      ]
  ).filter(v => v > 0 && (!selectedCap || v <= selectedCap.maxBid))

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
      if (amount < basePrice) {
        toast.error(`Minimum bid is ₹${basePrice} (base price)`)
        return
      }
    } else {
      if (amount <= current) {
        toast.error(`Bid must be higher than ₹${current.toLocaleString()}`)
        return
      }
    }

    // Smart budget cap validation
    const cap = getSmartCap(selected)
    if (cap && amount > cap.maxBid) {
      toast.error(
        `Budget cap! Max bid is ₹${Math.floor(cap.maxBid)}. ` +
        `You need ${cap.stillNeeded - 1} more players ` +
        `(₹${cap.reservedBudget} reserved at ₹${basePrice} each).`,
        { duration: 5000 }
      )
      return
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
        bidMode:          'ORGANIZER_CONTROLLED',
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

  // ── Loading ─────────────────────────────────────────────────────
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

  // ── Error ───────────────────────────────────────────────────────
  if (teamsError || teams.length === 0) {
    return (
      <div className="bid-panel-v2">
        <div className="bp-header">
          <span className="bp-title">🎙️ ORGANIZER BID PANEL</span>
        </div>
        <div className="bp-teams-error">
          <span>👥 {teamsError || 'No teams found'}</span>
          {onRetryTeams && (
            <motion.button
              className="btn-accent bp-retry-btn"
              onClick={onRetryTeams}
              whileTap={{ scale: 0.97 }}>
              🔄 Retry
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  // ── Main panel ──────────────────────────────────────────────────
  return (
    <div className="bid-panel-v2">

      {/* Header */}
      <div className="bp-header">
        <span className="bp-title">🎙️ ORGANIZER BID PANEL</span>
        <span className="bp-subtitle">Select captain who shouted the bid</span>
      </div>

      {/* Current / Next auto bid */}
      <div className="bp-current-bar">
        <span className="bp-current-label">
          {isFirstBid ? 'Base price' : 'Current'}
        </span>
        <span className="bp-current-amount">
          ₹{(isFirstBid ? basePrice : current).toLocaleString()}
        </span>
        <span className="bp-next-label">
          {isFirstBid ? 'First bid' : 'Next auto'}
        </span>
        <span className="bp-next-amount">
          ₹{nextAutoBid.toLocaleString()}
        </span>
      </div>

      {/* ✅ FIXED: captain grid properly wrapped in a div */}
      <div className="bp-captains-grid">
        {teams.map((team, i) => {
          const teamId     = team.id || team.teamId
          const isSelected = selected?.id === teamId
                          || selected?.teamId === teamId
          const budget     = team.remainingBudget ?? team.totalBudget ?? 0
          const cap        = getSmartCap(team)
          const canAfford  = budget >= (isFirstBid ? basePrice : effectiveAmount)
          const atCap      = cap?.isAtCap

          return (
            <motion.button
              key={teamId}
              className={`bp-captain-btn
                ${isSelected  ? 'selected' : ''}
                ${!canAfford  ? 'broke'    : ''}
                ${atCap       ? 'at-cap'   : ''}`}
              style={{ '--tc': team.teamColor || '#e63946' }}
              onClick={() => canAfford && handleSelectTeam(team)}
              title={cap
                ? `Max bid: ₹${Math.floor(cap.maxBid)} — ₹${cap.reservedBudget} reserved for ${cap.stillNeeded - 1} more players`
                : ''}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={canAfford ? { scale: 1.02 } : {}}
              whileTap={canAfford   ? { scale: 0.97 } : {}}>

              <div className="bp-btn-colorbar"
                style={{ background: team.teamColor || '#e63946' }} />

              <div className="bp-btn-body">
                <span className="bp-btn-captain">{team.captainName}</span>
                <span className="bp-btn-team">{team.teamName}</span>
                <span className={`bp-btn-budget ${!canAfford ? 'low' : ''}`}>
                  ₹{budget.toLocaleString()}
                  {!canAfford && ' ⚠️'}
                </span>
                {cap && (
                  <span className="bp-btn-cap">
                    {atCap
                      ? `🔒 Max ₹${basePrice}`
                      : `🎯 Max ₹${Math.floor(cap.maxBid)}`}
                  </span>
                )}
              </div>

              {isSelected && (
                <motion.div className="bp-selected-tick"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}>
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Confirm panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="bp-confirm-panel"
            style={{ borderColor: selected.teamColor || '#e63946' }}
            initial={{ opacity: 0, y: 16, height: 0 }}
            animate={{ opacity: 1, y: 0,  height: 'auto' }}
            exit={{ opacity: 0,    y: 8,  height: 0 }}>

            {/* Confirm header */}
            <div className="bp-confirm-header">
              <div className="bp-confirm-dot"
                style={{ background: selected.teamColor }} />
              <span className="bp-confirm-name">
                {selected.captainName}
              </span>
              <span className="bp-confirm-team">
                — {selected.teamName}
              </span>
              <button className="bp-cancel-btn"
                onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            {/* ✅ Budget cap warning */}
            {(() => {
              const cap = getSmartCap(selected)
              if (!cap) return null
              return (
                <motion.div
                  className="bp-cap-warning"
                  style={{ '--tc': selected.teamColor }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}>
                  <div className="bp-cap-row">
                    <span className="bp-cap-icon">🎯</span>
                    <span className="bp-cap-text">
                      <strong>Budget Cap Active</strong>
                      <span>
                        {cap.stillNeeded - 1} more players needed
                        · ₹{cap.reservedBudget} reserved
                      </span>
                    </span>
                    <span className="bp-cap-max">
                      Max: ₹{Math.floor(cap.maxBid)}
                    </span>
                  </div>
                  {cap.isAtCap && (
                    <div className="bp-cap-alert">
                      ⚠️ Can only bid base price ₹{basePrice} on remaining players
                    </div>
                  )}
                </motion.div>
              )
            })()}

            {/* Quick bid buttons */}
            <div className="bp-quick-bids">
              {quickAmounts.map((amt, i) => {
                const selectedBudget =
                  selected.remainingBudget ?? selected.totalBudget ?? 0
                const tooExpensive = amt > selectedBudget

                return (
                  <motion.button
                    key={amt}
                    className={`bp-quick-btn
                      ${effectiveAmount === amt ? 'active'    : ''}
                      ${tooExpensive            ? 'disabled'  : ''}`}
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

            {/* Mode toggle */}
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
                <motion.div
                  className="bp-manual-row"
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
                    max={selectedCap ? selectedCap.maxBid : undefined}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final amount preview */}
            <div className="bp-final-amount">
              <span className="bp-final-label">Bid Amount</span>
              <span
                className="bp-final-value"
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
