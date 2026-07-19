import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ✅ Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ax_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ✅ Auto logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ax_token')
      localStorage.removeItem('ax_user')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export const multipartApi = axios.create({ baseURL: '/api' })

// Same interceptor for multipart
multipartApi.interceptors.request.use(config => {
  const token = localStorage.getItem('ax_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api