import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

// Page/component imports
import OrganizerSetup   from './pages/OrganizerSetup'
import TeamRegister     from './pages/TeamRegister'
import PlayerManage     from './pages/PlayerManage'
import LobbyOrganizer   from './pages/LobbyOrganizer'
import LobbyCaption     from './pages/LobbyCaption'
import AuctionRoom      from './pages/AuctionRoom'
import CaptainView      from './pages/CaptainView'
import Dashboard        from './pages/Dashboard'
import PostAuction      from './pages/PostAuction'
import SpectatorView    from './pages/SpectatorView'
import FeedbackForm     from './components/FeedbackForm'
import LandingPage      from './pages/LandingPage'
import AdminDashboard   from './pages/AdminDashboard'
import BidHistory       from './pages/BidHistory'
import MyTournaments    from './pages/MyTournaments'
import ProjectorView    from './pages/ProjectorView'
import AuthPage         from './pages/AuthPage'
import { usePageTracking } from './hooks/usePageTracking'
import { useAuthStore } from './store/authStore'

// ── Protected route wrapper ──────────────────────────────
function Protected({ children }) {
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) navigate('/auth', { replace: true })
    // eslint-disable-next-line
  }, [])

  return isLoggedIn() ? children : null
}

// ── Main application routing ─────────────────────────────
function AppWithTracking() {
  usePageTracking()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"                      element={<LandingPage />} />
      <Route path="/auth"                  element={<AuthPage />} />
      <Route path="/team/register"         element={<TeamRegister />} />
      <Route path="/captain/lobby/:tid"    element={<LobbyCaption />} />
      <Route path="/captain/auction/:tid"  element={<CaptainView />} />
      <Route path="/spectate/:tid"         element={<SpectatorView />} />
      <Route path="/dashboard/:tid"        element={<Dashboard />} />

      {/* Protected routes */}
      <Route path="/organizer/setup"          element={
        <Protected><OrganizerSetup /></Protected>
      }/>
      <Route path="/organizer/players/:tid"   element={
        <Protected><PlayerManage /></Protected>
      }/>
      <Route path="/organizer/lobby/:tid"     element={
        <Protected><LobbyOrganizer /></Protected>
      }/>
      <Route path="/organizer/auction/:tid"   element={
        <Protected><AuctionRoom /></Protected>
      }/>
      <Route path="/post-auction/:tid"        element={
        <Protected><PostAuction /></Protected>
      }/>
      <Route path="/my-tournaments"           element={
        <Protected><MyTournaments /></Protected>
      }/>
      <Route path="/bid-history/:tid"         element={
        <Protected><BidHistory /></Protected>
      }/>
      <Route path="/feedback/:tid"            element={<FeedbackForm />} />
      <Route path="/projector/:tid"           element={<ProjectorView />} />
      <Route path="/admin"                    element={<AdminDashboard />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppWithTracking />
    </BrowserRouter>
  )
}