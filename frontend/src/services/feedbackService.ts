import apiClient from './apiClient'

export type FeedbackType = 'CONTACT' | 'BUG_REPORT'

export async function submitFeedback(fromEmail: string, type: FeedbackType, subject: string, message: string): Promise<void> {
  await apiClient.post('/api/feedback', { fromEmail, type, subject, message })
}
