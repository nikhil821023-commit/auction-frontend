import api, { multipartApi } from './axios'

export const createTournament = (data, logo) => {
  const form = new FormData()
  form.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )
  if (logo) form.append('logo', logo)
  return multipartApi.post('/tournaments', form)
}

export const getAllTournaments   = ()     => api.get('/tournaments')
export const getTournament       = (id)   => api.get(`/tournaments/${id}`)

// FIX: make sure the code is trimmed + uppercased before sending
export const getTournamentByCode = (code) =>
  api.get(`/tournaments/join/${code.trim().toUpperCase()}`)

export const updateStatus = (id, status) =>
  api.patch(`/tournaments/${id}/status`, null, { params: { status } })


// Add to existing tournamentApi.js:

export const scheduleTournament = (id, data) =>
  api.post(`/tournaments/${id}/schedule`, data)

export const postponeTournament = (id, data) =>
  api.post(`/tournaments/${id}/postpone`, data)

export const extendReservation  = (id, days) =>
  api.post(`/tournaments/${id}/extend`,
    { additionalDays: days })

export const cancelTournament   = (id, reason) =>
  api.post(`/tournaments/${id}/cancel`, { reason })

export const getTournamentStatus = (id) =>
  api.get(`/tournaments/${id}/status`)

export const getByOrganizer = (email) =>
  api.get('/tournaments/by-organizer', { params: { email } })