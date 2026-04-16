import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { registerTeam } from '../api/teamApi'
import { getTournamentByCode } from '../api/tournamentApi'
import { useAuctionStore } from '../store/auctionStore'

export default function TeamRegister() {
  const navigate = useNavigate()
  const { setTeam, setTournament, setRole } = useAuctionStore()
  const [logo, setLogo] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [tournament, setLocalTournament] = useState(null)
  const [form, setForm] = useState({
    teamName: '', captainName: '', captainEmail: '',
    captainPhone: '', teamColor: '#e63946'
  })

  const handleFindTournament = async () => {
    try {
      const res = await getTournamentByCode(joinCode)
      setLocalTournament(res.data)
      toast.success(`Found: ${res.data.name}`)
    } catch {
      toast.error('Invalid join code')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tournament) return toast.error('Find tournament first')
    try {
      const payload = { ...form, tournamentId: tournament.id }
      const res = await registerTeam(payload, logo)
      const team = res.data
      setTeam(team)
      setTournament(tournament)
      setRole('CAPTAIN')
      toast.success(`✅ Team "${team.teamName}" registered!`)
      navigate(`/captain/lobby/${tournament.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="page-bg">
      <motion.div className="form-card"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>

        <h2 className="form-title">🧢 Register Your Team</h2>

        {/* Step 1: Find tournament */}
        <div className="join-code-row">
          <input placeholder="Enter 6-char join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="join-input" maxLength={6} />
          <motion.button className="btn-accent"
            onClick={handleFindTournament}
            whileTap={{ scale: 0.96 }}>
            Find →
          </motion.button>
        </div>

        {tournament && (
          <div className="tournament-badge">
            🏆 {tournament.name} &nbsp;|&nbsp; Budget: ₹{tournament.teamBudget}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Team Name</label>
            <input name="teamName" value={form.teamName} required
              onChange={(e) => setForm({...form, teamName: e.target.value})}
              placeholder="Mumbai Warriors" />
          </div>
          <div className="form-group">
            <label>Captain Name</label>
            <input name="captainName" value={form.captainName} required
              onChange={(e) => setForm({...form, captainName: e.target.value})}
              placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Captain Email</label>
            <input name="captainEmail" type="email" value={form.captainEmail}
              onChange={(e) => setForm({...form, captainEmail: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Captain Phone</label>
            <input name="captainPhone" value={form.captainPhone}
              onChange={(e) => setForm({...form, captainPhone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Team Color</label>
            <div className="color-row">
              <input type="color" value={form.teamColor}
                onChange={(e) => setForm({...form, teamColor: e.target.value})} />
              <span style={{ color: form.teamColor, fontWeight: 700 }}>
                {form.teamColor}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label>Team Logo</label>
            <input type="file" accept="image/*"
              onChange={(e) => setLogo(e.target.files[0])} />
          </div>

          <motion.button type="submit" className="btn-primary full-width"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Register Team →
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}