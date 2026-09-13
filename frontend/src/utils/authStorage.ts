import type { AxiosError } from 'axios'
import apiClient from '../services/apiClient'
import type { Profile, UserData, AuthResponse } from '../types'

const currentUserKey = 'syllabusTrackerActiveUser'
const localUsersKey = 'syllabusTrackerLocalUsers'
const localUserDataKey = 'syllabusTrackerLocalUserData'

interface LocalUserRecord {
  passwordHash: string
  mood: string
  createdAt: string
  data: UserData
}

type LocalUsersMap = Record<string, LocalUserRecord>
type LocalUserDataMap = Record<string, UserData>

const getSafeStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const defaultProfile = (overrides: Partial<Profile> = {}): Profile => ({
  name: '',
  bio: '',
  avatar: null,
  ...overrides,
})

const createEmptyUserData = (): UserData => ({
  subjects: [],
  dailyTasks: [],
  diaryEntries: [],
  calendarTasks: [],
  roadmap: null,
  profile: defaultProfile(),
})

const parseLocalUsers = (): LocalUsersMap => {
  const storage = getSafeStorage()
  if (!storage) return {}
  try {
    const raw = storage.getItem(localUsersKey)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.error('Failed to parse stored users:', error)
    return {}
  }
}

const writeLocalUsers = (users: LocalUsersMap): void => {
  const storage = getSafeStorage()
  if (!storage) return
  storage.setItem(localUsersKey, JSON.stringify(users))
}

const parseLocalUserData = (): LocalUserDataMap => {
  const storage = getSafeStorage()
  if (!storage) return {}
  try {
    const raw = storage.getItem(localUserDataKey)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.error('Failed to parse stored user data:', error)
    return {}
  }
}

const writeLocalUserData = (data: LocalUserDataMap): void => {
  const storage = getSafeStorage()
  if (!storage) return
  storage.setItem(localUserDataKey, JSON.stringify(data))
}

const hashPassword = (password: string): string => {
  try {
    return btoa(String(password))
  } catch {
    return String(password)
  }
}

const normalizeEmail = (email?: string | null): string | undefined => email?.trim().toLowerCase()

type FallbackAction = 'register' | 'login' | 'reset-password' | 'get-user-data' | 'save-user-data'

interface FallbackRequest {
  action: FallbackAction
  payload: Record<string, unknown>
}

const resolveStorageFallback = async ({ action, payload }: FallbackRequest): Promise<unknown> => {
  const storage = getSafeStorage()
  if (!storage) return null

  const users = parseLocalUsers()

  if (action === 'register') {
    const normalizedEmail = normalizeEmail(payload.email as string)
    const password = payload.password as string
    if (!normalizedEmail || !password) {
      throw new Error('Email and password are required.')
    }
    if (users[normalizedEmail]) {
      throw new Error('An account with this email already exists.')
    }

    users[normalizedEmail] = {
      passwordHash: hashPassword(password),
      mood: (payload.mood as string) || '😊',
      createdAt: new Date().toISOString(),
      data: createEmptyUserData(),
    }
    writeLocalUsers(users)
    return normalizedEmail
  }

  if (action === 'login') {
    const normalizedEmail = normalizeEmail(payload.email as string)
    const user = normalizedEmail ? users[normalizedEmail] : undefined
    if (!user) {
      throw new Error('No account found for that email.')
    }
    if (user.passwordHash !== hashPassword(payload.password as string)) {
      throw new Error('Invalid password. Please try again.')
    }

    return {
      email: normalizedEmail,
      mood: user.mood,
      data: user.data || createEmptyUserData(),
    } as AuthResponse
  }

  if (action === 'reset-password') {
    const normalizedEmail = normalizeEmail(payload.email as string)
    const user = normalizedEmail ? users[normalizedEmail] : undefined
    if (!user || !normalizedEmail) {
      throw new Error('No account found for that email.')
    }
    user.passwordHash = hashPassword(payload.newPassword as string)
    writeLocalUsers(users)
    return { email: normalizedEmail }
  }

  if (action === 'get-user-data') {
    const normalizedEmail = normalizeEmail(payload.email as string)
    const user = normalizedEmail ? users[normalizedEmail] : undefined
    const storedData = (normalizedEmail && parseLocalUserData()[normalizedEmail]) || user?.data || createEmptyUserData()
    return storedData
  }

  if (action === 'save-user-data') {
    const normalizedEmail = normalizeEmail(payload.email as string)
    const user = normalizedEmail ? users[normalizedEmail] : undefined
    const allUserData = parseLocalUserData()
    if (normalizedEmail) {
      allUserData[normalizedEmail] = payload.data as UserData
      if (user) {
        user.data = payload.data as UserData
      }
    }
    writeLocalUsers(users)
    writeLocalUserData(allUserData)
    return true
  }

  return null
}

export const loadActiveUserEmail = (): string | null => {
  const storage = getSafeStorage()
  return storage ? storage.getItem(currentUserKey) : null
}

export const saveActiveUserEmail = (email: string | null): void => {
  const storage = getSafeStorage()
  if (!storage) return
  try {
    if (email) {
      storage.setItem(currentUserKey, email)
    } else {
      storage.removeItem(currentUserKey)
    }
  } catch (error) {
    console.error('Failed to update active user email', error)
  }
}

const parseAxiosError = (error: unknown): Error => {
  const axiosErr = error as AxiosError<{ error?: string; message?: string }>
  const data = axiosErr?.response?.data
  if (data?.error) return new Error(data.error)
  if (data?.message) return new Error(data.message)
  if (error instanceof Error && error.message.trim()) return new Error(error.message)
  if (typeof error === 'string' && error.trim()) return new Error(error)
  return new Error('Authentication failed. Please check your credentials.')
}

// True when the backend was never actually reached — no HTTP response at
// all, or a response that isn't the well-formed {"error": "..."} JSON every
// real backend error produces (see GlobalExceptionHandler). That second
// case covers Vite's dev-proxy error page, which fires on ECONNREFUSED
// (backend process not running) and returns a plain-text/HTML page — the
// exact status code it uses isn't reliable across Vite versions/configs, so
// checking the response shape instead of guessing a status code is safer.
// Any real backend error (400/401/404/409/500...) always has this exact
// JSON shape and should be shown to the user as-is rather than silently
// retried against the separate local fallback store (which would show a
// confusing, unrelated error instead — e.g. "no account found" for what was
// actually a wrong-password error on a real account).
const isUnreachable = (error: unknown): boolean => {
  const axiosErr = error as AxiosError
  if (axiosErr?.isAxiosError !== true) return false
  const response = axiosErr.response
  if (!response) return true
  const data = response.data as unknown
  const isWellFormedBackendError =
    typeof data === 'object' && data !== null && typeof (data as { error?: unknown }).error === 'string'
  return !isWellFormedBackendError
}

export const registerUser = async ({ email, password, mood }: { email: string; password: string; mood?: string }): Promise<string> => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.')
  }

  try {
    const response = await apiClient.post('/api/signup', { email: normalizedEmail, password, mood })
    return response.data.email
  } catch (error) {
    if (!isUnreachable(error)) throw parseAxiosError(error)
    try {
      return (await resolveStorageFallback({
        action: 'register',
        payload: { email: normalizedEmail, password, mood },
      })) as string
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

export const loginUser = async ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.')
  }

  try {
    const response = await apiClient.post('/api/login', { email: normalizedEmail, password })
    return response.data
  } catch (error) {
    if (!isUnreachable(error)) throw parseAxiosError(error)
    try {
      return (await resolveStorageFallback({
        action: 'login',
        payload: { email: normalizedEmail, password },
      })) as AuthResponse
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

// idToken is the JWT credential returned by Google's real account picker
// (via @react-oauth/google). The backend verifies it with Google before
// creating/logging in the matching account, so this always reflects the
// actual Google account the user selected.
export const loginGoogleUser = async (idToken: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/api/google-login', { idToken })
    return response.data
  } catch (error) {
    throw parseAxiosError(error)
  }
}

export const resetPassword = async ({ email, newPassword }: { email: string; newPassword: string }): Promise<void> => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !newPassword) {
    throw new Error('Email and new password are required.')
  }

  try {
    await apiClient.post('/api/reset-password', { email: normalizedEmail, newPassword })
  } catch (error) {
    if (!isUnreachable(error)) throw parseAxiosError(error)
    try {
      await resolveStorageFallback({
        action: 'reset-password',
        payload: { email: normalizedEmail, newPassword },
      })
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

export const getUserData = async (email: string): Promise<UserData> => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return createEmptyUserData()

  try {
    const response = await apiClient.get('/api/user-data', { params: { email: normalizedEmail } })
    return response.data.data
  } catch (error) {
    if (!isUnreachable(error)) throw parseAxiosError(error)
    try {
      return (await resolveStorageFallback({
        action: 'get-user-data',
        payload: { email: normalizedEmail },
      })) as UserData
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

export const saveUserData = async (email: string | null, data: UserData): Promise<void> => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return

  try {
    await apiClient.post('/api/user-data', { email: normalizedEmail, data })
  } catch (error) {
    if (!isUnreachable(error)) {
      console.error('Failed to save user data:', parseAxiosError(error).message)
      return
    }
    try {
      await resolveStorageFallback({
        action: 'save-user-data',
        payload: { email: normalizedEmail, data },
      })
    } catch (fallbackError) {
      console.error('Failed to save user data:', parseAxiosError(fallbackError).message)
    }
  }
}
