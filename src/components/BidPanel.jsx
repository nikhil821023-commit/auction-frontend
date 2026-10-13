import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { placeBid } from '../api/auctionApi'
import toast from 'react-hot-toast'
import './BidPanel.css'

const getId = (t) => t.id || t.teamId
const getBudget = (t) => t.remainingBudget ?? t.totalBudget ?? 0
const getBought = (t) => t.playersBought || t.squadCount || 0

// ── Smart Budget Cap ────────────────────────────────────────────────
// Reserves base price for every other player the team still needs,
// so a team can never spend itself out of completing its squad.
function getSmartCap(team, maxSquadSize, basePrice) {
  if (!team) return null
  if (!maxSquadSize || maxSquadSize <= 0) return null
  if (!basePrice || basePrice <= 0) return null

  const stillNeeded = maxSquadSize - getBought(team)
  if (stillNeeded <= 1) return null // last player — no cap

  const budget         = getBudget(team)
  const reservedBudget = (stillNeeded - 1) * basePrice
  const maxBid         = budget - reservedBudget

  return {
    stillNeeded,
    reservedBudget,
    maxBid:  Math.max(maxBid, basePrice),
    isAtCap: maxBid <= basePrice
  }
}

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
  maxSquadSize = null
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [amount, setAmount]         = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // ── Derived values (plain calculations, no hooks) ─────────────────
  const current = currentBid ?? 0

  const isFirstBid = hasBids !== undefined
    ? !hasBids
    : (!current || current <= basePrice)

  const nextAutoBid = isFirstBid ? basePrice : current + bidIncrement
  const minBid      = isFirstBid ? basePrice : current + 1

  const selected    = teams.find((t) => getId(t) === selectedId) || null
  const selectedCap = selected ? getSmartCap(selected, maxSquadSize, basePrice) : null

  // Most a team can bid: its budget, further limited by the smart cap
  const limitFor = (team) => {
    const cap = getSmartCap(team, maxSquadSize, basePrice)
    const budget = getBudget(team)
    return cap ? Math.min(budget, cap.maxBid) : budget
  }
  const isFull = (team) =>
    !!maxSquadSize && maxSquadSize > 0 && getBought(team) >= maxSquadSize

  const limit = selected ? limitFor(selected) : 0

  const quickAmounts = (isFirstBid
    ? [basePrice, basePrice + bidIncrement, basePrice + bidIncrement * 2, basePrice + bidIncrement * 5]
    : [current + bidIncrement, current + bidIncrement * 2, current + bidIncrement * 5, current + bidIncrement * 10]
  ).filter((v) => v > 0)

  // New player / bidding opened → reset the dock
  useEffect(() => {
    if (phase === 'BIDDING' || phase === 'PLAYER_REVEAL') {
      setSelectedId(null)
      setAmount(0)
    }
  }, [phase, basePrice])

  // Someone else bid while a team is selected → keep amount valid
  useEffect(() => {
    setAmount((a) => (selectedId != null && a < minBid ? minBid : a))
  }, [minBid, selectedId])

  if (phase !== 'BIDDING') return null

  // ── Handlers ──────────────────────────────────────────────────────
  const selectTeam = (team) => {
    setSelectedId(getId(team))
    setAmount(nextAutoBid)
  }

  const step = (dir) => {
    setAmount((a) => {
      const next  = (a || minBid) + dir * bidIncrement
      const upper = limit >= minBid ? limit : next
      return Math.min(upper, Math.max(minBid, next))
    })
  }

  const handleConfirm = async () => {
    if (!selected) {
      toast.error('Select a team first')
      return
    }
    if (!amount || isNaN(amount)) {
      toast.error('Enter a valid amount')
      return
    }

    if (isFirstBid) {
      if (amount < basePrice) {
        toast.error(`Minimum bid is ₹${basePrice} (base price)`)
        return
      }
    } else if (amount <= current) {
      toast.error(`Bid must be higher than ₹${current.toLocaleString()}`)
      return
    }

    if (amount > getBudget(selected)) {
      toast.error(`Insufficient budget. Remaining ₹${getBudget(selected).toLocaleString()}`)
      return
    }

    // Smart budget cap validation
    const cap = getSmartCap(selected, maxSquadSize, basePrice)
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
        teamId:           getId(selected),
        captainName:      selected.captainName,
        teamName:         selected.teamName,
        teamColor:        selected.teamColor,
        bidAmount:        amount,
        useAutoIncrement: false,
        bidMode:          'ORGANIZER_CONTROLLED'
      })
      toast.success(`✅ ₹${amount.toLocaleString()} — ${selected.captainName}`)
      setSelectedId(null)
      setAmount(0)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bid failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading / error ───────────────────────────────────────────────
  if (teamsLoading) {
    return (
      <div className="bd-dock">
        <div className="bd-head"><span className="bd-title">🎙️ BID DOCK</span></div>
        <div className="bd-msg">Loading teams...</div>
      </div>
    )
  }

  if (teamsError || teams.length === 0) {
    return (
      <div className="bd-dock">
        <div className="bd-head"><span className="bd-title">🎙️ BID DOCK</span></div>
        <div className="bd-msg">
          👥 {teamsError || 'No teams found'}
          {onRetryTeams && (
            <button className="bd-retry" onClick={onRetryTeams}>🔄 Retry</button>
          )}
        </div>
      </div>
    )
  }

  const accent    = selected?.teamColor || '#e63946'
  const overLimit = !!selected && amount > limit

  // ── Main dock ─────────────────────────────────────────────────────
  return (
    <div className="bd-dock">

      {/* Header: label + what the next bid is */}
      <div className="bd-head">
        <span className="bd-title">🎙️ BID DOCK</span>
        <span className="bd-next">
          {isFirstBid ? 'First bid' : 'Next'} <b>₹{nextAutoBid.toLocaleString()}</b>
        </span>
      </div>

      {/* Captain chips — one compact row, tap to select */}
      <div className="bd-chips">
        {teams.map((team) => {
          const id     = getId(team)
          const color  = team.teamColor || '#e63946'
          const budget = getBudget(team)
          const cap    = getSmartCap(team, maxSquadSize, basePrice)
          const full   = isFull(team)
          const ok     = limitFor(team) >= nextAutoBid && !full
          const isSel  = id === selectedId

          return (
            <button
              key={id}
              className={`bd-chip ${isSel ? 'sel' : ''} ${!ok ? 'off' : ''}`}
              style={{ '--tc': color }}
              disabled={!ok}
              onClick={() => selectTeam(team)}
              title={
                full ? 'Squad full'
                : cap ? `Max bid ₹${Math.floor(cap.maxBid)} — ₹${cap.reservedBudget} reserved for ${cap.stillNeeded - 1} more players`
                : !ok ? `Cannot afford ₹${nextAutoBid.toLocaleString()}`
                : ''
              }>
              <span className="bd-dot" />
              <span className="bd-chip-main">
                <b>{team.captainName}</b>
                <i>{team.teamName}</i>
              </span>
              <span className="bd-chip-money">
                ₹{budget.toLocaleString()}
                {full
                  ? <em>FULL</em>
                  : cap && (
                    <em>
                      {cap.isAtCap
                        ? `🔒 Max ₹${basePrice}`
                        : `🎯 Max ₹${Math.floor(cap.maxBid)}`}
                    </em>
                  )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Action bar — appears once a captain is picked */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            className="bd-action"
            style={{ '--tc': accent }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}>

            {/* Budget cap info — one line */}
            {selectedCap && (
              <div className={`bd-cap ${selectedCap.isAtCap ? 'lock' : ''}`}>
                {selectedCap.isAtCap
                  ? `🔒 At cap — base price ₹${basePrice} only (${selectedCap.stillNeeded - 1} more players needed)`
                  : `🎯 Budget cap · ${selectedCap.stillNeeded - 1} more needed · ₹${selectedCap.reservedBudget} reserved · Max ₹${Math.floor(selectedCap.maxBid)}`}
              </div>
            )}

            <div className="bd-action-row">
              {/* Stepper */}
              <div className="bd-stepper">
                <button className="bd-step" onClick={() => step(-1)}>−</button>
                <div className="bd-amount">
                  <span>₹</span>
                  <input
                    type="number"
                    value={amount || ''}
                    min={minBid}
                    max={limit || undefined}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  />
                </div>
                <button className="bd-step" onClick={() => step(1)}>+</button>
              </div>

              {/* Quick amounts */}
              <div className="bd-quick">
                {quickAmounts.map((amt, i) => (
                  <button
                    key={amt}
                    className={`bd-q ${amount === amt ? 'active' : ''}`}
                    disabled={amt > limit}
                    onClick={() => setAmount(amt)}>
                    ₹{amt.toLocaleString()}
                    {isFirstBid && i === 0 && <small>base</small>}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="bd-confirm"
              onClick={handleConfirm}
              disabled={submitting || overLimit}>
              {submitting
                ? '⏳ Placing bid...'
                : overLimit
                  ? `Over max ₹${Math.floor(limit).toLocaleString()}`
                  : `🔨 ₹${(amount || 0).toLocaleString()} — ${selected.captainName.toUpperCase()}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
