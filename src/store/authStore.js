import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('ax_user') || 'null'),
  token: localStorage.getItem('ax_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('ax_token', token)
    localStorage.setItem('ax_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('ax_token')
    localStorage.removeItem('ax_user')
    set({ user: null, token: null })
  },

  isLoggedIn: () => {
    const token = localStorage.getItem('ax_token')
    if (!token) return false
    try {
      // Decode JWT payload (no library needed)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }
}))