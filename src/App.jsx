import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import HomePage        from './pages/HomePage'
import OrganizerSetup  from './pages/OrganizerSetup'
import TeamRegister    from './pages/TeamRegister'
import PlayerManage    from './pages/PlayerManage'
import LobbyOrganizer  from './pages/LobbyOrganizer'
import LobbyCaption    from './pages/LobbyCaption'
import AuctionRoom     from './pages/AuctionRoom'
import CaptainView     from './pages/CaptainView'
import Dashboard       from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/"                             element={<HomePage />} />
        <Route path="/organizer/setup"              element={<OrganizerSetup />} />
        <Route path="/organizer/players/:tid"       element={<PlayerManage />} />
        <Route path="/organizer/lobby/:tid"         element={<LobbyOrganizer />} />
        <Route path="/organizer/auction/:tid"       element={<AuctionRoom />} />
        <Route path="/team/register"                element={<TeamRegister />} />
        <Route path="/captain/lobby/:tid"           element={<LobbyCaption />} />
        <Route path="/captain/auction/:tid"         element={<CaptainView />} />
        <Route path="/dashboard/:tid"               element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}