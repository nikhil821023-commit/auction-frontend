import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { registerTeam } from '../api/teamApi'
import { getTournamentByCode } from '../api/tournamentApi'
import { useAuctionStore } from '../store/auctionStore'
import { multipartApi } from '../api/axios'

export default function TeamRegister() {
  const navigate = useNavigate()
  const { setTeam, setTournament, setRole } = useAuctionStore()

  const [logo, setLogo]                     = useState(null)
  const [joinCode, setJoinCode]             = useState('')
  const [tournament, setLocalTournament]    = useState(null)
  const [findingTournament, setFinding]     = useState(false)
  const [registering, setRegistering]       = useState(false)

  const [form, setForm] = useState({
    teamName:     '',
    captainName:  '',
    captainEmail: '',
    captainPhone: '',
    teamColor:    '#e63946'
  })

  // ── Find tournament by join code ──────────────────────────────────
  const handleFindTournament = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code')
      return
    }
    setFinding(true)
    try {
      const res = await getTournamentByCode(joinCode.trim().toUpperCase())
      setLocalTournament(res.data)
      toast.success(`✅ Found: ${res.data.name}`)
    } catch (err) {
      console.error('Find tournament error:', err)
      // Show exactly what the server says
      const msg = err.response?.data?.message
             || err.response?.data
             || 'Tournament not found — check your join code'
      toast.error(String(msg))
      setLocalTournament(null)
    } finally {
      setFinding(false)
    }
  }

  // ── Register team ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!tournament) {
      toast.error('Find your tournament first using the join code')
      return
    }
    if (!form.teamName.trim() || !form.captainName.trim()) {
      toast.error('Team name and captain name are required')
      return
    }

    setRegistering(true)
    const toastId = toast.loading('Registering team...')

    try {
      // Build multipart form manually for reliability
      const formData = new FormData()
      formData.append(
        'data',
        new Blob(
          [JSON.stringify({
            teamName:     form.teamName.trim(),
            captainName:  form.captainName.trim(),
            captainEmail: form.captainEmail.trim(),
            captainPhone: form.captainPhone.trim(),
            teamColor:    form.teamColor,
            tournamentId: tournament.id   // ← KEY: use tournament.id from state
          })],
          { type: 'application/json' }
        )
      )
      if (logo) formData.append('logo', logo)

      const res = await multipartApi.post('/teams', formData)
      const team = res.data

      // Store in global state so lobby/auction pages can access
      setTeam({
        ...team,
        tournament: tournament   // attach tournament to team for lobby use
      })
      setTournament(tournament)
      setRole('CAPTAIN')

      toast.success(
        `✅ Team "${team.teamName}" registered! Joining lobby...`,
        { id: toastId }
      )

      // Navigate to captain lobby
      navigate(`/captain/lobby/${tournament.id}`)

    } catch (err) {
      console.error('Register team error:', err)
      const msg = err.response?.data?.message
             || err.response?.data
             || 'Registration failed'
      toast.error(String(msg), { id: toastId })
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="page-bg">
      <motion.div
        className="form-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="form-title">🧢 Register Your Team</h2>

        {/* ── Step 1: Find tournament ── */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ fontSize:'0.8rem', color:'var(--text-dim)',
            textTransform:'uppercase', letterSpacing:'0.5px',
            display:'block', marginBottom:'0.5rem' }}>
            Tournament Join Code
          </label>
          <div className="join-code-row">
            <input
              className="join-input"
              placeholder="e.g. ABC123"
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleFindTournament()}
            />
            <motion.button
              type="button"
              className="btn-accent"
              onClick={handleFindTournament}
              disabled={findingTournament}
              whileTap={{ scale: 0.96 }}
            >
              {findingTournament ? '...' : 'Find →'}
            </motion.button>
          </div>
        </div>

        {/* ── Tournament found badge ── */}
        {tournament && (
          <motion.div
            className="tournament-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🏆 {tournament.name} &nbsp;|&nbsp;
            {tournament.sportType} &nbsp;|&nbsp;
            Budget: ₹{tournament.teamBudget?.toLocaleString()}
          </motion.div>
        )}

        {/* ── Step 2: Team details form ── */}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Team Name</label>
            <input
              value={form.teamName}
              required
              placeholder="Mumbai Warriors"
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Captain Name</label>
            <input
              value={form.captainName}
              required
              placeholder="Your full name"
              onChange={(e) => setForm({ ...form, captainName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Captain Email</label>
            <input
              type="email"
              value={form.captainEmail}
              placeholder="captain@email.com"
              onChange={(e) => setForm({ ...form, captainEmail: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Captain Phone</label>
            <input
              value={form.captainPhone}
              placeholder="+91 9999999999"
              onChange={(e) => setForm({ ...form, captainPhone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Team Color</label>
            <div className="color-row">
              <input
                type="color"
                value={form.teamColor}
                onChange={(e) => setForm({ ...form, teamColor: e.target.value })}
              />
              <span style={{ color: form.teamColor, fontWeight: 700, fontSize:'1.1rem' }}>
                {form.teamColor}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Team Logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files[0])}
            />
          </div>

          <motion.button
            type="submit"
            className="btn-primary full-width"
            disabled={!tournament || registering}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {registering ? 'Registering...' : 'Register Team →'}
          </motion.button>

          {!tournament && (
            <p style={{ textAlign:'center', color:'var(--text-dim)',
              fontSize:'0.82rem', marginTop:'-0.5rem' }}>
              ⬆ Find tournament first using the join code
            </p>
          )}
        </form>
      </motion.div>
    </div>
  )
}