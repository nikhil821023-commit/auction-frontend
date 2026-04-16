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