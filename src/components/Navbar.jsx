import { useState } from 'react'
import { Menu, Sun, Moon, X } from 'lucide-react'

function Navbar({ currentView, setCurrentView, darkMode, toggleDarkMode, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, currentUserEmail, profile, onLogout }) {
  const avatar = profile?.avatar
  const initials = (profile?.name || currentUserEmail || '?').trim().charAt(0).toUpperCase()
  return (
    <nav className="bg-blue-600 dark:bg-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="font-bold text-xl">📚 Syllabus Tracker</div>
          </div>

          {/* Navigation and Search */}
          <div className="flex-1 hidden lg:flex items-center gap-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('subjects')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === 'subjects'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setCurrentView('diary')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === 'diary'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Diary
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === 'profile'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Profile
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-blue-500 placeholder-blue-100 text-white focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          {/* User Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('profile')}
              title="View profile"
              className={`h-9 w-9 shrink-0 rounded-full overflow-hidden border-2 flex items-center justify-center font-semibold transition ${
                currentView === 'profile' ? 'border-white' : 'border-white/40 hover:border-white'
              } bg-white/10`}
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm">{initials}</span>
              )}
            </button>
            {currentUserEmail && (
              <div className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                {currentUserEmail}
              </div>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="lg:hidden mt-4 space-y-2 border-t border-blue-500 pt-4">
            <button
              onClick={() => {
                setCurrentView('dashboard')
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('subjects')
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                currentView === 'subjects'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => {
                setCurrentView('diary')
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                currentView === 'diary'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Diary
            </button>
            <button
              onClick={() => {
                setCurrentView('profile')
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                currentView === 'profile'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              Profile
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
