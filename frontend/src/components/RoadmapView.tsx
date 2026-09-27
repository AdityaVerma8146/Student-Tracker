import { useState, useMemo } from 'react'
import {
  Compass,
  Sunrise,
  Sunset,
  ListChecks,
  Pencil,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  GitBranch,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import RoadmapScene from './RoadmapScene'
import { handleSpotlight, spawnRipple } from '../utils/effects'
import { DEFAULT_SEMESTER_NODES } from '../data/roadmapData'
import type { Roadmap, SemesterRoadmapNode } from '../types'

const uid = () => `id-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const NODE_TYPES: SemesterRoadmapNode['type'][] = [
  'semester',
  'subject',
  'unit',
  'chapter',
  'topic',
  'task',
]

const NEXT_TYPE_MAP: Record<SemesterRoadmapNode['type'], SemesterRoadmapNode['type'] | null> = {
  semester: 'subject',
  subject: 'unit',
  unit: 'chapter',
  chapter: 'topic',
  topic: 'task',
  task: null,
}

const TYPE_CONFIG: Record<
  SemesterRoadmapNode['type'],
  { label: string; bg: string; text: string; border: string }
> = {
  semester: {
    label: 'Semester',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
  },
  subject: {
    label: 'Subject',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  unit: {
    label: 'Unit',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  chapter: {
    label: 'Chapter',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
  },
  topic: {
    label: 'Topic',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800',
  },
  task: {
    label: 'Task',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
  },
}

interface RoadmapViewProps {
  roadmap: Roadmap
  setRoadmap: React.Dispatch<React.SetStateAction<Roadmap>>
}

export default function RoadmapView({ roadmap, setRoadmap }: RoadmapViewProps) {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'phases' | 'rhythm'>('hierarchy')
  const [editing, setEditing] = useState(false)
  const [rhythmMode, setRhythmMode] = useState<'weekday' | 'weekend'>('weekday')
  const [searchFilter, setSearchFilter] = useState('')

  // State for expanded node IDs in the hierarchy
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => {
    const nodes = roadmap.semesterNodes || DEFAULT_SEMESTER_NODES
    // Expand root & primary nodes by default
    return new Set(nodes.filter((n) => !n.parentId || n.type === 'subject' || n.type === 'unit').map((n) => n.id))
  })

  // Locked node IDs override
  const [lockedNodeIds, setLockedNodeIds] = useState<Set<string>>(new Set())

  const semesterNodes = useMemo(() => {
    return roadmap.semesterNodes && roadmap.semesterNodes.length > 0
      ? roadmap.semesterNodes
      : DEFAULT_SEMESTER_NODES
  }, [roadmap.semesterNodes])

  const weeks = roadmap.weeks
  const blockKey = rhythmMode === 'weekday' ? 'weekdayBlocks' : 'weekendBlocks'
  const blocks = roadmap[blockKey]
  const rules = roadmap.rules

  // Toggle node expansion
  const toggleExpand = (id: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle node lock
  const toggleLock = (id: string) => {
    setLockedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Update nodes in roadmap state
  const updateNodes = (newNodes: SemesterRoadmapNode[]) => {
    setRoadmap((r) => ({ ...r, semesterNodes: newNodes }))
  }

  // Toggle completion of a node and recompute progress upwards
  const handleToggleNodeCompletion = (nodeId: string) => {
    const nodeMap = new Map(semesterNodes.map((n) => [n.id, { ...n }]))
    const target = nodeMap.get(nodeId)
    if (!target) return

    const newCompleted = !target.completed
    target.completed = newCompleted
    target.progress = newCompleted ? 100 : 0

    // If target has children, cascade completion downward
    const cascadeDown = (parentId: string, isDone: boolean) => {
      for (const n of nodeMap.values()) {
        if (n.parentId === parentId) {
          n.completed = isDone
          n.progress = isDone ? 100 : 0
          cascadeDown(n.id, isDone)
        }
      }
    }
    cascadeDown(target.id, newCompleted)

    // Recalculate parent progress upward
    const recalculateUp = (parentId?: string | null) => {
      if (!parentId) return
      const parent = nodeMap.get(parentId)
      if (!parent) return

      const children = Array.from(nodeMap.values()).filter((n) => n.parentId === parentId)
      if (children.length > 0) {
        const avgProgress = Math.round(
          children.reduce((acc, c) => acc + c.progress, 0) / children.length
        )
        parent.progress = avgProgress
        parent.completed = avgProgress === 100
      }
      recalculateUp(parent.parentId)
    }
    recalculateUp(target.parentId)

    updateNodes(Array.from(nodeMap.values()))
  }

  // Add a child node
  const handleAddChildNode = (parentNode: SemesterRoadmapNode) => {
    const nextType = NEXT_TYPE_MAP[parentNode.type] || 'task'
    const newNode: SemesterRoadmapNode = {
      id: uid(),
      title: `New ${TYPE_CONFIG[nextType].label}`,
      type: nextType,
      parentId: parentNode.id,
      completed: false,
      progress: 0,
    }

    const updated = [...semesterNodes, newNode]
    updateNodes(updated)

    // Ensure parent is expanded
    setExpandedNodeIds((prev) => new Set(prev).add(parentNode.id))
  }

  // Delete node and its sub-branches
  const handleDeleteNode = (nodeId: string) => {
    const toDelete = new Set<string>([nodeId])
    const collectDescendants = (pId: string) => {
      for (const n of semesterNodes) {
        if (n.parentId === pId) {
          toDelete.add(n.id)
          collectDescendants(n.id)
        }
      }
    }
    collectDescendants(nodeId)
    const updated = semesterNodes.filter((n) => !toDelete.has(n.id))
    updateNodes(updated)
  }

  // Update node properties
  const handleEditNode = (nodeId: string, patch: Partial<SemesterRoadmapNode>) => {
    const updated = semesterNodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
    updateNodes(updated)
  }

  // ---- Tree rendering helper ---------------------------------------------
  const renderTreeBranch = (node: SemesterRoadmapNode, depth: number = 0) => {
    const children = semesterNodes.filter((n) => n.parentId === node.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodeIds.has(node.id)
    const isLocked = lockedNodeIds.has(node.id)
    const config = TYPE_CONFIG[node.type]

    // Search filter test
    if (
      searchFilter.trim() &&
      !node.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !children.some((c) => c.title.toLowerCase().includes(searchFilter.toLowerCase()))
    ) {
      return null
    }

    return (
      <div key={node.id} className="relative transition-all duration-200">
        {/* Node Card */}
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
            node.completed
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : isLocked
              ? 'bg-gray-100/80 dark:bg-gray-850 border-gray-300 dark:border-gray-700 opacity-60'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
          }`}
          style={{ marginLeft: `${Math.min(depth * 24, 120)}px` }}
        >
          {/* Expand/Collapse Toggle */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
          )}

          {/* Completion Checkbox */}
          <button
            type="button"
            onClick={() => handleToggleNodeCompletion(node.id)}
            disabled={isLocked}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
              node.completed
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
            }`}
            aria-label="Toggle completion"
          >
            {node.completed && <Check size={13} strokeWidth={3} />}
          </button>

          {/* Type Badge */}
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border} shrink-0`}
          >
            {config.label}
          </span>

          {/* Node Title & Details */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={node.title}
                onChange={(e) => handleEditNode(node.id, { title: e.target.value })}
                className="w-full text-sm font-semibold bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-semibold text-gray-900 dark:text-white truncate ${
                    node.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                  }`}
                >
                  {node.title}
                </span>
                {node.priority && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {node.priority}
                  </span>
                )}
              </div>
            )}

            {node.notes && !editing && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{node.notes}</p>
            )}
          </div>

          {/* Progress Bar & Percentage */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 w-28">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  node.progress === 100
                    ? 'bg-emerald-500'
                    : node.progress > 50
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${node.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 min-w-[32px] text-right">
              {node.progress}%
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Lock / Unlock button */}
            <button
              onClick={() => toggleLock(node.id)}
              className={`p-1.5 rounded-lg transition ${
                isLocked
                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isLocked ? 'Unlock node' : 'Lock node'}
              aria-label={isLocked ? 'Unlock node' : 'Lock node'}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            {/* Add Child Node */}
            {NEXT_TYPE_MAP[node.type] && (
              <button
                onClick={() => handleAddChildNode(node)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                title={`Add ${TYPE_CONFIG[NEXT_TYPE_MAP[node.type]!].label}`}
                aria-label={`Add child ${TYPE_CONFIG[NEXT_TYPE_MAP[node.type]!].label}`}
              >
                <Plus size={15} />
              </button>
            )}

            {/* Delete Node */}
            {editing && (
              <button
                onClick={() => handleDeleteNode(node.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                title="Delete node and sub-branches"
                aria-label="Delete node"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Child branches */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 relative before:absolute before:left-4 before:top-0 before:bottom-3 before:w-px before:bg-gray-200 dark:before:bg-gray-700 pl-2">
            {children.map((child) => renderTreeBranch(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // Root level nodes
  const rootNodes = useMemo(() => {
    return semesterNodes.filter((n) => !n.parentId || !semesterNodes.some((p) => p.id === n.parentId))
  }, [semesterNodes])

  // Overall semester stats
  const overallStats = useMemo(() => {
    const total = semesterNodes.length
    const completed = semesterNodes.filter((n) => n.completed).length
    const avgProgress =
      total > 0 ? Math.round(semesterNodes.reduce((acc, n) => acc + n.progress, 0) / total) : 0
    return { total, completed, avgProgress }
  }, [semesterNodes])

  return (
    <div className="space-y-8">
      {/* 3D Hero Section */}
      <div className="relative h-72 md:h-80 rounded-3xl overflow-hidden bg-gray-950 border border-gray-800 shadow-2xl">
        <RoadmapScene />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-flex items-center gap-2 text-blue-300 mb-2">
            <Compass size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Curriculum & Progression</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white tracking-tight">
            Semester Roadmap Architecture
          </h1>
          <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-base">
            Hierarchical syllabus tracking from high-level semesters down to actionable daily study tasks.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={(e) => {
                spawnRipple(e)
                setEditing((v) => !v)
              }}
              className={`relative ripple-container inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-lg ${
                editing ? 'bg-white text-gray-900' : 'btn-primary'
              }`}
            >
              {!editing && <span className="ambient-glow" />}
              {editing ? <Check size={16} /> : <Pencil size={16} />}
              {editing ? 'Done Editing' : 'Edit Roadmap'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'hierarchy'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <GitBranch size={15} /> Connected Tree Progression
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'phases'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers size={15} /> 4-Week Phase Grid
          </button>
          <button
            onClick={() => setActiveTab('rhythm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'rhythm'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sunrise size={15} /> Daily Rhythm & Rules
          </button>
        </div>

        {/* Global Stats Capsule */}
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>{overallStats.completed} / {overallStats.total} Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{overallStats.avgProgress}% Syllabus Covered</span>
          </span>
        </div>
      </div>

      {/* TAB 1: CONNECTED NODE HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Tree Controls & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search topics, units, tasks..."
                className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setExpandedNodeIds(new Set(semesterNodes.map((n) => n.id)))
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedNodeIds(new Set())}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Collapse All
              </button>
              {editing && (
                <button
                  onClick={() => {
                    const newSem: SemesterRoadmapNode = {
                      id: uid(),
                      title: 'New Semester Module',
                      type: 'semester',
                      parentId: null,
                      completed: false,
                      progress: 0,
                    }
                    updateNodes([...semesterNodes, newSem])
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <Plus size={14} /> Add Root Semester
                </button>
              )}
            </div>
          </div>

          {/* Node Hierarchy Tree */}
          <div className="space-y-3 bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-3xl border border-gray-200 dark:border-gray-800">
            {rootNodes.map((rootNode) => renderTreeBranch(rootNode, 0))}
          </div>
        </div>
      )}

      {/* TAB 2: 4-WEEK PHASE GRID */}
      {activeTab === 'phases' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeks.map((w, wi) => (
            <div
              key={w.id}
              onMouseMove={editing ? undefined : handleSpotlight}
              style={{ animationDelay: `${wi * 70}ms` }}
              className={`stagger-item bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 relative ${
                editing ? '' : 'hover-lift spotlight-card shadow-sm'
              }`}
            >
              {editing && (
                <button
                  onClick={() =>
                    setRoadmap((r) => ({ ...r, weeks: r.weeks.filter((wk) => wk.id !== w.id) }))
                  }
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Delete week"
                >
                  <Trash2 size={15} />
                </button>
              )}

              {editing ? (
                <input
                  value={w.range}
                  onChange={(e) =>
                    setRoadmap((r) => ({
                      ...r,
                      weeks: r.weeks.map((wk) => (wk.id === w.id ? { ...wk, range: e.target.value } : wk)),
                    }))
                  }
                  className="font-display text-xl text-blue-600 dark:text-blue-400 bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 focus:outline-none w-full mb-1"
                />
              ) : (
                <span className="font-display text-xl text-blue-600 dark:text-blue-400 block mb-1">
                  {w.range}
                </span>
              )}

              {editing ? (
                <input
                  value={w.label}
                  onChange={(e) =>
                    setRoadmap((r) => ({
                      ...r,
                      weeks: r.weeks.map((wk) => (wk.id === w.id ? { ...wk, label: e.target.value } : wk)),
                    }))
                  }
                  className="font-display text-2xl bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 focus:outline-none w-full mb-3"
                />
              ) : (
                <h3 className="font-display text-2xl mb-3">{w.label}</h3>
              )}

              <dl className="space-y-2">
                {w.focus.map((f) => (
                  <div key={f.id} className="group">
                    {editing ? (
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-1">
                          <input
                            value={f.subject}
                            onChange={(e) =>
                              setRoadmap((r) => ({
                                ...r,
                                weeks: r.weeks.map((wk) =>
                                  wk.id === w.id
                                    ? {
                                        ...wk,
                                        focus: wk.focus.map((fc) =>
                                          fc.id === f.id ? { ...fc, subject: e.target.value } : fc
                                        ),
                                      }
                                    : wk
                                ),
                              }))
                            }
                            className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none flex-1 min-w-0"
                          />
                          <button
                            onClick={() =>
                              setRoadmap((r) => ({
                                ...r,
                                weeks: r.weeks.map((wk) =>
                                  wk.id === w.id
                                    ? { ...wk, focus: wk.focus.filter((fc) => fc.id !== f.id) }
                                    : wk
                                ),
                              }))
                            }
                            className="p-0.5 text-gray-300 hover:text-red-500"
                            aria-label="Remove focus area"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <input
                          value={f.detail}
                          onChange={(e) =>
                            setRoadmap((r) => ({
                              ...r,
                              weeks: r.weeks.map((wk) =>
                                wk.id === w.id
                                  ? {
                                      ...wk,
                                      focus: wk.focus.map((fc) =>
                                        fc.id === f.id ? { ...fc, detail: e.target.value } : fc
                                      ),
                                    }
                                  : wk
                              ),
                            }))
                          }
                          className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                        />
                      </div>
                    ) : (
                      <>
                        <dt className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                          {f.subject}
                        </dt>
                        <dd className="text-sm text-gray-600 dark:text-gray-300">{f.detail}</dd>
                      </>
                    )}
                  </div>
                ))}
              </dl>

              {editing && (
                <button
                  onClick={() =>
                    setRoadmap((r) => ({
                      ...r,
                      weeks: r.weeks.map((wk) =>
                        wk.id === w.id
                          ? {
                              ...wk,
                              focus: [...wk.focus, { id: uid(), subject: 'Subject', detail: '' }],
                            }
                          : wk
                      ),
                    }))
                  }
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Plus size={13} /> Add focus area
                </button>
              )}
            </div>
          ))}

          {editing && (
            <button
              onClick={() =>
                setRoadmap((r) => ({
                  ...r,
                  weeks: [
                    ...r.weeks,
                    {
                      id: uid(),
                      range: `Week ${r.weeks.length + 1}`,
                      label: 'New Phase',
                      focus: [{ id: uid(), subject: 'Subject', detail: 'Phase objectives' }],
                    },
                  ],
                }))
              }
              className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:border-blue-400 transition min-h-[180px]"
            >
              <Plus size={22} />
              <span className="text-sm font-semibold">Add Week</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 3: DAILY RHYTHM & EXECUTION RULES */}
      {activeTab === 'rhythm' && (
        <div className="space-y-8">
          {/* Daily rhythm */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Suggested Daily Rhythm</h3>
              <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-1">
                <button
                  onClick={() => setRhythmMode('weekday')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    rhythmMode === 'weekday'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Sunrise size={14} className="inline mr-1.5 -mt-0.5" /> Weekday
                </button>
                <button
                  onClick={() => setRhythmMode('weekend')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    rhythmMode === 'weekend'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Sunset size={14} className="inline mr-1.5 -mt-0.5" /> Weekend
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {blocks.map((b, i) => (
                <div key={b.id} className="flex gap-4">
                  <div className="w-28 shrink-0 pt-1">
                    {editing ? (
                      <input
                        value={b.time}
                        onChange={(e) =>
                          setRoadmap((r) => ({
                            ...r,
                            [blockKey]: r[blockKey].map((blk) =>
                              blk.id === b.id ? { ...blk, time: e.target.value } : blk
                            ),
                          }))
                        }
                        className="w-full text-right text-xs text-gray-400 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none"
                      />
                    ) : (
                      <div className="text-right text-xs text-gray-400">{b.time}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    {i < blocks.length - 1 && (
                      <span className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    {editing ? (
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <input
                            value={b.title}
                            onChange={(e) =>
                              setRoadmap((r) => ({
                                ...r,
                                [blockKey]: r[blockKey].map((blk) =>
                                  blk.id === b.id ? { ...blk, title: e.target.value } : blk
                                ),
                              }))
                            }
                            className="font-semibold bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full text-gray-900 dark:text-white text-sm"
                          />
                          <input
                            value={b.detail}
                            onChange={(e) =>
                              setRoadmap((r) => ({
                                ...r,
                                [blockKey]: r[blockKey].map((blk) =>
                                  blk.id === b.id ? { ...blk, detail: e.target.value } : blk
                                ),
                              }))
                            }
                            className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                          />
                        </div>
                        <button
                          onClick={() =>
                            setRoadmap((r) => ({
                              ...r,
                              [blockKey]: r[blockKey].filter((blk) => blk.id !== b.id),
                            }))
                          }
                          className="p-1 text-gray-300 hover:text-red-500 mt-1"
                          aria-label="Delete block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {b.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{b.detail}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {editing && (
              <button
                onClick={() =>
                  setRoadmap((r) => ({
                    ...r,
                    [blockKey]: [
                      ...r[blockKey],
                      { id: uid(), time: 'Time', title: 'New block', detail: '' },
                    ],
                  }))
                }
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={15} /> Add block to {rhythmMode === 'weekday' ? 'weekday' : 'weekend'} rhythm
              </button>
            )}
          </div>

          {/* Execution rules */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ListChecks size={20} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Execution Rules</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rules.map((r, i) => (
                <div
                  key={r.id}
                  className="border-t border-gray-200 dark:border-gray-700 pt-3 relative"
                >
                  <span className="font-display text-3xl text-blue-500/70 dark:text-blue-400/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {editing ? (
                    <div className="mt-1 space-y-1">
                      <input
                        value={r.title}
                        onChange={(e) =>
                          setRoadmap((rState) => ({
                            ...rState,
                            rules: rState.rules.map((rule) =>
                              rule.id === r.id ? { ...rule, title: e.target.value } : rule
                            ),
                          }))
                        }
                        className="font-semibold bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        value={r.body}
                        onChange={(e) =>
                          setRoadmap((rState) => ({
                            ...rState,
                            rules: rState.rules.map((rule) =>
                              rule.id === r.id ? { ...rule, body: e.target.value } : rule
                            ),
                          }))
                        }
                        className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                      />
                      <button
                        onClick={() =>
                          setRoadmap((rState) => ({
                            ...rState,
                            rules: rState.rules.filter((rule) => rule.id !== r.id),
                          }))
                        }
                        className="absolute top-3 right-0 p-1 text-gray-300 hover:text-red-500"
                        aria-label="Delete rule"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold mt-1 text-gray-900 dark:text-white text-sm">
                        {r.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{r.body}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {editing && (
              <button
                onClick={() =>
                  setRoadmap((r) => ({
                    ...r,
                    rules: [...r.rules, { id: uid(), title: 'New rule', body: '' }],
                  }))
                }
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={15} /> Add rule
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
