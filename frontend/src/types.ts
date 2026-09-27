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

export interface SubjectAssignment {
  id: number
  title: string
  dueDate: string
  completed: boolean
  description?: string
}

export interface Subject {
  id: number
  name: string
  code?: string
  teacher?: string
  credits?: number
  studyHours?: number
  notes?: string
  color?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  priority?: 'low' | 'medium' | 'high'
  assignments?: SubjectAssignment[]
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
  description?: string
  startTime?: string
  endTime?: string
  priority?: 'low' | 'medium' | 'high'
  subject?: string
  location?: string
  notes?: string
  eventType?: 'class' | 'assignment' | 'exam' | 'study' | 'task' | 'deadline'
  isRecurring?: boolean
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
  semesterNodes?: SemesterRoadmapNode[]
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
  | 'landing'
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
  isOnline?: boolean
  lastActive?: string
}

export type GroupRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

export interface GroupRequestView {
  id: number
  groupId: number
  groupName: string
  userEmail: string
  userName: string
  userAvatar: string | null
  status: GroupRequestStatus
  message: string
  createdAt: string
}

export interface GroupSearchResult {
  id: number
  name: string
  description: string
  leaderEmail: string
  leaderName: string
  memberCount: number
  createdAt: string
  userStatus: 'MEMBER' | 'PENDING_REQUEST' | 'NONE'
  pendingRequestId?: number | null
}

export interface SemesterRoadmapNode {
  id: string
  title: string
  type: 'semester' | 'subject' | 'unit' | 'chapter' | 'topic' | 'task'
  parentId?: string | null
  completed: boolean
  progress: number // 0-100
  priority?: 'low' | 'medium' | 'high'
  deadline?: string
  notes?: string
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

export interface GroupMessageView {
  id: number
  senderEmail: string
  senderName: string
  content: string
  createdAt: string
}

export interface GroupDetail {
  id: number
  name: string
  description: string
  leaderEmail: string
  createdAt: string
  members: MemberProgress[]
  tasks: GroupTask[]
  messages?: GroupMessageView[]
}

export interface Badge {
  id: string
  label: string
  description: string
  emoji: string
  earned: boolean
}
