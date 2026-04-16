import { motion } from 'framer-motion'
import { placeBid } from '../api/auctionApi'
import toast from 'react-hot-toast'

export default function BidPanel({ teams, phase, tournamentId, bidIncrement, currentBid }) {
  if (phase !== 'BIDDING') return null

  const handleBid = async (team) => {
    try {
      await placeBid(tournamentId, {
        teamId: team.id || team.teamId,
        captainName: team.captainName,
        teamName: team.teamName,
        teamColor: team.teamColor,
        useAutoIncrement: true
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bid failed')
    }
  }

  return (
    <div className="bid-panel">
      <div className="bid-panel-title">
        💰 Place Bid (+₹{bidIncrement})
      </div>
      <div className="bid-buttons-grid">
        {teams.map((team, i) => (
          <motion.button
            key={team.id || team.teamId}
            className="bid-captain-btn"
            style={{
              borderColor: team.teamColor || '#e63946',
              '--team-color': team.teamColor || '#e63946'
            }}
            onClick={() => handleBid(team)}
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale:1.04, backgroundColor: team.teamColor+'22' }}
            whileTap={{ scale:0.96 }}>
            <span className="bid-btn-captain">{team.captainName}</span>
            <span className="bid-btn-team">{team.teamName}</span>
            <span className="bid-btn-budget">
              ₹{team.remainingBudget?.toLocaleString()}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}