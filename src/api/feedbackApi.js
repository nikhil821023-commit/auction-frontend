import api from './axios'

export const submitFeedback    = (data)  => api.post('/feedback', data)
export const getFeedback       = (tid)   => api.get(`/feedback/${tid}`)
export const getFeedbackSummary= (tid)   => api.get(`/feedback/${tid}/summary`)