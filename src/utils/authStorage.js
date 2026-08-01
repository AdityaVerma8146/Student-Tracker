import axios from 'axios'

const currentUserKey = 'syllabusTrackerActiveUser'
const localUsersKey = 'syllabusTrackerLocalUsers'
const localUserDataKey = 'syllabusTrackerLocalUserData'

const getSafeStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

const defaultProfile = (overrides = {}) => ({
  name: '',
  bio: '',
  avatar: null,
  ...overrides
})

const createEmptyUserData = () => ({
  subjects: [],
  dailyTasks: [],
  diaryEntries: [],
  profile: defaultProfile()
})

const parseLocalUsers = () => {
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

const writeLocalUsers = (users) => {
  const storage = getSafeStorage()
  if (!storage) return
  storage.setItem(localUsersKey, JSON.stringify(users))
}

const parseLocalUserData = () => {
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

const writeLocalUserData = (data) => {
  const storage = getSafeStorage()
  if (!storage) return
  storage.setItem(localUserDataKey, JSON.stringify(data))
}

const hashPassword = (password) => {
  try {
    return btoa(String(password))
  } catch (error) {
    return String(password)
  }
}

const normalizeEmail = (email) => email?.trim().toLowerCase()

const resolveStorageFallback = async ({ action, payload }) => {
  const storage = getSafeStorage()
  if (!storage) return null

  const users = parseLocalUsers()

  if (action === 'register') {
    const normalizedEmail = normalizeEmail(payload.email)
    if (!normalizedEmail || !payload.password) {
      throw new Error('Email and password are required.')
    }
    if (users[normalizedEmail]) {
      throw new Error('An account with this email already exists.')
    }

    users[normalizedEmail] = {
      passwordHash: hashPassword(payload.password),
      mood: payload.mood || '😊',
      createdAt: new Date().toISOString(),
      data: createEmptyUserData()
    }
    writeLocalUsers(users)
    return normalizedEmail
  }

  if (action === 'login') {
    const normalizedEmail = normalizeEmail(payload.email)
    const user = users[normalizedEmail]
    if (!user) {
      throw new Error('No account found for that email.')
    }
    if (user.passwordHash !== hashPassword(payload.password)) {
      throw new Error('Invalid password. Please try again.')
    }

    return {
      email: normalizedEmail,
      mood: user.mood,
      data: user.data || createEmptyUserData()
    }
  }

  if (action === 'reset-password') {
    const normalizedEmail = normalizeEmail(payload.email)
    const user = users[normalizedEmail]
    if (!user) {
      throw new Error('No account found for that email.')
    }
    user.passwordHash = hashPassword(payload.newPassword)
    writeLocalUsers(users)
    return { email: normalizedEmail }
  }

  if (action === 'get-user-data') {
    const normalizedEmail = normalizeEmail(payload.email)
    const user = users[normalizedEmail]
    const storedData = parseLocalUserData()[normalizedEmail] || user?.data || createEmptyUserData()
    return storedData
  }

  if (action === 'save-user-data') {
    const normalizedEmail = normalizeEmail(payload.email)
    const user = users[normalizedEmail]
    const allUserData = parseLocalUserData()
    allUserData[normalizedEmail] = payload.data
    if (user) {
      user.data = payload.data
    }
    writeLocalUsers(users)
    writeLocalUserData(allUserData)
    return true
  }

  return null
}

export const loadActiveUserEmail = () => {
  const storage = getSafeStorage()
  return storage ? storage.getItem(currentUserKey) : null
}

export const saveActiveUserEmail = (email) => {
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

const parseAxiosError = (error) => {
  if (error?.response?.data?.error) {
    return new Error(error.response.data.error)
  }
  if (error?.response?.data?.message) {
    return new Error(error.response.data.message)
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return new Error(error.message)
  }
  if (typeof error === 'string' && error.trim()) {
    return new Error(error)
  }
  return new Error('Authentication failed. Please check your credentials.')
}

export const registerUser = async ({ email, password, mood }) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.')
  }

  try {
    const response = await axios.post('/api/signup', {
      email: normalizedEmail,
      password,
      mood
    })
    return response.data.email
  } catch (error) {
    try {
      return await resolveStorageFallback({
        action: 'register',
        payload: { email: normalizedEmail, password, mood }
      })
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.')
  }

  try {
    const response = await axios.post('/api/login', {
      email: normalizedEmail,
      password
    })
    return response.data
  } catch (error) {
    try {
      return await resolveStorageFallback({
        action: 'login',
        payload: { email: normalizedEmail, password }
      })
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

// idToken is the JWT credential returned by Google's real account picker
// (via @react-oauth/google). The backend verifies it with Google before
// creating/logging in the matching account, so this always reflects the
// actual Google account the user selected.
export const loginGoogleUser = async (idToken) => {
  try {
    const response = await axios.post('/api/google-login', { idToken })
    return response.data
  } catch (error) {
    throw parseAxiosError(error)
  }
}

export const resetPassword = async ({ email, newPassword }) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !newPassword) {
    throw new Error('Email and new password are required.')
  }

  try {
    await axios.post('/api/reset-password', {
      email: normalizedEmail,
      newPassword
    })
  } catch (error) {
    try {
      await resolveStorageFallback({
        action: 'reset-password',
        payload: { email: normalizedEmail, newPassword }
      })
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

export const getUserData = async (email) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return createEmptyUserData()

  try {
    const response = await axios.get('/api/user-data', {
      params: { email: normalizedEmail }
    })
    return response.data.data
  } catch (error) {
    try {
      return await resolveStorageFallback({
        action: 'get-user-data',
        payload: { email: normalizedEmail }
      })
    } catch (fallbackError) {
      throw parseAxiosError(fallbackError)
    }
  }
}

export const saveUserData = async (email, data) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return

  try {
    await axios.post('/api/user-data', {
      email: normalizedEmail,
      data
    })
  } catch (error) {
    try {
      await resolveStorageFallback({
        action: 'save-user-data',
        payload: { email: normalizedEmail, data }
      })
    } catch (fallbackError) {
      console.error('Failed to save user data:', parseAxiosError(fallbackError).message)
    }
  }
}
