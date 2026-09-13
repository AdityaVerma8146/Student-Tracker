import { useEffect, useRef, useState } from 'react'
import { Menu, Sun, Moon, X, GraduationCap, Settings, User, LogOut, Mail, Bug, ChevronRight } from 'lucide-react'
import type { AccentTheme, CurrentView, Profile } from '../types'
import ContactModal from './ContactModal'
import type { FeedbackType } from '../services/feedbackService'

const NAV_ITEMS: { id: CurrentView; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'groups', label: 'Groups' },
  { id: 'diary', label: 'Diary' },
]

const ACCENTS: { id: AccentTheme; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Blue', swatch: '#3d7bff' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899' },
]

interface NavbarProps {
  currentView: CurrentView
  setCurrentView: (view: CurrentView) => void
  darkMode: boolean
  toggleDarkMode: () => void
  accent: AccentTheme
  setAccent: (accent: AccentTheme) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  currentUserEmail: string
  profile: Profile
  onLogout: () => void
}

function Navbar({ currentView, setCurrentView, darkMode, toggleDarkMode, accent, setAccent, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, currentUserEmail, profile, onLogout }: NavbarProps) {
  const avatar = profile?.avatar
  const initials = (profile?.name || currentUserEmail || '?').trim().charAt(0).toUpperCase()

  const [scrolled, setScrolled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<FeedbackType | null>(null)
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  // Shrink the navbar's vertical padding once the page has scrolled a bit.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Measure the active nav button and slide a pill behind it, instead of
  // swapping the active background instantly.
  useEffect(() => {
    const btn = navRefs.current[currentView]
    const track = trackRef.current
    if (btn && track) {
      const trackRect = track.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      setIndicator({ left: btnRect.left - trackRect.left, width: btnRect.width, ready: true })
    }
  }, [currentView])

  const openFeedback = (type: FeedbackType) => {
    setSettingsOpen(false)
    setFeedbackModal(type)
  }

  return (
    <nav className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/85 backdrop-blur-md text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
      <div className={`container mx-auto px-4 max-w-7xl transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="xl:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2 font-display text-2xl tracking-wide">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-600)] to-[var(--accent-400)] text-white transition-colors">
                <GraduationCap size={18} />
              </span>
              Syllabus Tracker
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 hidden xl:flex items-center justify-center">
            <div
              ref={trackRef}
              className="relative inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1"
            >
              {indicator.ready && (
                <span
                  className="nav-indicator"
                  style={{ left: indicator.left, width: indicator.width }}
                />
              )}
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  ref={(el) => { navRefs.current[item.id] = el }}
                  onClick={() => setCurrentView(item.id)}
                  className={`relative z-10 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    currentView === item.id
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block w-full max-w-[220px]">
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
            />
          </div>

          {/* Settings — everything else lives here now: profile, theme, contact/report, logout */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-colors ${
                settingsOpen ? 'border-[var(--accent-400)] bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title="Settings"
            >
              <span
                className="h-7 w-7 shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold text-xs bg-gray-100 dark:bg-gray-700"
              >
                {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : initials}
              </span>
              <Settings size={16} className="text-gray-500 dark:text-gray-400" />
            </button>

            {settingsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-64 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold truncate">{profile?.name || 'Your account'}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUserEmail}</p>
                  </div>

                  <button
                    onClick={() => { setCurrentView('profile'); setSettingsOpen(false) }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span className="flex items-center gap-2"><User size={15} /> View Profile</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </button>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Accent color</p>
                    <div className="flex items-center gap-2">
                      {ACCENTS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAccent(a.id)}
                          title={a.label}
                          className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            background: a.swatch,
                            borderColor: accent === a.id ? a.swatch : 'transparent',
                            boxShadow: accent === a.id ? `0 0 0 2px white, 0 0 0 4px ${a.swatch}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Mode</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => darkMode && toggleDarkMode()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border ${!darkMode ? 'bg-gray-100 border-gray-300' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                      >
                        <Sun size={13} /> White
                      </button>
                      <button
                        onClick={() => !darkMode && toggleDarkMode()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border ${darkMode ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                      >
                        <Moon size={13} /> Black
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => openFeedback('CONTACT')}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <Mail size={15} /> Contact Us
                    </button>
                    <button
                      onClick={() => openFeedback('BUG_REPORT')}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <Bug size={15} /> Report a Problem
                    </button>
                  </div>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-500 border-t border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="xl:hidden mt-4 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="mb-3 md:hidden">
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
              />
            </div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'text-white font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={currentView === item.id ? { background: 'var(--accent-600)' } : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {feedbackModal && (
        <ContactModal type={feedbackModal} currentUserEmail={currentUserEmail} onClose={() => setFeedbackModal(null)} />
      )}
    </nav>
  )
}

export default Navbar
