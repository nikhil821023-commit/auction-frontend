import api from './axios'

const KEY = 'auctionx_admin_2024'  // move to env in production

export const getAnalytics   = ()  => api.get(`/admin/analytics?key=${KEY}`)
export const getAdminFeedback=()  => api.get(`/admin/feedback?key=${KEY}`)
export const getTournaments  = ()  => api.get(`/admin/tournaments?key=${KEY}`)
export const trackVisit = (data)  => api.post('/admin/track', data)