import { useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuctionStore } from '../store/auctionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { getDashboard } from '../api/auctionApi'
import TeamBudgetCard from '../components/TeamBudgetCard'
import AuctionFeed    from '../components/AuctionFeed'

export default function Dashboard() {
  const { tid }       = useParams()
  const { dashboard, setDashboard } = useAuctionStore()

  useWebSocket(useCallback((client) => {
    client.subscribe(`/topic/dashboard/${tid}`, (msg) => {
      setDashboard(JSON.parse(msg.body))
    })
  }, [tid]))

  useEffect(() => {
    getDashboard(tid).then(r => setDashboard(r.data)).catch(() => {})
  }, [tid])

  if (!dashboard) return (
    <div className="page-bg center-all">
      <div className="loading-text">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="dashboard-bg">
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 {dashboard.tournamentName}</h1>
        <div className="dashboard-stats-row">
          <span>🔨 Sold: {dashboard.playersSold}</span>
          <span>❌ Unsold: {dashboard.playersUnsold}</span>
          <span>⏳ Remaining: {dashboard.playersRemaining}</span>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="teams-grid">
          {dashboard.teams?.map((team, i) => (
            <motion.div key={team.teamId}
              initial={{ opacity:0, y:30 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.08 }}
              layout>
              <TeamBudgetCard team={team} />
            </motion.div>
          ))}
        </div>
        <div className="feed-sidebar">
          <AuctionFeed feed={dashboard.recentActivity || []} full />
        </div>
      </div>
    </div>
  )
}