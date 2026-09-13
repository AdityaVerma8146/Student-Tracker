import { useState } from 'react'
import { Compass, Sunrise, Sunset, ListChecks, Pencil, Check, Plus, Trash2 } from 'lucide-react'
import RoadmapScene from './RoadmapScene'
import { handleSpotlight, spawnRipple } from '../utils/effects'

const uid = () => `id-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

function RoadmapView({ roadmap, setRoadmap }) {
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState('weekday')

  const weeks = roadmap.weeks
  const blockKey = mode === 'weekday' ? 'weekdayBlocks' : 'weekendBlocks'
  const blocks = roadmap[blockKey]
  const rules = roadmap.rules

  // ---- Weeks -------------------------------------------------------------
  const addWeek = () => {
    setRoadmap((r) => ({
      ...r,
      weeks: [
        ...r.weeks,
        { id: uid(), range: `Week ${r.weeks.length + 1}`, label: 'New Phase', focus: [{ id: uid(), subject: 'Subject', detail: 'What are you focusing on?' }] },
      ],
    }))
  }
  const updateWeek = (weekId, patch) => {
    setRoadmap((r) => ({ ...r, weeks: r.weeks.map((w) => (w.id === weekId ? { ...w, ...patch } : w)) }))
  }
  const deleteWeek = (weekId) => {
    setRoadmap((r) => ({ ...r, weeks: r.weeks.filter((w) => w.id !== weekId) }))
  }
  const addFocus = (weekId) => {
    setRoadmap((r) => ({
      ...r,
      weeks: r.weeks.map((w) => (w.id === weekId ? { ...w, focus: [...w.focus, { id: uid(), subject: 'Subject', detail: '' }] } : w)),
    }))
  }
  const updateFocus = (weekId, focusId, patch) => {
    setRoadmap((r) => ({
      ...r,
      weeks: r.weeks.map((w) =>
        w.id === weekId ? { ...w, focus: w.focus.map((f) => (f.id === focusId ? { ...f, ...patch } : f)) } : w
      ),
    }))
  }
  const deleteFocus = (weekId, focusId) => {
    setRoadmap((r) => ({
      ...r,
      weeks: r.weeks.map((w) => (w.id === weekId ? { ...w, focus: w.focus.filter((f) => f.id !== focusId) } : w)),
    }))
  }

  // ---- Daily rhythm blocks -------------------------------------------------
  const addBlock = () => {
    setRoadmap((r) => ({ ...r, [blockKey]: [...r[blockKey], { id: uid(), time: 'Time', title: 'New block', detail: '' }] }))
  }
  const updateBlock = (blockId, patch) => {
    setRoadmap((r) => ({ ...r, [blockKey]: r[blockKey].map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }))
  }
  const deleteBlock = (blockId) => {
    setRoadmap((r) => ({ ...r, [blockKey]: r[blockKey].filter((b) => b.id !== blockId) }))
  }

  // ---- Rules ---------------------------------------------------------------
  const addRule = () => {
    setRoadmap((r) => ({ ...r, rules: [...r.rules, { id: uid(), title: 'New rule', body: '' }] }))
  }
  const updateRule = (ruleId, patch) => {
    setRoadmap((r) => ({ ...r, rules: r.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)) }))
  }
  const deleteRule = (ruleId) => {
    setRoadmap((r) => ({ ...r, rules: r.rules.filter((rule) => rule.id !== ruleId) }))
  }

  return (
    <div className="space-y-10">
      {/* 3D hero */}
      <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden bg-gray-950">
        <RoadmapScene />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-flex items-center gap-2 text-blue-300 mb-2">
            <Compass size={20} />
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">Roadmap</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-wide">Four Weeks, Four Phases</h1>
          <p className="text-gray-300 mt-2 max-w-xl">
            A plan you fully control — edit every week, block, and rule below.
          </p>
          <button
            onClick={(e) => {
              spawnRipple(e)
              setEditing((v) => !v)
            }}
            className={`relative ripple-container mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition ${
              editing ? 'bg-white text-gray-900' : 'btn-primary'
            }`}
          >
            {!editing && <span className="ambient-glow" />}
            {editing ? <Check size={16} /> : <Pencil size={16} />}
            {editing ? 'Done Editing' : 'Edit Roadmap'}
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {weeks.map((w, wi) => (
          <div
            key={w.id}
            onMouseMove={editing ? undefined : handleSpotlight}
            style={{ animationDelay: `${wi * 70}ms` }}
            className={`stagger-item bg-white dark:bg-gray-800 rounded-lg p-5 card-shadow relative ${
              editing ? '' : 'hover-lift spotlight-card'
            }`}
          >
            {editing && (
              <button
                onClick={() => deleteWeek(w.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Delete week"
              >
                <Trash2 size={15} />
              </button>
            )}

            {editing ? (
              <input
                value={w.range}
                onChange={(e) => updateWeek(w.id, { range: e.target.value })}
                className="font-display text-xl text-blue-600 dark:text-blue-400 bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 focus:outline-none w-full mb-1"
              />
            ) : (
              <span className="font-display text-xl text-blue-600 dark:text-blue-400 block mb-1">{w.range}</span>
            )}

            {editing ? (
              <input
                value={w.label}
                onChange={(e) => updateWeek(w.id, { label: e.target.value })}
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
                          onChange={(e) => updateFocus(w.id, f.id, { subject: e.target.value })}
                          className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none flex-1 min-w-0"
                        />
                        <button
                          onClick={() => deleteFocus(w.id, f.id)}
                          className="p-0.5 text-gray-300 hover:text-red-500"
                          aria-label="Remove focus area"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <input
                        value={f.detail}
                        onChange={(e) => updateFocus(w.id, f.id, { detail: e.target.value })}
                        className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                      />
                    </div>
                  ) : (
                    <>
                      <dt className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{f.subject}</dt>
                      <dd className="text-sm text-gray-600 dark:text-gray-300">{f.detail}</dd>
                    </>
                  )}
                </div>
              ))}
            </dl>

            {editing && (
              <button
                onClick={() => addFocus(w.id)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={13} /> Add focus area
              </button>
            )}
          </div>
        ))}

        {editing && (
          <button
            onClick={addWeek}
            className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:border-blue-400 transition min-h-[180px]"
          >
            <Plus size={22} />
            <span className="text-sm font-semibold">Add Week</span>
          </button>
        )}
      </div>

      {/* Daily rhythm */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h3 className="text-xl font-bold">Suggested Daily Rhythm</h3>
          <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setMode('weekday')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${mode === 'weekday' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <Sunrise size={14} className="inline mr-1.5 -mt-0.5" /> Weekday
            </button>
            <button
              onClick={() => setMode('weekend')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${mode === 'weekend' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
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
                    onChange={(e) => updateBlock(b.id, { time: e.target.value })}
                    className="w-full text-right text-xs text-gray-400 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none"
                  />
                ) : (
                  <div className="text-right text-xs text-gray-400">{b.time}</div>
                )}
              </div>
              <div className="flex flex-col items-center pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                {i < blocks.length - 1 && <span className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
              </div>
              <div className="pb-4 flex-1">
                {editing ? (
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <input
                        value={b.title}
                        onChange={(e) => updateBlock(b.id, { title: e.target.value })}
                        className="font-semibold bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                      />
                      <input
                        value={b.detail}
                        onChange={(e) => updateBlock(b.id, { detail: e.target.value })}
                        className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                      />
                    </div>
                    <button
                      onClick={() => deleteBlock(b.id)}
                      className="p-1 text-gray-300 hover:text-red-500 mt-1"
                      aria-label="Delete block"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold">{b.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{b.detail}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <button
            onClick={addBlock}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus size={15} /> Add block to {mode === 'weekday' ? 'weekday' : 'weekend'} rhythm
          </button>
        )}
      </div>

      {/* Execution rules */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
        <div className="flex items-center gap-2 mb-6">
          <ListChecks size={20} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-bold">Execution Rules</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rules.map((r, i) => (
            <div key={r.id} className="border-t border-gray-200 dark:border-gray-700 pt-3 relative">
              <span className="font-display text-3xl text-[rgba(var(--accent-rgb),0.7)]">{String(i + 1).padStart(2, '0')}</span>
              {editing ? (
                <div className="mt-1 space-y-1">
                  <input
                    value={r.title}
                    onChange={(e) => updateRule(r.id, { title: e.target.value })}
                    className="font-semibold bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                  />
                  <input
                    value={r.body}
                    onChange={(e) => updateRule(r.id, { body: e.target.value })}
                    className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 focus:outline-none w-full"
                  />
                  <button
                    onClick={() => deleteRule(r.id)}
                    className="absolute top-3 right-0 p-1 text-gray-300 hover:text-red-500"
                    aria-label="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <h4 className="font-semibold mt-1">{r.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{r.body}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <button
            onClick={addRule}
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus size={15} /> Add rule
          </button>
        )}
      </div>
    </div>
  )
}

export default RoadmapView
