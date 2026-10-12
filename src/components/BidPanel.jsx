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

  // Must be a real boolean:
  // false = no real bid yet
  // true  = at least one real bid exists
  hasBids = false
}) {
  const [selected, setSelected] = useState(null)
  const [customAmt, setCustomAmt] = useState('')
  const [inputMode, setInputMode] = useState('auto')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (phase === 'BIDDING' || phase === 'PLAYER_REVEAL') {
      setSelected(null)
      setCustomAmt('')
      setInputMode('auto')
    }
  }, [phase, basePrice])

  if (phase !== 'BIDDING') {
    return null
  }

  // Always convert values to numbers because API values may arrive as strings.
  const numericBasePrice = Number(basePrice) || 0
  const numericCurrentBid = Number(currentBid) || 0
  const numericBidIncrement = Number(bidIncrement) || 1

  /*
   * IMPORTANT:
   *
   * Do not use:
   *
   *   !hasBids
   *
   * because the backend/frontend may send "false" as a string.
   *
   * A bid exists only when hasBids is exactly true.
   */
  const hasRealBid = hasBids === true
  const isFirstBid = !hasRealBid

  // First bid can equal the base price.
  // Later bids must be higher than the current bid.
  const nextAutoBid = isFirstBid
    ? numericBasePrice
    : numericCurrentBid + numericBidIncrement

  const minBid = isFirstBid
    ? numericBasePrice
    : numericCurrentBid + 1

  const quickAmounts = (
    isFirstBid
      ? [
          numericBasePrice,
          numericBasePrice + numericBidIncrement,
          numericBasePrice + numericBidIncrement * 2,
          numericBasePrice + numericBidIncrement * 5
        ]
      : [
          numericCurrentBid + numericBidIncrement,
          numericCurrentBid + numericBidIncrement * 2,
          numericCurrentBid + numericBidIncrement * 5,
          numericCurrentBid + numericBidIncrement * 10
        ]
  )
    .filter(amount => amount > 0)
    .filter((amount, index, array) => array.indexOf(amount) === index)

  const effectiveAmount =
    inputMode === 'manual' && customAmt !== ''
      ? Number(customAmt) || 0
      : nextAutoBid

  const handleSelectTeam = team => {
    setSelected(team)
    setCustomAmt('')
    setInputMode('auto')
  }

  const handleQuickBid = amount => {
    if (amount === nextAutoBid) {
      setInputMode('auto')
      setCustomAmt('')
    } else {
      setInputMode('manual')
      setCustomAmt(String(amount))
    }
  }

  const handleSubmitBid = async () => {
    if (!selected) {
      toast.error('Select a team first')
      return
    }

    const amount =
      inputMode === 'manual'
        ? Number(customAmt)
        : nextAutoBid

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    if (isFirstBid) {
      if (amount < numericBasePrice) {
        toast.error(
          `Minimum bid is ₹${numericBasePrice.toLocaleString()}`
        )
        return
      }
    } else {
      if (amount <= numericCurrentBid) {
        toast.error(
          `Bid must be higher than ₹${numericCurrentBid.toLocaleString()}`
        )
        return
      }
    }

    setSubmitting(true)

    try {
      await placeBid(tournamentId, {
        teamId: selected.id || selected.teamId,
        captainName: selected.captainName,
        teamName: selected.teamName,
        teamColor: selected.teamColor,
        bidAmount: amount,
        useAutoIncrement: false,
        bidMode: 'ORGANIZER_CONTROLLED'
      })

      toast.success(
        `✅ ₹${amount.toLocaleString()} — ${selected.captainName}`
      )

      setSelected(null)
      setCustomAmt('')
      setInputMode('auto')
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Bid failed'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (teamsLoading) {
    return (
      <div className="bid-panel-v2">
        <div className="bp-header">
          <span className="bp-title">
            🎙️ ORGANIZER BID PANEL
          </span>
        </div>

        <div className="bp-teams-loading">
          <div className="bp-loading-spinner" />
          <span>Loading teams...</span>
        </div>
      </div>
    )
  }

  if (teamsError || teams.length === 0) {
    return (
      <div className="bid-panel-v2">
        <div className="bp-header">
          <span className="bp-title">
            🎙️ ORGANIZER BID PANEL
          </span>
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

  return (
    <div className="bid-panel-v2">
      <div className="bp-header">
        <span className="bp-title">
          🎙️ ORGANIZER BID PANEL
        </span>

        <span className="bp-subtitle">
          Select captain who shouted the bid
        </span>
      </div>

      <div className="bp-current-bar">
        <span className="bp-current-label">
          {isFirstBid ? 'Base price' : 'Current'}
        </span>

        <span className="bp-current-amount">
          ₹{(isFirstBid
            ? numericBasePrice
            : numericCurrentBid
          ).toLocaleString()}
        </span>

        <span className="bp-next-label">
          {isFirstBid ? 'Minimum first bid' : 'Next auto'}
        </span>

        <span className="bp-next-amount">
          ₹{nextAutoBid.toLocaleString()}
        </span>
      </div>

      <div className="bp-captains-grid">
        {teams.map((team, index) => {
          const teamId = team.id || team.teamId
          const isSelected =
            selected?.id === teamId ||
            selected?.teamId === teamId

          const budget = Number(
            team.remainingBudget ?? team.totalBudget ?? 0
          )

          // For the first bid, team must afford the base price.
          // After bidding starts, team must afford the next auto bid.
          const requiredAmount = nextAutoBid
          const canAfford = budget >= requiredAmount

          return (
            <motion.button
              key={teamId}
              className={`bp-captain-btn ${
                isSelected ? 'selected' : ''
              } ${!canAfford ? 'broke' : ''}`}
              style={{
                '--tc': team.teamColor || '#e63946'
              }}
              onClick={() => {
                if (canAfford) {
                  handleSelectTeam(team)
                }
              }}
              title={
                !canAfford
                  ? `₹${budget.toLocaleString()} remaining — cannot afford ₹${requiredAmount.toLocaleString()}`
                  : ''
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={canAfford ? { scale: 1.02 } : {}}
              whileTap={canAfford ? { scale: 0.97 } : {}}>

              <div
                className="bp-btn-colorbar"
                style={{
                  background: team.teamColor || '#e63946'
                }}
              />

              <div className="bp-btn-body">
                <span className="bp-btn-captain">
                  {team.captainName}
                </span>

                <span className="bp-btn-team">
                  {team.teamName}
                </span>

                <span
                  className={`bp-btn-budget ${
                    !canAfford ? 'low' : ''
                  }`}>
                  ₹{budget.toLocaleString()}
                  {!canAfford && ' ⚠️'}
                </span>
              </div>

              {isSelected && (
                <motion.div
                  className="bp-selected-tick"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}>
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="bp-confirm-panel"
            style={{
              borderColor: selected.teamColor || '#e63946'
            }}
            initial={{
              opacity: 0,
              y: 16,
              height: 0
            }}
            animate={{
              opacity: 1,
              y: 0,
              height: 'auto'
            }}
            exit={{
              opacity: 0,
              y: 8,
              height: 0
            }}>

            <div className="bp-confirm-header">
              <div
                className="bp-confirm-dot"
                style={{
                  background: selected.teamColor || '#e63946'
                }}
              />

              <span className="bp-confirm-name">
                {selected.captainName}
              </span>

              <span className="bp-confirm-team">
                — {selected.teamName}
              </span>

              <button
                className="bp-cancel-btn"
                onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="bp-quick-bids">
              {quickAmounts.map((amount, index) => {
                const selectedBudget = Number(
                  selected.remainingBudget ??
                  selected.totalBudget ??
                  0
                )

                const tooExpensive = amount > selectedBudget

                return (
                  <motion.button
                    key={amount}
                    className={`bp-quick-btn ${
                      effectiveAmount === amount ? 'active' : ''
                    } ${tooExpensive ? 'disabled' : ''}`}
                    disabled={tooExpensive}
                    onClick={() => handleQuickBid(amount)}
                    whileTap={
                      tooExpensive ? {} : { scale: 0.95 }
                    }>
                    {isFirstBid && index === 0
                      ? `₹${amount.toLocaleString()} (Base)`
                      : `₹${amount.toLocaleString()}`}
                  </motion.button>
                )
              })}
            </div>

            <div className="bp-mode-toggle">
              <button
                className={`bp-mode-btn ${
                  inputMode === 'auto' ? 'active' : ''
                }`}
                onClick={() => {
                  setInputMode('auto')
                  setCustomAmt('')
                }}>
                {isFirstBid
                  ? `⚡ Base price = ₹${nextAutoBid.toLocaleString()}`
                  : `⚡ Auto +₹${numericBidIncrement.toLocaleString()} = ₹${nextAutoBid.toLocaleString()}`}
              </button>

              <button
                className={`bp-mode-btn ${
                  inputMode === 'manual' ? 'active' : ''
                }`}
                onClick={() => setInputMode('manual')}>
                ✏️ Custom Amount
              </button>
            </div>

            <AnimatePresence>
              {inputMode === 'manual' && (
                <motion.div
                  className="bp-manual-row"
                  initial={{
                    opacity: 0,
                    height: 0
                  }}
                  animate={{
                    opacity: 1,
                    height: 'auto'
                  }}
                  exit={{
                    opacity: 0,
                    height: 0
                  }}>

                  <span className="bp-rupee">₹</span>

                  <input
                    type="number"
                    className="bp-amount-input"
                    placeholder={`Min ₹${minBid.toLocaleString()}`}
                    value={customAmt}
                    onChange={event =>
                      setCustomAmt(event.target.value)
                    }
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        handleSubmitBid()
                      }
                    }}
                    autoFocus
                    min={minBid}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bp-final-amount">
              <span className="bp-final-label">
                Bid Amount
              </span>

              <span
                className="bp-final-value"
                style={{
                  color: selected.teamColor || '#e63946'
                }}>
                ₹{effectiveAmount.toLocaleString()}
              </span>
            </div>

            <motion.button
              className="bp-submit-btn"
              style={{
                background: selected.teamColor || '#e63946'
              }}
              onClick={handleSubmitBid}
              disabled={submitting}
              whileTap={{ scale: 0.97 }}>
              {submitting
                ? '⏳ Placing bid...'
                : `🔨 CONFIRM — ${String(
                    selected.captainName || ''
                  ).toUpperCase()}`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
