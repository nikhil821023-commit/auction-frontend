import api from './axios'

export const getSummary     = (tid)         => api.get(`/post-auction/${tid}/summary`)
export const getAllSquads    = (tid)         => api.get(`/post-auction/${tid}/squads`)
export const getSquad       = (tid, teamId) => api.get(`/post-auction/${tid}/squads/${teamId}`)
export const getLeaderboard = (tid)         => api.get(`/post-auction/${tid}/leaderboard`)
export const getUnsold      = (tid)         => api.get(`/post-auction/${tid}/unsold`)
export const getChartData   = (tid)         => api.get(`/post-auction/${tid}/charts`)