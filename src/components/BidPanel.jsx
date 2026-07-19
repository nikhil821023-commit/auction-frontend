import { useState } from 'react'
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
  currentBid = 0
}) {
  const [selected, setSelected]   = useState(null)
  const [customAmt, setCustomAmt] = useState('')
  const [inputMode, setInputMode] = useState('auto')
  const [submitting, setSubmitting] = useState(false)

  if (phase !== 'BIDDING') return null

  const nextAutoBid = currentBid + bidIncrement

  const handleSelectTeam = (team) => {
    setSelected(team)
    setCustomAmt('')
    setInputMode('auto')
  }

  const handleSubmitBid = async () => {
    if (!selected) return
    const amount = inputMode === 'manual'
      ? parseFloat(customAmt)
      : nextAutoBid

    if (isNaN(amount) || amount <= currentBid) {
      toast.error(`Amount must be above ₹${currentBid}`)
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
        bidMode:          'ORGANIZER_CONTROLLED'
      })
      toast.success(`✅ ₹${amount.toLocaleString()} — ${selected.captainName}`)
      setSelected(null)
      setCustomAmt('')
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
        <span className="bp-current-label">Current</span>
        <span className="bp-current-amount">₹{currentBid.toLocaleString()}</span>
        <span className="bp-next-label">Next auto</span>
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
              title={!canAfford ? `₹${budget.toLocaleString()} remaining — cannot afford ₹${nextAutoBid}` : ''}
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

            {/* Amount mode toggle */}
            <div className="bp-mode-toggle">
              <button
                className={`bp-mode-btn ${inputMode === 'auto' ? 'active' : ''}`}
                onClick={() => setInputMode('auto')}>
                ⚡ Auto +₹{bidIncrement} = ₹{nextAutoBid.toLocaleString()}
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
                    placeholder={`Min ₹${currentBid + 1}`}
                    value={customAmt}
                    onChange={e => setCustomAmt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitBid()}
                    autoFocus
                    min={currentBid + 1}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final amount preview */}
            <div className="bp-final-amount">
              <span className="bp-final-label">Bid Amount</span>
              <span className="bp-final-value"
                style={{ color: selected.teamColor || '#e63946' }}>
                ₹{(inputMode === 'manual' && customAmt
                    ? parseFloat(customAmt) || 0
                    : nextAutoBid
                  ).toLocaleString()}
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