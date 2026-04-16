import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { addPlayer, bulkUploadPlayers, getPlayers } from '../api/playerApi'

const TIERS  = ['PLATINUM','GOLD','SILVER','BRONZE']
const ROLES  = ['Batsman','Bowler','All-Rounder','WK-Batsman','WK']

export default function PlayerManage() {
  const { tid }       = useParams()
  const { state }     = useLocation()
  const navigate      = useNavigate()
  const tournament    = state?.tournament
  const [players, setPlayers] = useState([])
  const [photo, setPhoto]     = useState(null)
  const [csvFile, setCsv]     = useState(null)
  const [tab, setTab]         = useState('single') // 'single' | 'bulk'
  const [form, setForm]       = useState({
    name: '', role: 'Batsman', nationality: 'Indian',
    age: '', matches: '', average: '', strikeRate: '',
    basePrice: '', tier: 'GOLD', tournamentId: tid
  })

  useEffect(() => {
    getPlayers(tid).then(r => setPlayers(r.data)).catch(() => {})
  }, [tid])

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    try {
      const res = await addPlayer({ ...form, tournamentId: Number(tid) }, photo)
      setPlayers(prev => [...prev, res.data])
      toast.success(`✅ ${res.data.name} added!`)
      setForm({ ...form, name: '', age: '', matches: '', average: '', strikeRate: '' })
      setPhoto(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add player')
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!csvFile) return toast.error('Select a CSV file first')
    try {
      const res = await bulkUploadPlayers(csvFile, Number(tid))
      setPlayers(prev => [...prev, ...res.data])
      toast.success(`✅ ${res.data.length} players uploaded!`)
      setCsv(null)
    } catch {
      toast.error('Bulk upload failed. Check CSV format.')
    }
  }

  const tierColor = { PLATINUM:'#e5c100', GOLD:'#f97316', SILVER:'#94a3b8', BRONZE:'#b45309' }

  return (
    <div className="page-bg">
      <div className="player-manage-layout">

        {/* LEFT: form */}
        <motion.div className="form-card"
          initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }}>

          <h2 className="form-title">👤 Player Pool</h2>

          <div className="tab-row">
            {['single','bulk'].map(t => (
              <button key={t} className={`tab-btn ${tab===t?'active':''}`}
                onClick={() => setTab(t)}>
                {t === 'single' ? '➕ Single' : '📋 Bulk CSV'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'single' ? (
              <motion.form key="single" onSubmit={handleAddPlayer}
                className="form-grid"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

                <div className="form-group">
                  <label>Player Name</label>
                  <input value={form.name} required
                    onChange={e => setForm({...form, name: e.target.value})} />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select value={form.role}
                      onChange={e => setForm({...form, role: e.target.value})}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tier</label>
                    <select value={form.tier}
                      onChange={e => setForm({...form, tier: e.target.value})}>
                      {TIERS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" value={form.age}
                      onChange={e => setForm({...form, age: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Matches</label>
                    <input type="number" value={form.matches}
                      onChange={e => setForm({...form, matches: e.target.value})} />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Avg</label>
                    <input type="number" step="0.1" value={form.average}
                      onChange={e => setForm({...form, average: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>SR</label>
                    <input type="number" step="0.1" value={form.strikeRate}
                      onChange={e => setForm({...form, strikeRate: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Base Price (₹)</label>
                  <input type="number" value={form.basePrice}
                    onChange={e => setForm({...form, basePrice: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Player Photo</label>
                  <input type="file" accept="image/*"
                    onChange={e => setPhoto(e.target.files[0])} />
                </div>

                <motion.button type="submit" className="btn-primary full-width"
                  whileTap={{ scale: 0.97 }}>
                  Add Player
                </motion.button>
              </motion.form>
            ) : (
              <motion.form key="bulk" onSubmit={handleBulkUpload}
                className="form-grid"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

                <div className="csv-hint">
                  <p>CSV columns (in order):</p>
                  <code>name, role, nationality, age, matches, average, strikeRate, basePrice, tier</code>
                </div>

                <div className="form-group">
                  <label>Upload CSV File</label>
                  <input type="file" accept=".csv"
                    onChange={e => setCsv(e.target.files[0])} />
                </div>

                <motion.button type="submit" className="btn-primary full-width"
                  whileTap={{ scale: 0.97 }}>
                  📤 Upload All Players
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <motion.button className="btn-accent full-width mt-2"
            onClick={() => navigate(`/organizer/lobby/${tid}`, { state: { tournament } })}
            whileTap={{ scale: 0.97 }}>
            Go to Lobby → ({players.length} players ready)
          </motion.button>
        </motion.div>

        {/* RIGHT: player list */}
        <motion.div className="player-list-panel"
          initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }}>
          <h3 className="panel-title">Player Pool ({players.length})</h3>
          <div className="player-grid">
            {players.map(p => (
              <motion.div key={p.id} className="player-mini-card"
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1 }}
                layout>
                {p.photoPath
                  ? <img src={`/${p.photoPath}`} alt={p.name} className="player-thumb" />
                  : <div className="player-thumb-placeholder">
                      {p.name.charAt(0)}
                    </div>
                }
                <div className="player-mini-info">
                  <span className="player-mini-name">{p.name}</span>
                  <span className="player-mini-role">{p.role}</span>
                  <span className="player-mini-price">₹{p.basePrice}</span>
                  <span className="tier-badge"
                    style={{ background: tierColor[p.tier] || '#555' }}>
                    {p.tier}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}