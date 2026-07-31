require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { OAuth2Client } = require('google-auth-library')

const PORT = process.env.PORT || 4000
const DATA_FILE = path.join(__dirname, 'backend-data.json')
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2), 'utf8')
  }
}

const readData = () => {
  ensureDataFile()
  const raw = fs.readFileSync(DATA_FILE, 'utf8')
  return JSON.parse(raw)
}

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

const hashPassword = (password) => {
  return Buffer.from(password, 'utf8').toString('base64')
}

const defaultProfile = (overrides = {}) => ({
  name: '',
  bio: '',
  avatar: null,
  ...overrides
})

const app = express()
app.use(cors())
// Raised from the default 100kb so a base64-encoded profile photo can be
// saved along with the rest of the user's data.
app.use(express.json({ limit: '5mb' }))

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/signup', (req, res) => {
  const { email, password, mood } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const data = readData()
  if (data.users[normalizedEmail]) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  data.users[normalizedEmail] = {
    passwordHash: hashPassword(password),
    mood: mood || '😊',
    createdAt: new Date().toISOString(),
    data: {
      subjects: [],
      dailyTasks: [],
      diaryEntries: [],
      profile: defaultProfile()
    }
  }

  writeData(data)
  return res.status(201).json({ email: normalizedEmail, mood: data.users[normalizedEmail].mood })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const data = readData()
  const user = data.users[normalizedEmail]
  if (!user) {
    return res.status(404).json({ error: 'No account found for that email.' })
  }
  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid password. Please try again.' })
  }
  if (!user.data.profile) {
    user.data.profile = defaultProfile()
    writeData(data)
  }

  return res.json({ email: normalizedEmail, mood: user.mood, data: user.data })
})

app.post('/api/google-login', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) {
    return res.status(400).json({ error: 'Missing Google ID token.' })
  }
  if (!googleClient) {
    return res.status(500).json({ error: 'Google sign-in is not configured on the server (missing GOOGLE_CLIENT_ID).' })
  }

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    })
    payload = ticket.getPayload()
  } catch (verifyError) {
    return res.status(401).json({ error: 'Could not verify Google sign-in. Please try again.' })
  }

  if (!payload || !payload.email) {
    return res.status(401).json({ error: 'Google did not return an email for this account.' })
  }
  if (payload.email_verified === false) {
    return res.status(401).json({ error: 'This Google account\'s email is not verified.' })
  }

  const normalizedEmail = payload.email.trim().toLowerCase()
  const data = readData()

  if (!data.users[normalizedEmail]) {
    // First time this Google account has signed in: create a passwordless
    // account for it. A random, never-shared hash is stored so the
    // password-login endpoint simply can't be used for this account.
    data.users[normalizedEmail] = {
      passwordHash: hashPassword(`google-oauth:${normalizedEmail}:${Date.now()}:${Math.random()}`),
      mood: '😎',
      googleAccount: true,
      createdAt: new Date().toISOString(),
      data: {
        subjects: [],
        dailyTasks: [],
        diaryEntries: [],
        profile: defaultProfile({
          name: payload.name || '',
          avatar: payload.picture || null
        })
      }
    }
    writeData(data)
  } else if (!data.users[normalizedEmail].data.profile) {
    data.users[normalizedEmail].data.profile = defaultProfile({
      name: payload.name || '',
      avatar: payload.picture || null
    })
    writeData(data)
  }

  const user = data.users[normalizedEmail]
  return res.json({ email: normalizedEmail, mood: user.mood, data: user.data })
})

app.post('/api/reset-password', (req, res) => {
  const { email, newPassword } = req.body
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' })
  }

  const data = readData()
  const user = data.users[normalizedEmail]
  if (!user) {
    return res.status(404).json({ error: 'No account found for that email.' })
  }

  user.passwordHash = hashPassword(newPassword)
  writeData(data)
  return res.json({ email: normalizedEmail, message: 'Password reset successfully.' })
})

app.get('/api/user-data', (req, res) => {
  const email = req.query.email?.trim().toLowerCase()
  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required.' })
  }

  const data = readData()
  const user = data.users[email]
  if (!user) {
    return res.status(404).json({ error: 'User not found.' })
  }
  if (!user.data.profile) {
    user.data.profile = defaultProfile()
    writeData(data)
  }

  return res.json({ data: user.data })
})

app.post('/api/user-data', (req, res) => {
  const { email, data: userData } = req.body
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail || !userData) {
    return res.status(400).json({ error: 'Email and user data are required.' })
  }

  const data = readData()
  const user = data.users[normalizedEmail]
  if (!user) {
    return res.status(404).json({ error: 'User not found.' })
  }

  user.data = {
    subjects: userData.subjects || [],
    dailyTasks: userData.dailyTasks || [],
    diaryEntries: userData.diaryEntries || [],
    profile: userData.profile || defaultProfile()
  }
  writeData(data)
  return res.json({ message: 'User data saved successfully.' })
})

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`)
})
