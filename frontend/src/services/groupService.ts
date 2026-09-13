import apiClient from './apiClient'
import type { GroupSummary, GroupDetail, GroupTask } from '../types'

export async function listMyGroups(email: string): Promise<GroupSummary[]> {
  const res = await apiClient.get('/api/groups', { params: { email } })
  return res.data
}

export async function createGroup(leaderEmail: string, name: string, description: string): Promise<GroupSummary> {
  const res = await apiClient.post('/api/groups', { leaderEmail, name, description })
  return res.data
}

export async function getGroup(groupId: number, email: string): Promise<GroupDetail> {
  const res = await apiClient.get(`/api/groups/${groupId}`, { params: { email } })
  return res.data
}

export async function deleteGroup(groupId: number, email: string): Promise<void> {
  await apiClient.delete(`/api/groups/${groupId}`, { params: { email } })
}

export async function addMember(groupId: number, byEmail: string, memberEmail: string): Promise<void> {
  await apiClient.post(`/api/groups/${groupId}/members`, { byEmail, memberEmail })
}

export async function removeMember(groupId: number, byEmail: string, memberEmail: string): Promise<void> {
  await apiClient.delete(`/api/groups/${groupId}/members/${encodeURIComponent(memberEmail)}`, { params: { email: byEmail } })
}

export async function createGroupTask(
  groupId: number,
  createdByEmail: string,
  title: string,
  description: string,
  assignedToEmail: string | null,
  dueDate: string | null
): Promise<GroupTask> {
  const res = await apiClient.post(`/api/groups/${groupId}/tasks`, {
    createdByEmail, title, description, assignedToEmail, dueDate,
  })
  return res.data
}

export async function toggleGroupTask(groupId: number, taskId: number, email: string): Promise<GroupTask> {
  const res = await apiClient.patch(`/api/groups/${groupId}/tasks/${taskId}/toggle`, { email })
  return res.data
}

export async function deleteGroupTask(groupId: number, taskId: number, email: string): Promise<void> {
  await apiClient.delete(`/api/groups/${groupId}/tasks/${taskId}`, { params: { email } })
}
