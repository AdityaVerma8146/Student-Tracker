import type { RoadmapWeek, RoadmapBlock, RoadmapRule, Roadmap } from '../types';

// Seed content ported over from the p2 dashboard project. This is only the
// *default* roadmap — once loaded, the user can edit/add/remove everything
// on the Roadmap tab, and their version is what gets persisted from then on.

export const DEFAULT_ROADMAP_WEEKS: RoadmapWeek[] = [
  {
    id: 'week-1',
    range: 'Week 1',
    label: 'Ignition',
    focus: [
      { id: 'w1-1', subject: 'DSA', detail: 'Recursion, Linked List, Stack & Queues' },
      { id: 'w1-2', subject: 'Web Dev', detail: 'Framework fundamentals + auth basics' },
      { id: 'w1-3', subject: 'AI / ML', detail: 'Foundations — core concepts, Parts 1–6' },
    ],
  },
  {
    id: 'week-2',
    range: 'Week 2',
    label: 'Structure',
    focus: [
      { id: 'w2-1', subject: 'DSA', detail: 'Binary Trees & BST' },
      { id: 'w2-2', subject: 'Web Dev', detail: 'Dashboard UI, forms, and file handling' },
      { id: 'w2-3', subject: 'AI / ML', detail: 'Applied APIs and integrations' },
    ],
  },
  {
    id: 'week-3',
    range: 'Week 3',
    label: 'Expansion',
    focus: [
      { id: 'w3-1', subject: 'DSA', detail: 'Heaps, Tries, Graphs' },
      { id: 'w3-2', subject: 'Web Dev', detail: 'Editor tooling and in-browser tooling' },
      { id: 'w3-3', subject: 'AI / ML', detail: 'API deployment + agentic workflows' },
    ],
  },
  {
    id: 'week-4',
    range: 'Week 4',
    label: 'Finish Line',
    focus: [
      { id: 'w4-1', subject: 'DSA', detail: 'Dynamic Programming, Greedy, Misc' },
      { id: 'w4-2', subject: 'Web Dev', detail: 'Final polish and deployment' },
      { id: 'w4-3', subject: 'AI / ML', detail: 'Capstone project build' },
    ],
  },
];

export const DEFAULT_WEEKDAY_BLOCKS: RoadmapBlock[] = [
  { id: 'wd-1', time: 'Morning', title: 'Classes / Commitments', detail: 'Use breaks for short video lessons at 1.5–2x speed.' },
  { id: 'wd-2', time: 'Evening — 1h', title: 'Focused Practice', detail: 'One targeted problem, done properly, before dinner.' },
  { id: 'wd-3', time: 'Night — 2.5h', title: 'Build Session', detail: 'Project work or model training — hands on keyboard.' },
];

export const DEFAULT_WEEKEND_BLOCKS: RoadmapBlock[] = [
  { id: 'we-1', time: 'Morning — 3h', title: 'Deep Practice', detail: 'Clear the backlog on your hardest topics.' },
  { id: 'we-2', time: 'Midday — 3h', title: 'Full-Stack Build', detail: 'Ship a real feature end to end.' },
  { id: 'we-3', time: 'Afternoon — 4h', title: 'Applied Lab', detail: 'Hands-on modules, notebooks, or experiments.' },
  { id: 'we-4', time: 'Evening — 2h', title: 'Project Time', detail: 'Portfolio or capstone work.' },
];

export const DEFAULT_EXECUTION_RULES: RoadmapRule[] = [
  { id: 'rule-1', title: '20-Minute Cap', body: 'Never sit stuck on one problem past 20–25 minutes. Read the approach, absorb the pattern, then write it clean yourself.' },
  { id: 'rule-2', title: 'Fast-Forward Theory', body: 'Speed through familiar theory. Slow down only for genuinely new material.' },
  { id: 'rule-3', title: 'Build Alongside', body: 'Write project code while a lesson plays, not strictly after it ends.' },
  { id: 'rule-4', title: 'Cut the Optional', body: "Skip redundant modules you've already covered elsewhere. No wasted reps." },
];

export const createDefaultRoadmap = (): Roadmap => ({
  weeks: DEFAULT_ROADMAP_WEEKS,
  weekdayBlocks: DEFAULT_WEEKDAY_BLOCKS,
  weekendBlocks: DEFAULT_WEEKEND_BLOCKS,
  rules: DEFAULT_EXECUTION_RULES,
});
