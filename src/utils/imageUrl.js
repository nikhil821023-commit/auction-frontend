// ✅ Single source of truth for backend image URLs
const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function playerImageUrl(photoPath) {
  if (!photoPath) return null
  // Already a full URL
  if (photoPath.startsWith('http')) return photoPath
  // Relative path like /uploads/players/xxx.jpg
  return BACKEND + photoPath
}
