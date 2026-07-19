import api, { multipartApi } from './axios'

export const addPlayer = (data, photo) => {
  const form = new FormData()
  form.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )
  if (photo) form.append('photo', photo)
  return multipartApi.post('/players', form)
}

// FIX: embed tournamentId directly in the URL, not as axios params
export const bulkUploadPlayers = (csvFile, tournamentId) => {
  const form = new FormData()
  form.append('file', csvFile)
  // Append tournamentId directly in URL string — avoids multipart+params conflict
  return multipartApi.post(`/players/bulk?tournamentId=${tournamentId}`, form)
}

export const getPlayers          = (tid) => api.get(`/players?tournamentId=${tid}`)
export const getAvailablePlayers = (tid) => api.get(`/players/available?tournamentId=${tid}`)

// Add to existing src/api/playerApi.js
// ✅ FIX: POST instead of DELETE for bulk remove
// ✅ FIX: explicit DELETE with no body
export const removePlayer = (playerId) => {
  console.log('Calling DELETE /players/' + playerId)
  return api.delete(`/players/${playerId}`)

}

// ✅ FIX: POST not DELETE for bulk
export const removePlayers = (playerIds) =>
  api.post('/players/bulk-remove', { playerIds })


export const updatePlayer = (playerId, data, photo) => {
  const form = new FormData()
  form.append('data',
    new Blob([JSON.stringify(data)],
    { type: 'application/json' }))
  if (photo) form.append('photo', photo)
  return multipartApi.put(`/players/${playerId}`, form)
}