import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackVisit } from '../api/adminApi'

function makeSessionId() {
  // Modern browsers
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback (good enough for session tracking)
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Call this once in App.jsx — auto-tracks every page navigation.
 */
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('ax_session')
    if (!sessionId) {
      sessionId = makeSessionId()
      sessionStorage.setItem('ax_session', sessionId)
    }

    const path = location.pathname

    // Detect role from URL
    let role = 'SPECTATOR'
    if (path.includes('/organizer')) role = 'ORGANIZER'
    else if (path.includes('/captain')) role = 'CAPTAIN'
    else if (path.includes('/team')) role = 'CAPTAIN'

    // Extract tournamentId from URL if present (e.g. /dashboard/123)
    const match = path.match(/\/(\d+)(?:\/|$)/)
    const tournamentId = match ? match[1] : null

    trackVisit({
      sessionId,
      role,
      page: path,
      tournamentId,
      userAgent: navigator.userAgent,
    }).catch(() => {}) // silent fail — never break UX for tracking
  }, [location.pathname])
}