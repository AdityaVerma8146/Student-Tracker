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

export const DEFAULT_SEMESTER_NODES: import('../types').SemesterRoadmapNode[] = [
  {
    id: 'sem-5',
    title: 'Semester 5: Computer Science & Engineering',
    type: 'semester',
    parentId: null,
    completed: false,
    progress: 52,
  },
  {
    id: 'sub-algo',
    title: 'Design & Analysis of Algorithms',
    type: 'subject',
    parentId: 'sem-5',
    completed: false,
    progress: 68,
    notes: 'Primary core module. Focus on asymptotic bounds and graph paradigms.',
  },
  {
    id: 'unit-graphs',
    title: 'Unit 3: Graph Algorithms & Minimum Spanning Trees',
    type: 'unit',
    parentId: 'sub-algo',
    completed: false,
    progress: 75,
  },
  {
    id: 'ch-shortest',
    title: 'Chapter 4: Shortest Path Problems',
    type: 'chapter',
    parentId: 'unit-graphs',
    completed: false,
    progress: 80,
  },
  {
    id: 'top-dijkstra',
    title: "Topic: Dijkstra's Single-Source Shortest Path",
    type: 'topic',
    parentId: 'ch-shortest',
    completed: true,
    progress: 100,
  },
  {
    id: 'task-dijkstra-impl',
    title: 'Task: Implement Min-Heap Dijkstra in C++/Java with adjacency list',
    type: 'task',
    parentId: 'top-dijkstra',
    completed: true,
    progress: 100,
  },
  {
    id: 'task-dijkstra-practice',
    title: 'Task: Solve Network Delay Time (LC 743) and Cheapeast Flights (LC 787)',
    type: 'task',
    parentId: 'top-dijkstra',
    completed: true,
    progress: 100,
  },
  {
    id: 'top-bellman',
    title: 'Topic: Bellman-Ford & Negative Weight Cycles',
    type: 'topic',
    parentId: 'ch-shortest',
    completed: false,
    progress: 60,
  },
  {
    id: 'task-bellman-notes',
    title: 'Task: Write proof for |V|-1 edge relaxation invariant',
    type: 'task',
    parentId: 'top-bellman',
    completed: true,
    progress: 100,
  },
  {
    id: 'task-bellman-impl',
    title: 'Task: Code negative cycle detection logic',
    type: 'task',
    parentId: 'top-bellman',
    completed: false,
    progress: 0,
  },
  {
    id: 'ch-mst',
    title: "Chapter 5: Kruskal's & Prim's Algorithms",
    type: 'chapter',
    parentId: 'unit-graphs',
    completed: false,
    progress: 70,
  },
  {
    id: 'top-disjoint',
    title: 'Topic: Disjoint Set Union (Union-Find) with Rank & Path Compression',
    type: 'topic',
    parentId: 'ch-mst',
    completed: true,
    progress: 100,
  },
  {
    id: 'task-dsu-code',
    title: 'Task: Implement DisjointSet class with amortized O(alpha(N))',
    type: 'task',
    parentId: 'top-disjoint',
    completed: true,
    progress: 100,
  },
  {
    id: 'sub-os',
    title: 'Operating Systems & System Architecture',
    type: 'subject',
    parentId: 'sem-5',
    completed: false,
    progress: 35,
    notes: 'Kernel structures, multi-threading, concurrency primitives.',
  },
  {
    id: 'unit-mem',
    title: 'Unit 2: Virtual Memory & Page Replacement',
    type: 'unit',
    parentId: 'sub-os',
    completed: false,
    progress: 35,
  },
  {
    id: 'ch-paging',
    title: 'Chapter 3: Paging, TLB & Inverted Page Tables',
    type: 'chapter',
    parentId: 'unit-mem',
    completed: false,
    progress: 35,
  },
  {
    id: 'top-tlb',
    title: 'Topic: Translation Lookaside Buffer Hit/Miss Latency Calculations',
    type: 'topic',
    parentId: 'ch-paging',
    completed: false,
    progress: 35,
  },
  {
    id: 'task-tlb-calc',
    title: 'Task: Solve Effective Memory Access Time problems with 2-level paging',
    type: 'task',
    parentId: 'top-tlb',
    completed: false,
    progress: 0,
  },
]

export const createDefaultRoadmap = (): Roadmap => ({
  weeks: DEFAULT_ROADMAP_WEEKS,
  weekdayBlocks: DEFAULT_WEEKDAY_BLOCKS,
  weekendBlocks: DEFAULT_WEEKEND_BLOCKS,
  rules: DEFAULT_EXECUTION_RULES,
  semesterNodes: DEFAULT_SEMESTER_NODES,
});
