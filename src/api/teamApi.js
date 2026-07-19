import { multipartApi } from './axios'
import api from './axios'

export const registerTeam = (data, logo) => {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (logo) form.append('logo', logo)
  return multipartApi.post('/teams', form)
}

// ✅ FIX: embed tournamentId directly in URL — avoids axios params issue with some backends
export const getTeams = (tournamentId) => api.get(`/teams?tournamentId=${Number(tournamentId)}`)
export const getTeam  = (id)           => api.get(`/teams/${id}`)