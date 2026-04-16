import api from './axios'

export const validateJoin  = (joinCode, teamId)     => api.post('/auth/validate-join', { joinCode, teamId })
export const getLobbyStatus= (tournamentId)          => api.get(`/lobby/${tournamentId}/status`)
export const saveSettings  = (tournamentId, settings)=> api.post(`/lobby/${tournamentId}/settings`, settings)
export const getSettings   = (tournamentId)          => api.get(`/lobby/${tournamentId}/settings`)
export const startAuction  = (tournamentId)          => api.post(`/lobby/${tournamentId}/start`)