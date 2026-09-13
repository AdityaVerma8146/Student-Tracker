import { AxiosError } from 'axios'

// Guards against ever handing a non-string into React state (which is what
// eventually renders as the literal text "[object Object]"). The backend
// always sends {"error": "<string>"} for handled failures, but this stays
// defensive against anything else that might show up in `data.error` —
// a nested object, an array of field errors, etc. — and always returns a
// clean, readable string.
function coerceToMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (Array.isArray(value)) {
    const parts = value.map((v) => coerceToMessage(v)).filter(Boolean)
    return parts.length ? parts.join(' ') : null
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return coerceToMessage(obj.message) || coerceToMessage(obj.error) || coerceToMessage(obj.detail)
  }
  return null
}

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const axiosErr = error as AxiosError<unknown>
  const fromResponse = axiosErr?.isAxiosError ? coerceToMessage(axiosErr.response?.data) : null
  if (fromResponse) return fromResponse

  if (axiosErr?.isAxiosError && !axiosErr.response) {
    // Request never got a response at all: the backend is unreachable
    // (wrong URL, CORS block, backend down/sleeping, no network).
    return "Couldn't reach the server. Check your connection and try again."
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
