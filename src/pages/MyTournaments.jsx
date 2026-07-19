import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getAllTournaments, scheduleTournament,
  postponeTournament, extendReservation,
  cancelTournament, getTournamentStatus
} from '../api/tournamentApi'

const STATUS_META = {
  SETUP:      { color: '#8891aa', icon: '⚙️',  label: 'Draft'      },
  SCHEDULED:  { color: '#22d3ee', icon: '📅',  label: 'Scheduled'  },
  LOBBY:      { color: '#f59e0b', icon: '🟡',  label: 'Lobby Open' },
  LIVE:       { color: '#22c55e', icon: '🔴',  label: 'Live'       },
  PAUSED:     { color: '#f97316', icon: '⏸️',  label: 'Paused'     },
  COMPLETED:  { color: '#a78bfa', icon: '✅',  label: 'Completed'  },
  EXPIRED:    { color: '#ef4444', icon: '⌛',  label: 'Expired'    },
  CANCELLED:  { color: '#ef4444', icon: '❌',  label: 'Cancelled'  },
}

function Countdown({ target }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target) - new Date()
      if (diff <= 0) { setTimeLeft('Starting now!'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(
        d > 0 ? `${d}d ${h}h ${m}m`
        : h > 0 ? `${h}h ${m}m ${s}s`
        : `${m}m ${s}s`
      )
    }
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [target])

  return <span className="mt-countdown">{timeLeft}</span>
}

function ExpiryBar({ expiresAt }) {
  if (!expiresAt) return null
  const total = 3 * 24 * 60 * 60 * 1000  // assume 3 days default
  const left  = new Date(expiresAt) - new Date()
  const pct   = Math.max(0, Math.min((left / total) * 100, 100))
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444'
  const hours = Math.max(0, Math.floor(left / 3600000))

  return (
    <div className="mt-expiry">
      <div className="mt-expiry-bar-bg">
        <motion.div className="mt-expiry-bar-fill"
          style={{ background: color, width: pct + '%' }}
          initial={{ width: 0 }}
          animate={{ width: pct + '%' }}
          transition={{ duration: 0.6 }} />
      </div>
      <span className="mt-expiry-label" style={{ color }}>
        {hours > 0
          ? `Expires in ${hours}h`
          : 'Expiring soon!'}
      </span>
    </div>
  )
}

export default function MyTournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(null)
  // modal = { type: 'schedule'|'postpone'|'extend'|'cancel', tid, name }
  const [formData, setFormData]       = useState({})
  const [submitting, setSub]          = useState(false)
  const [filter, setFilter]           = useState('ALL')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await getAllTournaments()
      setTournaments(res.data)
    } catch (e) {
      toast.error('Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  const filtered = tournaments.filter(t =>
    filter === 'ALL' || t.status === filter
  )

  // ── Action handlers ─────────────────────────────────────────
  const handleSchedule = async () => {
    if (!formData.scheduledTime) {
      toast.error('Pick a date and time')
      return
    }
    setSub(true)
    try {
      await scheduleTournament(modal.tid, {
        scheduledTime:  new Date(formData.scheduledTime)
                          .toISOString().slice(0, 19),
        reservedDays:   Number(formData.reservedDays || 3),
        autoStart:      formData.autoStart === 'true',
        organizerEmail: formData.organizerEmail || '',
        organizerName:  formData.organizerName  || 'Organizer',
      })
      toast.success('📅 Tournament scheduled!')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally {
      setSub(false)
    }
  }

  const handlePostpone = async () => {
    if (!formData.newTime) {
      toast.error('Pick a new date and time')
      return
    }
    setSub(true)
    try {
      await postponeTournament(modal.tid, {
        newTime:    new Date(formData.newTime)
                      .toISOString().slice(0, 19),
        reason:     formData.reason || '',
        extendDays: Number(formData.extendDays || 3),
      })
      toast.success('⏰ Tournament postponed!')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally {
      setSub(false)
    }
  }

  const handleExtend = async () => {
    setSub(true)
    try {
      await extendReservation(
        modal.tid,
        Number(formData.additionalDays || 1))
      toast.success('📆 Reservation extended!')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally {
      setSub(false)
    }
  }

  const handleCancel = async () => {
    setSub(true)
    try {
      await cancelTournament(
        modal.tid,
        formData.reason || 'Cancelled by organizer')
      toast.success('❌ Tournament cancelled')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally {
      setSub(false)
    }
  }

  const openModal = (type, t) => {
    setModal({ type, tid: t.id, name: t.name })
    setFormData({})
  }

  if (loading) return (
    <div className="mt-loading">
      <motion.div animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        ⚙️
      </motion.div>
      <p>Loading tournaments...</p>
    </div>
  )

  return (
    <div className="mt-bg">

      {/* Header */}
      <div className="mt-header">
        <div>
          <h1 className="mt-title">🏆 My Tournaments</h1>
          <p className="mt-sub">Manage, schedule and track all your auctions</p>
        </div>
        <motion.button className="btn-primary"
          onClick={() => navigate('/organizer/setup')}
          whileTap={{ scale: 0.97 }}>
          ➕ New Tournament
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="mt-filter-row">
        {['ALL', 'SETUP', 'SCHEDULED', 'LOBBY',
          'LIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']
          .map(f => (
          <button key={f}
            className={`mt-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {STATUS_META[f]?.icon || '📋'} {f}
            {f !== 'ALL' && (
              <span className="mt-filter-count">
                {tournaments.filter(t => t.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tournament cards */}
      <div className="mt-grid">
        {filtered.length === 0 && (
          <div className="mt-empty">
            <span>🏏</span>
            <p>No tournaments found</p>
            <button className="btn-primary"
              onClick={() => navigate('/organizer/setup')}>
              Create One →
            </button>
          </div>
        )}

        {filtered.map((t, i) => {
          const meta = STATUS_META[t.status] || STATUS_META.SETUP
          const isScheduled = t.status === 'SCHEDULED'
          const isExpiring  = t.expiresAt &&
            (new Date(t.expiresAt) - new Date()) < 24 * 3600 * 1000

          return (
            <motion.div key={t.id}
              className={`mt-card ${isExpiring ? 'expiring' : ''}`}
              style={{ '--tc': meta.color }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              layout>

              {/* Status bar top */}
              <div className="mt-card-status-bar"
                style={{ background: meta.color }} />

              {/* Card header */}
              <div className="mt-card-header">
                <div>
                  <h3 className="mt-card-name">{t.name}</h3>
                  <span className="mt-card-sport">{t.sportType}</span>
                </div>
                <div className="mt-status-badge"
                  style={{ color: meta.color,
                           background: meta.color + '18',
                           border: `1px solid ${meta.color}44` }}>
                  {meta.icon} {meta.label}
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-card-stats">
                <span>👥 {t.teams?.length || 0} teams</span>
                <span>🏏 {t.players?.length || 0} players</span>
                <span>💰 ₹{Number(t.teamBudget || 0)
                             .toLocaleString()}</span>
              </div>

              {/* Scheduled time */}
              {t.scheduledAuctionTime && (
                <div className="mt-schedule-info">
                  <div className="mt-sched-row">
                    <span className="mt-sched-label">📅 Scheduled</span>
                    <span className="mt-sched-time">
                      {new Date(t.scheduledAuctionTime)
                        .toLocaleString('en-IN', {
                          day:'2-digit', month:'short',
                          year:'numeric', hour:'2-digit',
                          minute:'2-digit'
                        })}
                    </span>
                  </div>
                  {isScheduled && (
                    <div className="mt-sched-row">
                      <span className="mt-sched-label">⏱️ Starts in</span>
                      <Countdown target={t.scheduledAuctionTime} />
                    </div>
                  )}
                </div>
              )}

              {/* Expiry bar */}
              {(t.status === 'SCHEDULED' || t.status === 'SETUP')
                && t.expiresAt && (
                <ExpiryBar expiresAt={t.expiresAt} />
              )}

              {/* Postpone info */}
              {t.postponeCount > 0 && (
                <div className="mt-postpone-info">
                  ⚠️ Postponed {t.postponeCount}× —
                  {t.postponeReason && ` "${t.postponeReason}"`}
                </div>
              )}

              {/* Join code */}
              <div className="mt-join-code">
                <span>Join Code:</span>
                <code>{t.joinCode}</code>
                <button onClick={() => {
                  navigator.clipboard.writeText(t.joinCode)
                  toast.success('Copied!')
                }}>📋</button>
              </div>

              {/* Actions */}
              <div className="mt-card-actions">

                {/* Go to auction */}
                {t.status === 'LIVE' && (
                  <motion.button className="mt-btn primary"
                    onClick={() =>
                      navigate(`/organizer/auction/${t.id}`)}
                    whileTap={{ scale: 0.97 }}>
                    🔴 Join Live
                  </motion.button>
                )}

                {/* Open lobby */}
                {t.status === 'LOBBY' && (
                  <motion.button className="mt-btn primary"
                    onClick={() =>
                      navigate(`/organizer/lobby/${t.id}`)}
                    whileTap={{ scale: 0.97 }}>
                    🟡 Open Lobby
                  </motion.button>
                )}

                {/* View results */}
                {t.status === 'COMPLETED' && (
                  <motion.button className="mt-btn primary"
                    onClick={() =>
                      navigate(`/post-auction/${t.id}`)}
                    whileTap={{ scale: 0.97 }}>
                    🏆 View Results
                  </motion.button>
                )}

                {/* Schedule */}
                {(t.status === 'SETUP') && (
                  <motion.button className="mt-btn schedule"
                    onClick={() => openModal('schedule', t)}
                    whileTap={{ scale: 0.97 }}>
                    📅 Schedule
                  </motion.button>
                )}

                {/* Postpone */}
                {t.status === 'SCHEDULED' && (
                  <motion.button className="mt-btn postpone"
                    onClick={() => openModal('postpone', t)}
                    whileTap={{ scale: 0.97 }}>
                    ⏰ Postpone
                  </motion.button>
                )}

                {/* Extend */}
                {(t.status === 'SCHEDULED'
                  || t.status === 'SETUP') && (
                  <motion.button className="mt-btn extend"
                    onClick={() => openModal('extend', t)}
                    whileTap={{ scale: 0.97 }}>
                    📆 Extend
                  </motion.button>
                )}

                {/* Add players */}
                {['SETUP','SCHEDULED'].includes(t.status) && (
                  <motion.button className="mt-btn secondary"
                    onClick={() =>
                      navigate(`/organizer/players/${t.id}`)}
                    whileTap={{ scale: 0.97 }}>
                    👤 Players
                  </motion.button>
                )}

                {/* Cancel */}
                {!['COMPLETED','EXPIRED','CANCELLED']
                  .includes(t.status) && (
                  <motion.button className="mt-btn cancel"
                    onClick={() => openModal('cancel', t)}
                    whileTap={{ scale: 0.97 }}>
                    ❌
                  </motion.button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div className="mt-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}>

            <motion.div className="mt-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{ scale: 0.9,    opacity: 0 }}
              onClick={e => e.stopPropagation()}>

              {/* SCHEDULE MODAL */}
              {modal.type === 'schedule' && (<>
                <h3 className="mt-modal-title">
                  📅 Schedule Auction
                </h3>
                <p className="mt-modal-sub">{modal.name}</p>

                <div className="mt-modal-body">
                  <div className="form-group">
                    <label>Auction Date & Time *</label>
                    <input type="datetime-local"
                      value={formData.scheduledTime || ''}
                      min={new Date().toISOString().slice(0,16)}
                      onChange={e => setFormData(f => ({
                        ...f, scheduledTime: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label>
                      Reserve slot for how many days?
                      <span className="form-hint">
                        (tournament auto-expires after this)
                      </span>
                    </label>
                    <div className="mt-days-row">
                      {[1,2,3,5,7].map(d => (
                        <button key={d}
                          className={`mt-day-btn ${
                            formData.reservedDays == d
                            ? 'active' : ''}`}
                          onClick={() => setFormData(f => ({
                            ...f, reservedDays: d }))}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Your Name</label>
                    <input placeholder="Organizer name"
                      value={formData.organizerName || ''}
                      onChange={e => setFormData(f => ({
                        ...f, organizerName: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label>Your Email (for reminders)</label>
                    <input type="email"
                      placeholder="you@email.com"
                      value={formData.organizerEmail || ''}
                      onChange={e => setFormData(f => ({
                        ...f, organizerEmail: e.target.value }))} />
                  </div>

                  <div className="mt-toggle-row">
                    <label>
                      🤖 Auto-open lobby at scheduled time?
                    </label>
                    <select value={formData.autoStart || 'false'}
                      onChange={e => setFormData(f => ({
                        ...f, autoStart: e.target.value }))}>
                      <option value="false">
                        No — I'll open it manually
                      </option>
                      <option value="true">
                        Yes — auto-open lobby
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mt-modal-actions">
                  <button className="mt-btn secondary"
                    onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <motion.button className="mt-btn schedule"
                    onClick={handleSchedule}
                    disabled={submitting}
                    whileTap={{ scale: 0.97 }}>
                    {submitting ? '⏳...' : '📅 Schedule'}
                  </motion.button>
                </div>
              </>)}

              {/* POSTPONE MODAL */}
              {modal.type === 'postpone' && (<>
                <h3 className="mt-modal-title">
                  ⏰ Postpone Auction
                </h3>
                <p className="mt-modal-sub">{modal.name}</p>

                <div className="mt-modal-body">
                  <div className="form-group">
                    <label>New Date & Time *</label>
                    <input type="datetime-local"
                      value={formData.newTime || ''}
                      min={new Date().toISOString().slice(0,16)}
                      onChange={e => setFormData(f => ({
                        ...f, newTime: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label>Reason (optional)</label>
                    <input placeholder="e.g. Technical issues..."
                      value={formData.reason || ''}
                      onChange={e => setFormData(f => ({
                        ...f, reason: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label>Extend reservation by</label>
                    <div className="mt-days-row">
                      {[1,2,3,5,7].map(d => (
                        <button key={d}
                          className={`mt-day-btn ${
                            formData.extendDays == d
                            ? 'active' : ''}`}
                          onClick={() => setFormData(f => ({
                            ...f, extendDays: d }))}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-modal-actions">
                  <button className="mt-btn secondary"
                    onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <motion.button className="mt-btn postpone"
                    onClick={handlePostpone}
                    disabled={submitting}
                    whileTap={{ scale: 0.97 }}>
                    {submitting ? '⏳...' : '⏰ Postpone'}
                  </motion.button>
                </div>
              </>)}

              {/* EXTEND MODAL */}
              {modal.type === 'extend' && (<>
                <h3 className="mt-modal-title">
                  📆 Extend Reservation
                </h3>
                <p className="mt-modal-sub">{modal.name}</p>
                <div className="mt-modal-body">
                  <div className="form-group">
                    <label>Add how many more days?</label>
                    <div className="mt-days-row">
                      {[1,2,3,5,7].map(d => (
                        <button key={d}
                          className={`mt-day-btn ${
                            formData.additionalDays == d
                            ? 'active' : ''}`}
                          onClick={() => setFormData(f => ({
                            ...f, additionalDays: d }))}>
                          +{d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-modal-actions">
                  <button className="mt-btn secondary"
                    onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <motion.button className="mt-btn extend"
                    onClick={handleExtend}
                    disabled={submitting}
                    whileTap={{ scale: 0.97 }}>
                    {submitting ? '⏳...' : '📆 Extend'}
                  </motion.button>
                </div>
              </>)}

              {/* CANCEL MODAL */}
              {modal.type === 'cancel' && (<>
                <h3 className="mt-modal-title">❌ Cancel Tournament</h3>
                <p className="mt-modal-sub">{modal.name}</p>
                <div className="mt-modal-body">
                  <div className="form-group">
                    <label>Reason (optional)</label>
                    <input placeholder="Why are you cancelling?"
                      value={formData.reason || ''}
                      onChange={e => setFormData(f => ({
                        ...f, reason: e.target.value }))} />
                  </div>
                  <div className="mt-cancel-warn">
                    ⚠️ This cannot be undone.
                    All registered teams will be notified.
                  </div>
                </div>
                <div className="mt-modal-actions">
                  <button className="mt-btn secondary"
                    onClick={() => setModal(null)}>
                    Go Back
                  </button>
                  <motion.button className="mt-btn cancel-confirm"
                    onClick={handleCancel}
                    disabled={submitting}
                    whileTap={{ scale: 0.97 }}>
                    {submitting ? '⏳...' : '❌ Yes, Cancel'}
                  </motion.button>
                </div>
              </>)}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}