import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { createTournament } from '../api/tournamentApi'

export default function OrganizerSetup() {
  const navigate = useNavigate()
  const [logo, setLogo] = useState(null)
  const [form, setForm] = useState({
    name: '', sportType: 'cricket', tournamentDate: '',
    teamBudget: 5000, maxPlayersPerTeam: 15,
    basePrice: 100,  bidIncrement: 50
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await createTournament(form, logo)
      const t = res.data
      toast.success(`✅ Tournament created! Join Code: ${t.joinCode}`)
      navigate(`/organizer/players/${t.id}`, { state: { tournament: t } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create tournament')
    }
  }

  return (
    <div className="page-bg">
      <motion.div className="form-card"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>

        <h2 className="form-title">🎯 Create Tournament</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Tournament Name</label>
            <input name="name" value={form.name}
              onChange={handleChange} required placeholder="IPL 2025" />
          </div>

          <div className="form-group">
            <label>Sport Type</label>
            <select name="sportType" value={form.sportType} onChange={handleChange}>
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
              <option value="kabaddi">Kabaddi</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tournament Date</label>
            <input name="tournamentDate" type="date"
              value={form.tournamentDate} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Team Budget (₹)</label>
            <input name="teamBudget" type="number"
              value={form.teamBudget} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Max Players Per Team</label>
            <input name="maxPlayersPerTeam" type="number"
              value={form.maxPlayersPerTeam} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Base Bid Price (₹)</label>
            <input name="basePrice" type="number"
              value={form.basePrice} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Bid Increment (₹)</label>
            <input name="bidIncrement" type="number"
              value={form.bidIncrement} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Tournament Logo</label>
            <input type="file" accept="image/*"
              onChange={(e) => setLogo(e.target.files[0])} />
          </div>

          <motion.button type="submit" className="btn-primary full-width"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Create Tournament →
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}