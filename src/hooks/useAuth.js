import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Protects a page — redirects to /auth if not logged in.
 * Usage: call inside any page that requires login.
 */
export function useRequireAuth() {
  const navigate   = useNavigate()
  const { isLoggedIn, user } = useAuthStore()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/auth', { replace: true })
    }
  }, [])

  return { user }
}

/**
 * Redirects to home if already logged in
 * (prevents showing login page when already authed)
 */
export function useRedirectIfAuthed() {
  const navigate   = useNavigate()
  const { isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/', { replace: true })
    }
  }, [])
}