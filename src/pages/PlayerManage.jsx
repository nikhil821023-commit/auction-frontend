import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { addPlayer, bulkUploadPlayers, getPlayers, removePlayer, removePlayers, updatePlayer } from '../api/playerApi'
import api from '../api/axios'
import { playerImageUrl } from '../utils/imageUrl'

const TIERS = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE']
const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'WK-Batsman', 'WK']

const tierColors = {
  PLATINUM: '#e5c100',
  GOLD: '#f97316',
  SILVER: '#94a3b8',
  BRONZE: '#b45309',
}

export default function PlayerManage() {
  const { tid } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const tournament = state?.tournament

  const [players, setPlayers] = useState([])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [csvFile, setCsv] = useState(null)
  const [zipFile, setZip] = useState(null)
  const [tab, setTab] = useState('single')
  const [uploading, setUploading] = useState(false)

  // Additional state for selection/edit/removal
  const [selected, setSelected] = useState(new Set())    // selected player IDs
  const [editPlayer, setEditPlayer] = useState(null)     // player being edited
  const [editForm, setEditForm] = useState({})
  const [editPhoto, setEditPhoto] = useState(null)
  const [confirmRemove, setConfirm] = useState(null)      // playerId to confirm remove

  const [form, setForm] = useState({
    name: '',
    role: 'Batsman',
    nationality: 'Indian',
    age: '',
    matches: '',
    average: '',
    strikeRate: '',
    basePrice: '',
    tier: 'GOLD',
    tournamentId: tid,
  })

  useEffect(() => {
    getPlayers(tid)
      .then((r) => setPlayers(r.data))
      .catch(() => {})
  }, [tid])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    setPhoto(file)
    if (file) setPhotoPreview(URL.createObjectURL(file))
    else setPhotoPreview(null)
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      const res = await addPlayer({ ...form, tournamentId: Number(tid) }, photo)
      setPlayers((prev) => [...prev, res.data])
      toast.success(`✅ ${res.data.name} added!`)
      setForm({
        ...form,
        name: '',
        age: '',
        matches: '',
        average: '',
        strikeRate: '',
      })
      setPhoto(null)
      setPhotoPreview(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add player')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkCSV = async (e) => {
    e.preventDefault()
    if (!csvFile) return toast.error('Select a CSV file first')
    setUploading(true)
    try {
      const res = await bulkUploadPlayers(csvFile, Number(tid))
      const data = res.data
      const count = data.count || data.length || 0
      // Reload full player list
      const fresh = await getPlayers(tid)
      setPlayers(fresh.data)
      toast.success(`✅ ${count} players uploaded!`)
      setCsv(null)
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Bulk upload failed. Check CSV format.'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleBulkZIP = async (e) => {
    e.preventDefault()
    if (!zipFile) return toast.error('Select a ZIP file first')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', zipFile)

      const res = await api.post(`/players/bulk-zip?tournamentId=${tid}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const data = res.data
      toast.success(`✅ ${data.count} players uploaded with images!`)

      const fresh = await getPlayers(tid)
      setPlayers(fresh.data)
      setZip(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'ZIP upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Selection and edit handlers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleRemoveOne = async (playerId, playerName) => {
    setConfirm({ id: playerId, name: playerName })
  }

  // ✅ FIX 1: fixed confirmRemoveOne to use current confirmRemove, remove from selected, and always close modal
  const confirmRemoveOne = async () => {
    if (!confirmRemove) return
    try {
      await removePlayer(confirmRemove.id)
      setPlayers(prev =>
        prev.filter(p => p.id !== confirmRemove.id))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(confirmRemove.id)
        return next
      })
      toast.success(`🗑️ ${confirmRemove.name} removed`)
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Remove failed')
    } finally {
      setConfirm(null)
    }
  }

  // ✅ FIX 2: fixed handleBulkRemove to await and work on correct snapshot of selected
  const handleBulkRemove = async () => {
    if (selected.size === 0) {
      toast.error('Select players first')
      return
    }
    const ids = [...selected]
    try {
      const res  = await removePlayers(ids)
      const data = res.data
      setPlayers(prev =>
        prev.filter(p => !ids.includes(p.id)))
      setSelected(new Set())
      toast.success(`🗑️ ${data.count} players removed`)
      if (data.failed?.length > 0) {
        toast.error(
          'Could not remove: ' + data.failed.join(', '),
          { duration: 5000 })
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Bulk remove failed')
    }
  }

  const handleEditSave = async () => {
    try {
      const res = await updatePlayer(
        editPlayer.id, editForm, editPhoto)
      setPlayers(prev =>
        prev.map(p => p.id === editPlayer.id ? res.data : p))
      toast.success(`✅ ${res.data.name} updated`)
      setEditPlayer(null)
      setEditPhoto(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    }
  }

  return (
    <div className="page-bg">
      <div className="player-manage-layout">
        {/* LEFT: Upload forms */}
        <motion.div
          className="form-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="form-title">👤 Player Pool</h2>

          {/* Tabs */}
          <div className="tab-row">
            {[
              { key: 'single', label: '➕ Single' },
              { key: 'csv', label: '📋 CSV' },
              { key: 'zip', label: '🗜️ ZIP + Images' },
            ].map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* SINGLE PLAYER */}
            {tab === 'single' && (
              <motion.form
                key="single"
                onSubmit={handleAddPlayer}
                className="form-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="form-group">
                  <label>Player Name *</label>
                  <input
                    value={form.name}
                    required
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Virat Kohli"
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tier</label>
                    <select
                      value={form.tier}
                      onChange={(e) => setForm({ ...form, tier: e.target.value })}
                    >
                      {TIERS.map((t) => (
                        <option key={t} style={{ color: tierColors[t] }}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Matches</label>
                    <input
                      type="number"
                      value={form.matches}
                      onChange={(e) =>
                        setForm({ ...form, matches: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Batting Avg</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.average}
                      onChange={(e) =>
                        setForm({ ...form, average: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Strike Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.strikeRate}
                      onChange={(e) =>
                        setForm({ ...form, strikeRate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Base Price (₹)</label>
                  <input
                    type="number"
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm({ ...form, basePrice: e.target.value })
                    }
                  />
                </div>

                {/* Photo upload with preview */}
                <div className="form-group">
                  <label>Player Photo</label>
                  <div className="photo-upload-row">
                    {photoPreview ? (
                      <div className="photo-preview-wrap">
                        <img
                          src={photoPreview}
                          alt="preview"
                          className="photo-preview"
                        />
                        <button
                          type="button"
                          className="photo-clear"
                          onClick={() => {
                            setPhoto(null)
                            setPhotoPreview(null)
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="photo-upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          style={{ display: 'none' }}
                        />
                        <div className="photo-upload-placeholder">
                          <span className="photo-upload-icon">📷</span>
                          <span>Click to upload photo</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="btn-primary full-width"
                  disabled={uploading}
                  whileTap={{ scale: 0.97 }}
                >
                  {uploading ? '⏳ Adding...' : '➕ Add Player'}
                </motion.button>
              </motion.form>
            )}

            {/* CSV BULK */}
            {tab === 'csv' && (
              <motion.form
                key="csv"
                onSubmit={handleBulkCSV}
                className="form-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="csv-hint">
                  <p className="csv-hint-title">📋 CSV Format (9 columns):</p>
                  <code>
                    name, role, nationality, age, matches, average, strikeRate,
                    basePrice, tier
                  </code>
                  <p className="csv-hint-note">
                    ℹ️ Images not included — use ZIP upload for bulk + images
                  </p>
                </div>

                <div className="csv-example">
                  <p className="csv-example-title">Example rows:</p>
                  <code>
                    Virat Kohli,Batsman,Indian,35,274,53.5,93.2,1000,PLATINUM
                  </code>
                  <code>
                    Jasprit Bumrah,Bowler,Indian,30,120,0,0,800,GOLD
                  </code>
                </div>

                <div className="form-group">
                  <label>Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsv(e.target.files[0])}
                  />
                  {csvFile && (
                    <span className="file-selected">✅ {csvFile.name}</span>
                  )}
                </div>

                <motion.button
                  type="submit"
                  className="btn-primary full-width"
                  disabled={uploading || !csvFile}
                  whileTap={{ scale: 0.97 }}
                >
                  {uploading ? '⏳ Uploading...' : '📤 Upload Players'}
                </motion.button>
              </motion.form>
            )}

            {/* ZIP + IMAGES BULK */}
            {tab === 'zip' && (
              <motion.form
                key="zip"
                onSubmit={handleBulkZIP}
                className="form-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="zip-hint">
                  <p className="zip-hint-title">🗜️ ZIP Structure:</p>
                  <div className="zip-tree">
                    <div className="zip-tree-item root">📦 players.zip</div>
                    <div className="zip-tree-item l1">📄 players.csv</div>
                    <div className="zip-tree-item l1">📁 images/</div>
                    <div className="zip-tree-item l2">🖼️ virat.jpg</div>
                    <div className="zip-tree-item l2">🖼️ rohit.png</div>
                    <div className="zip-tree-item l2">🖼️ bumrah.jpg</div>
                  </div>
                  <div className="zip-rules">
                    <p>✅ Image filename must match player name</p>
                    <p>
                      ✅ <code>virat kohli.jpg</code> or <code>virat.jpg</code>
                    </p>
                    <p>✅ Case insensitive</p>
                    <p>✅ Formats: jpg, jpeg, png, webp</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select ZIP File</label>
                  <label className="zip-upload-label">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setZip(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <div className={`zip-upload-area ${zipFile ? 'has-file' : ''}`}>
                      {zipFile ? (
                        <>
                          <span className="zip-icon">✅</span>
                          <span className="zip-filename">{zipFile.name}</span>
                          <span className="zip-size">
                            {(zipFile.size / 1024).toFixed(0)} KB
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="zip-icon">🗜️</span>
                          <span>Click to select ZIP file</span>
                          <span className="zip-sub">CSV + images bundled</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <motion.button
                  type="submit"
                  className="btn-primary full-width"
                  disabled={uploading || !zipFile}
                  whileTap={{ scale: 0.97 }}
                >
                  {uploading ? '⏳ Extracting & uploading...' : '🚀 Upload ZIP with Images'}
                </motion.button>

                {uploading && (
                  <div className="upload-progress">
                    <div className="upload-progress-bar" />
                    <span>Extracting images and saving players...</span>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          <motion.button
            className="btn-accent full-width mt-2"
            onClick={() =>
              navigate(`/organizer/lobby/${tid}`, { state: { tournament } })
            }
            whileTap={{ scale: 0.97 }}
          >
            Go to Lobby → ({players.length} players ready)
          </motion.button>
        </motion.div>

        {/* RIGHT: player list panel */}
        <motion.div className="player-list-panel"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>

          <div className="plp-header">
            <h3 className="panel-title">
              Player Pool
              <span className="panel-count">({players.length})</span>
            </h3>

            {/* Bulk actions */}
            {selected.size > 0 && (
              <motion.div className="plp-bulk-actions"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}>
                <span className="plp-selected-count">
                  {selected.size} selected
                </span>
                <motion.button className="plp-bulk-remove-btn"
                  onClick={handleBulkRemove}
                  whileTap={{ scale: 0.97 }}>
                  🗑️ Remove Selected
                </motion.button>
                <button className="plp-clear-btn"
                  onClick={() => setSelected(new Set())}>
                  ✕ Clear
                </button>
              </motion.div>
            )}
          </div>

          {/* Select all */}
          {players.length > 0 && (
            <div className="plp-select-all">
              <label>
                <input type="checkbox"
                  checked={selected.size === players.length
                    && players.length > 0}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelected(new Set(players.map(p => p.id)))
                    } else {
                      setSelected(new Set())
                    }
                  }} />
                Select All ({players.length})
              </label>
            </div>
          )}

          <div className="player-grid">
            {players.map(p => (
              <motion.div key={p.id}
                className={`player-mini-card ${selected.has(p.id) ? 'selected' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout>

                {/* Selection checkbox */}
                <div className="pmc-checkbox"
                  onClick={() => toggleSelect(p.id)}>
                  <input type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => { }}
                    onClick={e => e.stopPropagation()} />
                </div>

                {/* Photo */}
                <PlayerThumb player={p} />

                {/* Info */}
                <div className="player-mini-info">
                  <span className="player-mini-name">{p.name}</span>
                  <span className="player-mini-role">{p.role}</span>
                  <span className="player-mini-price">
                    ₹{p.basePrice?.toLocaleString()}
                  </span>
                  <span className="tier-badge"
                    style={{ background: tierColors[p.tier] || '#555' }}>
                    {p.tier}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="pmc-actions">
                  <motion.button
                    className="pmc-edit-btn"
                    title="Edit player"
                    onClick={() => {
                      setEditPlayer(p)
                      setEditForm({
                        name: p.name,
                        role: p.role,
                        nationality: p.nationality,
                        age: p.age,
                        matches: p.matches,
                        average: p.average,
                        strikeRate: p.strikeRate,
                        basePrice: p.basePrice,
                        tier: p.tier,
                      })
                    }}
                    whileTap={{ scale: 0.9 }}>
                    ✏️
                  </motion.button>
                  <motion.button
                    className="pmc-remove-btn"
                    title="Remove player"
                    onClick={() => handleRemoveOne(p.id, p.name)}
                    whileTap={{ scale: 0.9 }}>
                    🗑️
                  </motion.button>
                </div>

              </motion.div>
            ))}
          </div>

          {players.length === 0 && (
            <div className="empty-pool">
              <span>🏏</span>
              <p>No players yet. Add players on the left.</p>
            </div>
          )}
        </motion.div>

        {/* ── Confirm Remove Modal ─────────────────────────── */}
        <AnimatePresence>
          {confirmRemove && (
            <motion.div className="confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirm(null)}>
              <motion.div className="confirm-box"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}>
                <div className="confirm-icon">🗑️</div>
                <h3>Remove Player?</h3>
                <p>
                  Remove <strong>{confirmRemove.name}</strong>
                  {' '}from the player pool?
                  This cannot be undone.
                </p>
                <div className="confirm-actions">
                  <button className="btn-secondary"
                    onClick={() => setConfirm(null)}>
                    Cancel
                  </button>
                  <motion.button className="confirm-remove-btn"
                    onClick={confirmRemoveOne}
                    whileTap={{ scale: 0.97 }}>
                    🗑️ Yes, Remove
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Edit Player Modal ────────────────────────────── */}
        <AnimatePresence>
          {editPlayer && (
            <motion.div className="confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditPlayer(null)}>
              <motion.div className="edit-player-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}>

                <div className="epm-header">
                  <h3>✏️ Edit Player</h3>
                  <button onClick={() => setEditPlayer(null)}>✕</button>
                </div>

                <div className="epm-body">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input value={editForm.name || ''}
                        onChange={e => setEditForm(f => ({
                          ...f, name: e.target.value
                        }))} />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select value={editForm.role || ''}
                        onChange={e => setEditForm(f => ({
                          ...f, role: e.target.value
                        }))}>
                        {ROLES.map(r => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Base Price</label>
                      <input type="number" value={editForm.basePrice || ''}
                        onChange={e => setEditForm(f => ({
                          ...f, basePrice: e.target.value
                        }))} />
                    </div>
                    <div className="form-group">
                      <label>Tier</label>
                      <select value={editForm.tier || ''}
                        onChange={e => setEditForm(f => ({
                          ...f, tier: e.target.value
                        }))}>
                        {TIERS.map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Photo (optional)</label>
                    <input type="file" accept="image/*"
                      onChange={e => setEditPhoto(
                        e.target.files[0])} />
                  </div>
                </div>

                <div className="epm-footer">
                  <button className="btn-secondary"
                    onClick={() => setEditPlayer(null)}>
                    Cancel
                  </button>
                  <motion.button className="btn-primary"
                    onClick={handleEditSave}
                    whileTap={{ scale: 0.97 }}>
                    ✅ Save Changes
                  </motion.button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        

      </div>
    </div>
  )
}

// ── Reusable player thumbnail with broken-image fallback ─────────────
function PlayerThumb({ player, size = 56 }) {
  const [imgError, setImgError] = useState(false)
  const src = playerImageUrl(player?.photoPath)

  if (!src || imgError) {
    return (
      <div
        className="player-thumb-placeholder"
        style={{ width: size, height: size }}
      >
        {player?.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={player?.name}
      className="player-thumb"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  )
}

// Export PlayerThumb for use elsewhere
export { PlayerThumb }