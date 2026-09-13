import axios from 'axios'

// A single axios instance for every backend call in the app.
//
// By default this talks to whatever origin served the frontend, using
// relative paths like `/api/...` — correct when the Spring Boot backend
// serves the built frontend itself (the recommended setup, see the root
// README), or when your host proxies `/api` to the backend for you.
//
// If the frontend is deployed separately from the backend (e.g. frontend on
// a static host, backend on its own server) with no such proxy, relative
// `/api/...` calls will silently hit the frontend's own host instead of the
// backend and fail. Set VITE_API_URL at build time to the backend's full
// URL (e.g. https://your-backend.onrender.com) to fix that — every request
// below will be sent there instead.
const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, '') || ''

const apiClient = axios.create({ baseURL })

export default apiClient
