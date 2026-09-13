import apiClient from './apiClient'
import type { PublicProfile, FriendRequestView } from '../types'

export async function searchUsers(query: string, excludeEmail: string): Promise<PublicProfile[]> {
  const res = await apiClient.get('/api/users/search', { params: { query, excludeEmail } })
  return res.data
}

export async function sendFriendRequest(fromEmail: string, toEmail: string): Promise<void> {
  await apiClient.post('/api/friends/request', { fromEmail, toEmail })
}

export async function respondToFriendRequest(friendshipId: number, byEmail: string, accept: boolean): Promise<void> {
  await apiClient.post('/api/friends/respond', { friendshipId, byEmail, accept })
}

export async function listFriends(email: string): Promise<PublicProfile[]> {
  const res = await apiClient.get('/api/friends', { params: { email } })
  return res.data
}

export async function listFriendRequests(email: string): Promise<FriendRequestView[]> {
  const res = await apiClient.get('/api/friends/requests', { params: { email } })
  return res.data
}

export async function removeFriend(email: string, friendEmail: string): Promise<void> {
  await apiClient.delete('/api/friends', { params: { email, friendEmail } })
}
