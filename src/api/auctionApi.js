import api from './axios'

export const initAuction    = (tid)       => api.post(`/auction/${tid}/init`)
export const spinWheel      = (tid)       => api.post(`/auction/${tid}/spin`)
export const startBidding   = (tid)       => api.post(`/auction/${tid}/start-bidding`)
export const placeBid       = (tid, dto)  => api.post(`/auction/${tid}/bid`, dto)
export const soldPlayer     = (tid)       => api.post(`/auction/${tid}/sold`)
export const markUnsold     = (tid)       => api.post(`/auction/${tid}/unsold`)
export const pauseAuction   = (tid)       => api.post(`/auction/${tid}/pause`)
export const resumeAuction  = (tid)       => api.post(`/auction/${tid}/resume`)
export const reAuction      = (tid)       => api.post(`/auction/${tid}/re-auction`)
export const completeAuction= (tid)       => api.post(`/auction/${tid}/complete`)
export const getDashboard   = (tid)       => api.get(`/auction/${tid}/dashboard`)
export const getSummary     = (tid)         => api.get(`/post-auction/${tid}/summary`)
export const getAllSquads    = (tid)         => api.get(`/post-auction/${tid}/squads`)
export const getSquad       = (tid, teamId) => api.get(`/post-auction/${tid}/squads/${teamId}`)
export const getLeaderboard = (tid)         => api.get(`/post-auction/${tid}/leaderboard`)
export const getUnsold      = (tid)         => api.get(`/post-auction/${tid}/unsold`)
export const getChartData   = (tid)         => api.get(`/post-auction/${tid}/charts`)

// Add to existing src/api/auctionApi.js

export const selfBid = (tid, dto) =>
  api.post(`/auction/${tid}/self-bid`, dto)

export const getCaptainToken = (tid, teamId) =>
  api.get(`/auction/${tid}/captain-token`, { params: { teamId } })

export const getBidMode = (tid) =>
  api.get(`/auction/${tid}/bid-mode`)

export const setBidMode = (tid, mode) =>
  api.post(`/auction/${tid}/set-bid-mode`, null, { params: { mode } })