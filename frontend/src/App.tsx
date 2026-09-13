import { useState, useEffect, useRef } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import SubjectList from './components/SubjectList'
import SubjectForm from './components/SubjectForm'
import Diary from './components/Diary'
import Profile from './components/Profile'
import Signup from './components/Signup'
import LoginPage from './components/Login'
import RoadmapView from './components/RoadmapView'
import CalendarView from './components/CalendarView'
import GroupsView from './components/GroupsView'
import AIAssistant from './components/AIAssistant'
import { setCurrentUserEmail } from './store/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { loadActiveUserEmail, saveActiveUserEmail, getUserData, saveUserData } from './utils/authStorage'
import { getCurrentWeekDates } from './utils/storage'
import { createDefaultRoadmap } from './data/roadmapData'
import type {
  Subject,
  Chapter,
  DailyTask,
  DiaryEntry,
  CalendarTask,
  Roadmap,
  Profile as ProfileType,
  AccentTheme,
  CurrentView,
  UserData,
} from './types'

const emptyProfile: ProfileType = { name: '', bio: '', avatar: null }

function App() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([])
  const [roadmap, setRoadmap] = useState<Roadmap>(createDefaultRoadmap)
  const [profile, setProfile] = useState<ProfileType>(emptyProfile)
  const [darkMode, setDarkMode] = useState(false)
  const [accent, setAccent] = useState<AccentTheme>('blue')
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const dispatch = useAppDispatch()
  const currentUserEmail = useAppSelector((state) => state.auth.currentUserEmail)
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
          setCalendarTasks(data.calendarTasks || [])
          setRoadmap(data.roadmap || createDefaultRoadmap())
          setProfile(data.profile || emptyProfile)
          setCurrentView('dashboard')
          dataReadyRef.current = true
        } catch (error) {
          // The cached login no longer matches an account on the server
          // (e.g. the backend data was reset). Fall back to a clean login
          // screen instead of leaving the app stuck with no data.
          console.error('Failed to load saved data for active user:', (error as Error).message)
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

    const savedAccent = (localStorage.getItem('accentTheme') as AccentTheme) || 'blue'
    setAccent(savedAccent)
    document.documentElement.dataset.accent = savedAccent
  }, [dispatch])

  // Save user-specific data when logged in
  useEffect(() => {
    if (!currentUserEmail) return
    // Skip saving until the initial fetch for this user has completed, so we
    // never persist the default empty state over real saved data.
    if (!dataReadyRef.current) return
    const persist = async () => {
      const payload: UserData = { subjects, dailyTasks, diaryEntries, calendarTasks, roadmap, profile }
      await saveUserData(currentUserEmail, payload)
    }
    persist()
  }, [currentUserEmail, subjects, dailyTasks, diaryEntries, calendarTasks, roadmap, profile])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode((d) => !d)

  // Save accent theme preference
  useEffect(() => {
    localStorage.setItem('accentTheme', accent)
    document.documentElement.dataset.accent = accent
  }, [accent])

  const handleAuthSuccess = (email: string, data: UserData) => {
    dispatch(setCurrentUserEmail(email))
    saveActiveUserEmail(email)
    setSubjects(data.subjects || [])
    setDailyTasks(data.dailyTasks || [])
    setDiaryEntries(data.diaryEntries || [])
    setCalendarTasks(data.calendarTasks || [])
    setRoadmap(data.roadmap || createDefaultRoadmap())
    setProfile(data.profile || emptyProfile)
    setCurrentView('dashboard')
    dataReadyRef.current = true
  }

  const handleLogout = () => {
    dispatch(setCurrentUserEmail(null))
    saveActiveUserEmail(null)
    setSubjects([])
    setDailyTasks([])
    setDiaryEntries([])
    setCalendarTasks([])
    setRoadmap(createDefaultRoadmap())
    setProfile(emptyProfile)
    setCurrentView('login')
    dataReadyRef.current = false
  }

  const addSubject = (subjectName: string) => {
    const newSubject: Subject = {
      id: Date.now(),
      name: subjectName,
      chapters: [],
      createdAt: new Date().toISOString(),
    }
    setSubjects([...subjects, newSubject])
    setCurrentView('subjects')
  }

  const updateSubject = (id: number, updatedName: string) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, name: updatedName } : s)))
  }
  // Referenced by SubjectList's rename flow; kept for API parity even though
  // the current UI drives renames inline.
  void updateSubject

  const deleteSubject = (id: number) => {
    if (confirm('Are you sure you want to delete this subject? All chapters and topics will be removed.')) {
      setSubjects(subjects.filter((s) => s.id !== id))
    }
  }

  const addChapter = (subjectId: number, chapterName: string) => {
    setSubjects(subjects.map((s) => {
      if (s.id === subjectId) {
        const newChapter: Chapter = { id: Date.now(), name: chapterName, topics: [] }
        return { ...s, chapters: [...s.chapters, newChapter] }
      }
      return s
    }))
  }

  const updateChapter = (subjectId: number, chapterId: number, updatedName: string) => {
    setSubjects(subjects.map((s) => {
      if (s.id === subjectId) {
        return { ...s, chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, name: updatedName } : c)) }
      }
      return s
    }))
  }

  const deleteChapter = (subjectId: number, chapterId: number) => {
    if (confirm('Are you sure you want to delete this chapter? All topics will be removed.')) {
      setSubjects(subjects.map((s) => {
        if (s.id === subjectId) {
          return { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
        }
        return s
      }))
    }
  }

  const addTopic = (subjectId: number, chapterId: number, topicName: string) => {
    setSubjects(subjects.map((s) => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map((c) => {
            if (c.id === chapterId) {
              return {
                ...c,
                topics: [
                  ...c.topics,
                  { id: Date.now(), name: topicName, completed: false, createdAt: new Date().toISOString(), completedAt: null },
                ],
              }
            }
            return c
          }),
        }
      }
      return s
    }))
  }

  const toggleTopic = (subjectId: number, chapterId: number, topicId: number) => {
    setSubjects(subjects.map((s) => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map((c) => {
            if (c.id === chapterId) {
              return {
                ...c,
                topics: c.topics.map((t) => {
                  if (t.id === topicId) {
                    const now = !t.completed ? new Date().toISOString() : null
                    return { ...t, completed: !t.completed, completedAt: now }
                  }
                  return t
                }),
              }
            }
            return c
          }),
        }
      }
      return s
    }))
  }

  const deleteTopic = (subjectId: number, chapterId: number, topicId: number) => {
    setSubjects(subjects.map((s) => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map((c) => {
            if (c.id === chapterId) {
              return { ...c, topics: c.topics.filter((t) => t.id !== topicId) }
            }
            return c
          }),
        }
      }
      return s
    }))
  }

  const addDailyTask = (name: string, duration = '30m') => {
    const schedule: Record<string, boolean> = {}
    getCurrentWeekDates().forEach((day) => {
      schedule[day.key] = false
    })

    setDailyTasks([
      ...dailyTasks,
      { id: Date.now(), name, duration, schedule, createdAt: new Date().toISOString() },
    ])
  }

  const toggleDailyTask = (id: number, dateKey: string) => {
    setDailyTasks(dailyTasks.map((task) => {
      if (task.id !== id) return task
      const nextSchedule = { ...task.schedule, [dateKey]: !task.schedule?.[dateKey] }
      return { ...task, schedule: nextSchedule }
    }))
  }

  const deleteDailyTask = (id: number) => {
    setDailyTasks(dailyTasks.filter((task) => task.id !== id))
  }

  const addDiaryEntry = (text: string, mood: string) => {
    setDiaryEntries([
      ...diaryEntries,
      { id: Date.now(), text, mood, createdAt: new Date().toISOString() },
    ])
    setCurrentView('diary')
  }

  const updateDiaryEntry = (id: number, updates: Partial<DiaryEntry>) => {
    setDiaryEntries(diaryEntries.map((entry) => (
      entry.id === id ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry
    )))
  }

  const deleteDiaryEntry = (id: number) => {
    if (confirm('Delete this diary entry? This cannot be undone.')) {
      setDiaryEntries(diaryEntries.filter((entry) => entry.id !== id))
    }
  }

  const updateProfile = (updates: Partial<ProfileType>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  const addCalendarTask = (task: { title: string; date: string; category: string }) => {
    setCalendarTasks([
      ...calendarTasks,
      { id: Date.now(), done: false, createdAt: new Date().toISOString(), ...task },
    ])
  }

  const toggleCalendarTask = (id: number) => {
    setCalendarTasks(calendarTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const deleteCalendarTask = (id: number) => {
    setCalendarTasks(calendarTasks.filter((t) => t.id !== id))
  }

  // Bulk-insert AI-generated schedule items in one state update, so a
  // 10-task schedule doesn't trigger 10 separate re-renders/saves.
  const addCalendarTasksBulk = (tasks: { title: string; date: string; category: string }[]) => {
    const withIds: CalendarTask[] = tasks.map((t, i) => ({
      id: Date.now() + i,
      done: false,
      createdAt: new Date().toISOString(),
      ...t,
    }))
    setCalendarTasks((prev) => [...prev, ...withIds])
  }

  const filteredSubjects: Subject[] = subjects
    .map((subject) => ({
      ...subject,
      chapters: subject.chapters
        .map((chapter) => ({
          ...chapter,
          topics: chapter.topics.filter((topic) =>
            topic.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((chapter) => chapter.topics.length > 0 || searchQuery === ''),
    }))
    .filter(
      (subject) =>
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
          accent={accent}
          setAccent={setAccent}
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

          {currentView === 'roadmap' && <RoadmapView roadmap={roadmap} setRoadmap={setRoadmap} />}

          {currentView === 'calendar' && (
            <CalendarView
              tasks={calendarTasks}
              onAddTask={addCalendarTask}
              onToggleTask={toggleCalendarTask}
              onDeleteTask={deleteCalendarTask}
            />
          )}

          {currentView === 'groups' && <GroupsView currentUserEmail={currentUserEmail} />}

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

        {/* Global AI assistant: available from every authenticated view */}
        <AIAssistant
          subjects={subjects}
          roadmap={roadmap}
          setRoadmap={setRoadmap}
          onAddCalendarTasks={addCalendarTasksBulk}
        />
      </div>
    </div>
  )
}

export default App
