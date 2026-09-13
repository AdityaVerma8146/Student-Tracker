import apiClient from './apiClient'
import type { Badge } from '../types'

export async function getBadges(email: string): Promise<Badge[]> {
  const res = await apiClient.get('/api/badges', { params: { email } })
  return res.data
}
