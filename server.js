require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')
const { OAuth2Client } = require('google-auth-library')

const PORT = process.env.PORT || 4000
const DATA_FILE = path.join(__dirname, 'backend-data.json')
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'auth.db')
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

const ensureDbDir = () => {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
}

const db = (() => {
  ensureDbDir()
  const connection = new Database(DB_PATH)
  connection.pragma('journal_mode = WAL')
  connection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      mood TEXT DEFAULT '😊',
      google_account INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      data_json TEXT NOT NULL
    )
  `)
  return connection
})()

const hashPassword = (password) => {
  return Buffer.from(password, 'utf8').toString('base64')
}

const defaultProfile = (overrides = {}) => ({
  name: '',
  bio: '',
  avatar: null,
  ...overrides
})

const emptyUserData = () => ({
  subjects: [],
  dailyTasks: [],
  diaryEntries: [],
  profile: defaultProfile()
})

const normalizeEmail = (email) => email?.trim().toLowerCase()

const parseDataJson = (dataJson) => {
  try {
    return dataJson ? JSON.parse(dataJson) : emptyUserData()
  } catch (error) {
    return emptyUserData()
  }
}

const getLegacyData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return { users: {} }
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8')
  try {
    return JSON.parse(raw)
  } catch (error) {
    return { users: {} }
  }
}

const migrateLegacyData = () => {
  const legacyData = getLegacyData()
  const legacyUsers = legacyData.users || {}
  const existingCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count

  if (!existingCount && Object.keys(legacyUsers).length > 0) {
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (email, password_hash, mood, google_account, created_at, data_json)
      VALUES (@email, @passwordHash, @mood, @googleAccount, @createdAt, @dataJson)
    `)

    for (const [email, user] of Object.entries(legacyUsers)) {
      insertUser.run({
        email,
        passwordHash: user.passwordHash,
        mood: user.mood || '😊',
        googleAccount: user.googleAccount ? 1 : 0,
        createdAt: user.createdAt || new Date().toISOString(),
        dataJson: JSON.stringify(user.data || emptyUserData())
      })
    }
  }
}

migrateLegacyData()

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/signup', (req, res) => {
  const { email, password, mood } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const normalizedEmail = normalizeEmail(email)
  const existingUser = db.prepare('SELECT email FROM users WHERE email = ?').get(normalizedEmail)
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO users (email, password_hash, mood, google_account, created_at, data_json)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(normalizedEmail, hashPassword(password), mood || '😊', createdAt, JSON.stringify(emptyUserData()))

  return res.status(201).json({ email: normalizedEmail, mood: mood || '😊' })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail)
  if (!user) {
    return res.status(404).json({ error: 'No account found for that email.' })
  }
  if (user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid password. Please try again.' })
  }

  const data = parseDataJson(user.data_json)
  if (!data.profile) {
    data.profile = defaultProfile()
    db.prepare('UPDATE users SET data_json = ? WHERE email = ?').run(JSON.stringify(data), normalizedEmail)
  }

  return res.json({ email: normalizedEmail, mood: user.mood, data })
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

  const normalizedEmail = normalizeEmail(payload.email)
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail)

  if (!user) {
    const createdAt = new Date().toISOString()
    const data = emptyUserData()
    data.profile = defaultProfile({
      name: payload.name || '',
      avatar: payload.picture || null
    })

    db.prepare(`
      INSERT INTO users (email, password_hash, mood, google_account, created_at, data_json)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(normalizedEmail, hashPassword(`google-oauth:${normalizedEmail}:${Date.now()}:${Math.random()}`), '😎', createdAt, JSON.stringify(data))
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail)
  }

  const data = parseDataJson(user.data_json)
  if (!data.profile) {
    data.profile = defaultProfile({
      name: payload.name || '',
      avatar: payload.picture || null
    })
    db.prepare('UPDATE users SET data_json = ? WHERE email = ?').run(JSON.stringify(data), normalizedEmail)
  }

  return res.json({ email: normalizedEmail, mood: user.mood, data })
})

app.post('/api/reset-password', (req, res) => {
  const { email, newPassword } = req.body
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' })
  }

  const existingUser = db.prepare('SELECT email FROM users WHERE email = ?').get(normalizedEmail)
  if (!existingUser) {
    return res.status(404).json({ error: 'No account found for that email.' })
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hashPassword(newPassword), normalizedEmail)
  return res.json({ email: normalizedEmail, message: 'Password reset successfully.' })
})

app.get('/api/user-data', (req, res) => {
  const email = normalizeEmail(req.query.email)
  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required.' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(404).json({ error: 'User not found.' })
  }

  const data = parseDataJson(user.data_json)
  if (!data.profile) {
    data.profile = defaultProfile()
    db.prepare('UPDATE users SET data_json = ? WHERE email = ?').run(JSON.stringify(data), email)
  }

  return res.json({ data })
})

app.post('/api/user-data', (req, res) => {
  const { email, data: userData } = req.body
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !userData) {
    return res.status(400).json({ error: 'Email and user data are required.' })
  }

  const existingUser = db.prepare('SELECT email FROM users WHERE email = ?').get(normalizedEmail)
  if (!existingUser) {
    return res.status(404).json({ error: 'User not found.' })
  }

  const normalizedData = {
    subjects: userData.subjects || [],
    dailyTasks: userData.dailyTasks || [],
    diaryEntries: userData.diaryEntries || [],
    profile: userData.profile || defaultProfile()
  }

  db.prepare('UPDATE users SET data_json = ? WHERE email = ?').run(JSON.stringify(normalizedData), normalizedEmail)
  return res.json({ message: 'User data saved successfully.' })
})

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`)
  console.log(`Shared auth database path: ${DB_PATH}`)
})
