import apiClient from './apiClient'
import { extractErrorMessage } from '../utils/apiError'

export interface CorrectionResult {
  corrected: string
  changed: boolean
  explanation?: string
}

export interface GeneratedScheduleTask {
  date: string // YYYY-MM-DD
  title: string
  category: string
}

export interface GeneratedSchedule {
  summary: string
  tasks: GeneratedScheduleTask[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const AI_FALLBACK = 'The AI assistant is unavailable right now. Please try again.'

const parseError = (error: unknown): Error => new Error(extractErrorMessage(error, AI_FALLBACK))

const badShapeError = () =>
  new Error("Got an unexpected response from the server. Make sure the app's API requests are reaching the backend.")

/**
 * Sends a block of text to the backend for proofreading/correction
 * (typos, grammar, clarity). Used by the "Fix Mistakes" panel.
 */
export async function correctText(text: string): Promise<CorrectionResult> {
  try {
    const response = await apiClient.post('/api/ai/correct', { text })
    const data = response.data
    if (!data || typeof data !== 'object' || typeof data.corrected !== 'string') {
      // The response wasn't the JSON shape we expect — most likely the
      // request never reached the Spring backend at all (e.g. it hit a
      // static-host SPA fallback and got back index.html instead of JSON).
      throw badShapeError()
    }
    return data
  } catch (error) {
    throw parseError(error)
  }
}

/**
 * Sends a plain-language goal + timeframe to the backend and gets back a
 * ready-to-insert day-by-day schedule. Used by the "Build Schedule" panel.
 */
export async function generateSchedule(prompt: string, startDate: string, contextSummary?: string): Promise<GeneratedSchedule> {
  try {
    const response = await apiClient.post('/api/ai/schedule', {
      prompt,
      startDate,
      context: contextSummary,
    })
    const data = response.data
    if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) {
      throw badShapeError()
    }
    return data
  } catch (error) {
    throw parseError(error)
  }
}

/**
 * Free-form AI chat: sends the running conversation (plus optional context
 * about the student's current subjects/roadmap) and gets back the
 * assistant's next reply. Unlike correctText/generateSchedule, this isn't
 * limited to one task — it can answer anything.
 */
export async function chatWithAI(messages: ChatMessage[], contextSummary?: string): Promise<string> {
  try {
    const response = await apiClient.post('/api/ai/chat', {
      messages,
      context: contextSummary,
    })
    const data = response.data
    if (!data || typeof data !== 'object' || typeof data.reply !== 'string') {
      throw badShapeError()
    }
    return data.reply
  } catch (error) {
    throw parseError(error)
  }
}
