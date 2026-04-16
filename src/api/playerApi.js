import api, { multipartApi } from './axios'

export const addPlayer = (data, photo) => {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (photo) form.append('photo', photo)
  return multipartApi.post('/players', form)
}

export const bulkUploadPlayers = (csvFile, tournamentId) => {
  const form = new FormData()
  form.append('file', csvFile)
  return multipartApi.post('/players/bulk', form, { params: { tournamentId } })
}

export const getPlayers          = (tournamentId) => api.get('/players', { params: { tournamentId } })
export const getAvailablePlayers = (tournamentId) => api.get('/players/available', { params: { tournamentId } })