import { create } from 'zustand'

export const useAuctionStore = create((set) => ({
  // Tournament & team context
  tournament:   null,
  team:         null,
  role:         null,   // 'ORGANIZER' | 'CAPTAIN'

  // Auction engine state (from WS)
  auctionState: null,
  timerState:   null,
  spinResult:   null,
  dashboard:    null,

  // Lobby state
  lobbyStatus:  null,
  settings:     null,

  // Actions
  setTournament:   (t)  => set({ tournament: t }),
  setTeam:         (t)  => set({ team: t }),
  setRole:         (r)  => set({ role: r }),
  setAuctionState: (s)  => set({ auctionState: s }),
  setTimerState:   (s)  => set({ timerState: s }),
  setSpinResult:   (s)  => set({ spinResult: s }),
  setDashboard:    (d)  => set({ dashboard: d }),
  setLobbyStatus:  (l)  => set({ lobbyStatus: l }),
  setSettings:     (s)  => set({ settings: s }),
  reset:           ()   => set({
    auctionState: null, timerState: null,
    spinResult: null,   dashboard: null
  })
}))