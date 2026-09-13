// ============================================================
// Core domain types
// ============================================================

export interface Topic {
  id: number
  name: string
  completed: boolean
  createdAt: string
  completedAt: string | null
}

export interface Chapter {
  id: number
  name: string
  topics: Topic[]
}

export interface Subject {
  id: number
  name: string
  chapters: Chapter[]
  createdAt: string
}

export interface DailyTask {
  id: number
  name: string
  duration: string
  schedule: Record<string, boolean>
  createdAt: string
}

export interface DiaryEntry {
  id: number
  text: string
  mood: string
  createdAt: string
  updatedAt?: string
}

export interface CalendarTask {
  id: number
  title: string
  date: string // YYYY-MM-DD
  category: string
  done: boolean
  createdAt: string
}

export interface Profile {
  name: string
  bio: string
  avatar: string | null
}

// ---- Roadmap --------------------------------------------------------------

export interface RoadmapFocusItem {
  id: string
  subject: string
  detail: string
}

export interface RoadmapWeek {
  id: string
  range: string
  label: string
  focus: RoadmapFocusItem[]
}

export interface RoadmapBlock {
  id: string
  time: string
  title: string
  detail: string
}

export interface RoadmapRule {
  id: string
  title: string
  body: string
}

export interface Roadmap {
  weeks: RoadmapWeek[]
  weekdayBlocks: RoadmapBlock[]
  weekendBlocks: RoadmapBlock[]
  rules: RoadmapRule[]
}

// ---- Aggregate user data (what gets persisted) -----------------------------

export interface UserData {
  subjects: Subject[]
  dailyTasks: DailyTask[]
  diaryEntries: DiaryEntry[]
  calendarTasks: CalendarTask[]
  roadmap: Roadmap | null
  profile: Profile
}

export interface AuthResponse {
  email: string
  mood?: string
  data: UserData
}

// ---- Misc -------------------------------------------------------------

export type AccentTheme = 'blue' | 'purple' | 'pink'

export type CurrentView =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'subjects'
  | 'roadmap'
  | 'calendar'
  | 'diary'
  | 'profile'
  | 'groups'

export interface WeekDate {
  key: string
  label: string
  day: number
}

export interface Statistics {
  totalSubjects: number
  totalChapters: number
  totalTopics: number
  completedTopics: number
  remainingTopics: number
  overallCompletion: number
}

// ---- Social: friends, groups, badges ---------------------------------

export interface PublicProfile {
  email: string
  name: string
  avatar: string | null
}

export interface FriendRequestView {
  id: number
  from: PublicProfile
  createdAt: string
}

export interface GroupSummary {
  id: number
  name: string
  description: string
  leaderEmail: string
  memberCount: number
  myCompletionPercent: number
  createdAt: string
}

export interface MemberProgress {
  profile: PublicProfile
  role: 'LEADER' | 'MEMBER'
  totalTasks: number
  completedTasks: number
  completionPercent: number
  rank: number
}

export interface GroupTask {
  id: number
  title: string
  description: string
  assignedTo: PublicProfile | null
  createdBy: PublicProfile
  done: boolean
  dueDate: string | null
  createdAt: string
  completedAt: string | null
}

export interface GroupDetail {
  id: number
  name: string
  description: string
  leaderEmail: string
  createdAt: string
  members: MemberProgress[]
  tasks: GroupTask[]
}

export interface Badge {
  id: string
  label: string
  description: string
  emoji: string
  earned: boolean
}
