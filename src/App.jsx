import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import SubjectList from './components/SubjectList'
import SubjectForm from './components/SubjectForm'
import Diary from './components/Diary'
import Profile from './components/Profile'
import Signup from './components/Signup'
import LoginPage from './components/Login'
import { setCurrentUserEmail } from './store/authSlice'
import { loadActiveUserEmail, saveActiveUserEmail, getUserData, saveUserData } from './utils/authStorage'
import { getCurrentWeekDates } from './utils/storage'

function App() {
  const [subjects, setSubjects] = useState([])
  const [dailyTasks, setDailyTasks] = useState([])
  const [diaryEntries, setDiaryEntries] = useState([])
  const [profile, setProfile] = useState({ name: '', bio: '', avatar: null })
  const [darkMode, setDarkMode] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [editingSubject, setEditingSubject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const dispatch = useDispatch()
  const currentUserEmail = useSelector((state) => state.auth.currentUserEmail)
  // Tracks whether the current user's saved data has finished loading, so the
  // autosave effect never fires with default/empty state and overwrites it.
  const dataReadyRef = useRef(false)

  // Load the active user and their data on mount
  useEffect(() => {
    const initialize = async () => {
      const activeEmail = loadActiveUserEmail()
      if (activeEmail) {
        dispatch(setCurrentUserEmail(activeEmail))
        try {
          const data = await getUserData(activeEmail)
          setSubjects(data.subjects || [])
          setDailyTasks(data.dailyTasks || [])
          setDiaryEntries(data.diaryEntries || [])
          setProfile(data.profile || { name: '', bio: '', avatar: null })
          setCurrentView('dashboard')
          dataReadyRef.current = true
        } catch (error) {
          // The cached login no longer matches an account on the server
          // (e.g. the backend data was reset). Fall back to a clean login
          // screen instead of leaving the app stuck with no data.
          console.error('Failed to load saved data for active user:', error.message)
          saveActiveUserEmail(null)
          dispatch(setCurrentUserEmail(null))
          setCurrentView('login')
        }
      } else {
        setCurrentView('login')
      }
    }

    initialize()

    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [dispatch])

  // Save user-specific data when logged in
  useEffect(() => {
    if (!currentUserEmail) return
    // Skip saving until the initial fetch for this user has completed, so we
    // never persist the default empty state over real saved data.
    if (!dataReadyRef.current) return
    const persist = async () => {
      await saveUserData(currentUserEmail, { subjects, dailyTasks, diaryEntries, profile })
    }
    persist()
  }, [currentUserEmail, subjects, dailyTasks, diaryEntries, profile])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleAuthSuccess = (email, data) => {
    dispatch(setCurrentUserEmail(email))
    saveActiveUserEmail(email)
    setSubjects(data.subjects || [])
    setDailyTasks(data.dailyTasks || [])
    setDiaryEntries(data.diaryEntries || [])
    setProfile(data.profile || { name: '', bio: '', avatar: null })
    setCurrentView('dashboard')
    dataReadyRef.current = true
  }

  const handleLogout = () => {
    dispatch(setCurrentUserEmail(null))
    saveActiveUserEmail(null)
    setSubjects([])
    setDailyTasks([])
    setDiaryEntries([])
    setProfile({ name: '', bio: '', avatar: null })
    setCurrentView('login')
    dataReadyRef.current = false
  }

  const addSubject = (subjectName) => {
    const newSubject = {
      id: Date.now(),
      name: subjectName,
      chapters: [],
      createdAt: new Date().toISOString()
    }
    setSubjects([...subjects, newSubject])
    setCurrentView('subjects')
  }

  const updateSubject = (id, updatedName) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, name: updatedName } : s))
    setEditingSubject(null)
  }

  const deleteSubject = (id) => {
    if (confirm('Are you sure you want to delete this subject? All chapters and topics will be removed.')) {
      setSubjects(subjects.filter(s => s.id !== id))
    }
  }

  const addChapter = (subjectId, chapterName) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: [
            ...s.chapters,
            {
              id: Date.now(),
              name: chapterName,
              topics: []
            }
          ]
        }
      }
      return s
    }))
  }

  const updateChapter = (subjectId, chapterId, updatedName) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => c.id === chapterId ? { ...c, name: updatedName } : c)
        }
      }
      return s
    }))
  }

  const deleteChapter = (subjectId, chapterId) => {
    if (confirm('Are you sure you want to delete this chapter? All topics will be removed.')) {
      setSubjects(subjects.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            chapters: s.chapters.filter(c => c.id !== chapterId)
          }
        }
        return s
      }))
    }
  }

  const addTopic = (subjectId, chapterId, topicName) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === chapterId) {
              return {
                ...c,
                topics: [
                  ...c.topics,
                  {
                    id: Date.now(),
                    name: topicName,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    completedAt: null
                  }
                ]
              }
            }
            return c
          })
        }
      }
      return s
    }))
  }

  const toggleTopic = (subjectId, chapterId, topicId) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === chapterId) {
              return {
                ...c,
                topics: c.topics.map(t => {
                  if (t.id === topicId) {
                    const now = !t.completed ? new Date().toISOString() : null
                    return { ...t, completed: !t.completed, completedAt: now }
                  }
                  return t
                })
              }
            }
            return c
          })
        }
      }
      return s
    }))
  }

  const deleteTopic = (subjectId, chapterId, topicId) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === chapterId) {
              return {
                ...c,
                topics: c.topics.filter(t => t.id !== topicId)
              }
            }
            return c
          })
        }
      }
      return s
    }))
  }

  const addDailyTask = (name, duration = '30m') => {
    const schedule = {}
    getCurrentWeekDates().forEach(day => {
      schedule[day.key] = false
    })

    setDailyTasks([
      ...dailyTasks,
      {
        id: Date.now(),
        name,
        duration,
        schedule,
        createdAt: new Date().toISOString()
      }
    ])
  }

  const toggleDailyTask = (id, dateKey) => {
    setDailyTasks(dailyTasks.map(task => {
      if (task.id !== id) return task
      const nextSchedule = { ...task.schedule, [dateKey]: !task.schedule?.[dateKey] }
      return { ...task, schedule: nextSchedule }
    }))
  }

  const deleteDailyTask = (id) => {
    setDailyTasks(dailyTasks.filter(task => task.id !== id))
  }

  const addDiaryEntry = (text, mood) => {
    setDiaryEntries([
      ...diaryEntries,
      {
        id: Date.now(),
        text,
        mood,
        createdAt: new Date().toISOString()
      }
    ])
    setCurrentView('diary')
  }

  const updateDiaryEntry = (id, updates) => {
    setDiaryEntries(diaryEntries.map(entry => (
      entry.id === id ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry
    )))
  }

  const deleteDiaryEntry = (id) => {
    if (confirm('Delete this diary entry? This cannot be undone.')) {
      setDiaryEntries(diaryEntries.filter(entry => entry.id !== id))
    }
  }

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const filteredSubjects = subjects.map(subject => ({
    ...subject,
    chapters: subject.chapters.map(chapter => ({
      ...chapter,
      topics: chapter.topics.filter(topic => 
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(chapter => chapter.topics.length > 0 || searchQuery === '')
  })).filter(subject => 
    searchQuery === '' || 
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.chapters.length > 0
  )

  if (!currentUserEmail) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 min-h-screen flex items-center justify-center px-4 py-8">
          {currentView === 'signup' ? (
            <Signup switchToLogin={() => setCurrentView('login')} />
          ) : (
            <LoginPage onAuthSuccess={handleAuthSuccess} switchToSignup={() => setCurrentView('signup')} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
        <Navbar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUserEmail={currentUserEmail}
          profile={profile}
          onLogout={handleLogout}
        />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {currentView === 'dashboard' && (
            <Dashboard subjects={filteredSubjects} dailyTasks={dailyTasks} onAddDailyTask={addDailyTask} onToggleDailyTask={toggleDailyTask} onDeleteDailyTask={deleteDailyTask} />
          )}

          {currentView === 'subjects' && (
            <>
              <SubjectForm onAddSubject={addSubject} />
              <SubjectList
                subjects={filteredSubjects}
                onDeleteSubject={deleteSubject}
                onAddChapter={addChapter}
                onUpdateChapter={updateChapter}
                onDeleteChapter={deleteChapter}
                onAddTopic={addTopic}
                onToggleTopic={toggleTopic}
                onDeleteTopic={deleteTopic}
              />
            </>
          )}

          {currentView === 'diary' && (
            <Diary
              diaryEntries={diaryEntries}
              onAddEntry={addDiaryEntry}
              onUpdateEntry={updateDiaryEntry}
              onDeleteEntry={deleteDiaryEntry}
            />
          )}

          {currentView === 'profile' && (
            <Profile
              email={currentUserEmail}
              profile={profile}
              onUpdateProfile={updateProfile}
              subjects={subjects}
              dailyTasks={dailyTasks}
              diaryEntries={diaryEntries}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
