
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Multipart helper
export const multipartApi = axios.create({ baseURL: '/api' })

export default api