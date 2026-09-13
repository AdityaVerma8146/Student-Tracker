import type { MouseEvent } from 'react'

// Sets --mx/--my (percentage position) on the hovered element so the
// .spotlight-card CSS radial-gradient can track the cursor. Attach to
// onMouseMove on any element with the `spotlight-card` class.
export function handleSpotlight(e: MouseEvent<HTMLElement>): void {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  e.currentTarget.style.setProperty('--mx', `${x}%`)
  e.currentTarget.style.setProperty('--my', `${y}%`)
}

// Spawns a short-lived expanding circle at the click point. Attach to
// onClick on any element with the `ripple-container` class (position:
// relative + overflow: hidden, already provided by that class).
export function spawnRipple(e: MouseEvent<HTMLElement>): void {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const span = document.createElement('span')
  span.className = 'ripple-el'
  span.style.width = span.style.height = `${size}px`
  span.style.left = `${e.clientX - rect.left - size / 2}px`
  span.style.top = `${e.clientY - rect.top - size / 2}px`
  el.appendChild(span)
  span.addEventListener('animationend', () => span.remove())
}
