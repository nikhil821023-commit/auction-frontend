import api, { multipartApi } from './axios'

export const createTournament = (data, logo) => {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (logo) form.append('logo', logo)
  return multipartApi.post('/tournaments', form)
}

export const getAllTournaments  = ()     => api.get('/tournaments')
export const getTournament      = (id)   => api.get(`/tournaments/${id}`)
export const getTournamentByCode= (code) => api.get(`/tournaments/join/${code}`)
export const updateStatus = (id, status) => api.patch(`/tournaments/${id}/status`, null, { params: { status } })