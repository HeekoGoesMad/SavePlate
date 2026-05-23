import { authService } from './authService'

const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const API_URL = _BASE + '/recipes'

/**
 * Fetch recipe suggestions from the backend.
 * Returns the top 5 suggestions based on user inventory.
 */
export async function fetchRecipeSuggestions() {
  const res = await fetch(`${API_URL}/suggest`, {
    headers: authService.authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch recipe suggestions')
  return res.json()
}
