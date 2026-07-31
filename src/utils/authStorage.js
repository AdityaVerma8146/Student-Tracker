import axios from 'axios'

const currentUserKey = 'syllabusTrackerActiveUser'

export const loadActiveUserEmail = () => {
  return localStorage.getItem(currentUserKey)
}

export const saveActiveUserEmail = (email) => {
  try {
    if (email) {
      localStorage.setItem(currentUserKey, email)
    } else {
      localStorage.removeItem(currentUserKey)
    }
  } catch (error) {
    console.error('Failed to update active user email', error)
  }
}

const parseAxiosError = (error) => {
  if (error.response && error.response.data && error.response.data.error) {
    return new Error(error.response.data.error)
  }
  return error
}

export const registerUser = async ({ email, password, mood }) => {
  const normalizedEmail = email.trim().toLowerCase()
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
    throw parseAxiosError(error)
  }
}

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase()
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
    throw parseAxiosError(error)
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
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !newPassword) {
    throw new Error('Email and new password are required.')
  }

  try {
    await axios.post('/api/reset-password', {
      email: normalizedEmail,
      newPassword
    })
  } catch (error) {
    throw parseAxiosError(error)
  }
}

export const getUserData = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) return { subjects: [], dailyTasks: [], diaryEntries: [] }

  try {
    const response = await axios.get('/api/user-data', {
      params: { email: normalizedEmail }
    })
    return response.data.data
  } catch (error) {
    throw parseAxiosError(error)
  }
}

export const saveUserData = async (email, data) => {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) return

  try {
    await axios.post('/api/user-data', {
      email: normalizedEmail,
      data
    })
  } catch (error) {
    console.error('Failed to save user data:', parseAxiosError(error).message)
  }
}
