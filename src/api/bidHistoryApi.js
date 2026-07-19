import api from './axios'

export const getTournamentHistory = (tid) =>
  api.get(`/bid-history/${tid}`)

export const getPlayerHistory = (playerId) =>
  api.get(`/bid-history/player/${playerId}`)

export const getTeamSpending = (tid) =>
  api.get(`/bid-history/${tid}/spending`)

export const getMvp = (tid) =>
  api.get(`/bid-history/${tid}/mvp`)

export const getAuctionPace = (tid) =>
  api.get(`/bid-history/${tid}/pace`)