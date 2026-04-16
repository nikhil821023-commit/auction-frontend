import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getLobbyStatus, saveSettings, startAuction } from '../api/lobbyApi'
import { initAuction } from '../api/auctionApi'
import { useWebSocket } from '../hooks/useWebSocket'

export default function LobbyOrganizer() {
  const { tid }         = useParams()
  const { state }       = useLocation()
  const navigate        = useNavigate()
  const tournament      = state?.tournament
  const [lobby, setLobby]   = useState(null)
  const [settings, setSettings] = useState({
    bidTimerSeconds: 30, bidTimerResetSeconds: 10,
    autoSpin: true, pauseBetweenPlayers: 5, allowTierOrder: true
  })

  const { sendMessage } = useWebSocket(useCallback((client) => {
    client.subscribe(`/topic/lobby/${tid}`, (msg) => {
      setLobby(JSON.parse(msg.body))
    })
    client.subscribe(`/topic/lobby/${tid}/start`, () => {
      handleLaunchAuction()
    })
  }, [tid]))

  useEffect(() => {
    getLobbyStatus(tid).then(r => setLobby(r.data)).catch(() => {})
  }, [tid])

  const handleSaveSettings = async () => {
    try {
      await saveSettings(Number(tid), { ...settings, tournamentId: Number(tid) })
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save settings') }
  }

  const handleStartAuction = async () => {
    try {
      await startAuction(tid)
      await initAuction(tid)
      navigate(`/organizer/auction/${tid}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot start yet')
    }
  }

  const handleLaunchAuction = () => navigate(`/organizer/auction/${tid}`)

  const isReady = lobby?.lobbyState === 'READY_TO_START'

  return (
    <div className="page-bg">
      <div className="lobby-layout">

        {/* LEFT: settings */}
        <motion.div className="form-card"
          initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }}>
          <h2 className="form-title">⚙️ Auction Settings</h2>

          <div className="settings-grid">
            <div className="form-group">
              <label>Bid Timer (seconds)</label>
              <input type="number" value={settings.bidTimerSeconds}
                onChange={e => setSettings({...settings, bidTimerSeconds: +e.target.value})} />
            </div>
            <div className="form-group">
              <label>Timer Reset on Bid (seconds)</label>
              <input type="number" value={settings.bidTimerResetSeconds}
                onChange={e => setSettings({...settings, bidTimerResetSeconds: +e.target.value})} />
            </div>
            <div className="form-group">
              <label>Pause Between Players (seconds)</label>
              <input type="number" value={settings.pauseBetweenPlayers}
                onChange={e => setSettings({...settings, pauseBetweenPlayers: +e.target.value})} />
            </div>
            <div className="toggle-row">
              <label>Auto-Spin After Sale</label>
              <input type="checkbox" checked={settings.autoSpin}
                onChange={e => setSettings({...settings, autoSpin: e.target.checked})} />
            </div>
            <div className="toggle-row">
              <label>Auction by Tier (Platinum first)</label>
              <input type="checkbox" checked={settings.allowTierOrder}
                onChange={e => setSettings({...settings, allowTierOrder: e.target.checked})} />
            </div>
          </div>

          <motion.button className="btn-secondary full-width"
            onClick={handleSaveSettings} whileTap={{ scale: 0.97 }}>
            💾 Save Settings
          </motion.button>

          <motion.button
            className={`btn-primary full-width mt-2 ${!isReady ? 'disabled' : ''}`}
            onClick={handleStartAuction}
            whileTap={{ scale: 0.97 }}
            disabled={!isReady}>
            🚀 Start Auction
            {!isReady && <span className="btn-hint"> (waiting for teams)</span>}
          </motion.button>
        </motion.div>

        {/* RIGHT: live lobby */}
        <motion.div className="lobby-right"
          initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }}>

          <div className="lobby-header">
            <h3>🏟️ Lobby Room</h3>
            <div className="lobby-state-badge" data-state={lobby?.lobbyState}>
              {lobby?.lobbyState || 'LOADING'}
            </div>
          </div>

          <div className="lobby-stats">
            <div className="stat-box">
              <span className="stat-num">{lobby?.totalTeams || 0}</span>
              <span className="stat-label">Teams Joined</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{lobby?.readyTeams || 0}</span>
              <span className="stat-label">Ready</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{lobby?.totalPlayersInPool || 0}</span>
              <span className="stat-label">Players</span>
            </div>
          </div>

          <div className="captain-list">
            {lobby?.connectedCaptains?.map(c => (
              <motion.div key={c.sessionId} className="captain-row"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                layout>
                <div className="captain-color-dot"
                  style={{ background: c.teamColor || '#666' }} />
                <div className="captain-info">
                  <span className="captain-name">{c.captainName}</span>
                  <span className="captain-team">{c.teamName}</span>
                </div>
                <div className={`ready-badge ${c.isReady ? 'ready' : 'not-ready'}`}>
                  {c.isReady ? '✅ Ready' : '⏳ Waiting'}
                </div>
              </motion.div>
            ))}
            {(!lobby?.connectedCaptains?.length) && (
              <div className="empty-lobby">Waiting for captains to join...</div>
            )}
          </div>

          {tournament && (
            <div className="join-code-display">
              Share Code: <strong>{tournament.joinCode}</strong>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}