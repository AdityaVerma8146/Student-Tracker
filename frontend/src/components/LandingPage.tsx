import {
  Sparkles,
  Calendar,
  BookOpen,
  Users,
  LogIn,
  ArrowRight,
  Compass,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldCheck,
  Flame,
  Layers,
  ChevronRight
} from 'lucide-react'
import LandingScene from './LandingScene'

interface LandingPageProps {
  onLogin: () => void
  onSignup: () => void
}

export default function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  const scrollToFeatures = () => {
    const el = document.getElementById('features')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden selection:bg-blue-500/30">
      {/* Top Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <span className="font-display text-2xl tracking-wider block leading-none">Student Tracker</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-blue-400">Academic SaaS</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={scrollToFeatures}
              className="hidden sm:inline-block text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={onLogin}
              className="text-sm font-semibold text-gray-200 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onSignup}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden min-h-[92vh] flex items-center">
        {/* 3D WebGL Canvas Layer */}
        <div className="absolute inset-0 z-0">
          <LandingScene />
          {/* Depth gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/60 via-transparent to-[#030712]" />
          <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next-Generation AI Academic Management
          </div>

          {/* Headline */}
          <h1 className="font-display text-6xl sm:text-7xl lg:text-9xl tracking-tight mb-6 max-w-5xl mx-auto leading-[0.92]">
            Organize. Master. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Achieve More.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-300/90 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            The all-in-one productivity platform designed for high-performing students. Turn chaotic syllabi into structured roadmaps, conflict-free calendars, and collaborative study groups.
          </p>

          {/* Pillars Checklist */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-12 text-sm font-semibold text-gray-300">
            <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-blue-400">1.</span> Plan
            </span>
            <ChevronRight size={16} className="text-gray-600 hidden sm:inline" />
            <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-purple-400">2.</span> Learn
            </span>
            <ChevronRight size={16} className="text-gray-600 hidden sm:inline" />
            <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-emerald-400">3.</span> Track
            </span>
            <ChevronRight size={16} className="text-gray-600 hidden sm:inline" />
            <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-amber-400">4.</span> Improve
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onSignup}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 bg-white text-slate-950 hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all backdrop-blur-md"
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Core Workflow Pillars Section */}
      <section id="features" className="relative z-10 bg-[#030712] py-28 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-display text-4xl sm:text-6xl mb-4">Engineered for Academic Excellence</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              No generic to-do apps. Every feature in Student Tracker is purposefully crafted to tackle real college coursework, deadlines, and group projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* 1. Plan */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 p-8 rounded-3xl hover:border-blue-500/50 hover:bg-white/[0.06] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Compass size={28} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-blue-400 block mb-2">Phase 1</span>
              <h3 className="text-2xl font-bold mb-3">AI Roadmap &amp; Planning</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Connect semester goals into navigable units, chapters, and tasks. Let AI generate targeted study sprints tailored to your upcoming exams.
              </p>
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-400" /> Hierarchical topic mapping</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-400" /> Automated study sprints</li>
              </ul>
            </div>

            {/* 2. Learn */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 p-8 rounded-3xl hover:border-purple-500/50 hover:bg-white/[0.06] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-purple-400 block mb-2">Phase 2</span>
              <h3 className="text-2xl font-bold mb-3">Dedicated Workspaces</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Each course gets its own focused hub. Track professors, course credits, lecture notes, syllabus checklists, and assignments in one place.
              </p>
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-400" /> Chapter-by-chapter tracking</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-400" /> Course notes &amp; credits</li>
              </ul>
            </div>

            {/* 3. Track */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 p-8 rounded-3xl hover:border-emerald-500/50 hover:bg-white/[0.06] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 block mb-2">Phase 3</span>
              <h3 className="text-2xl font-bold mb-3">Conflict-Free Calendar</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Switch between Month, Week, and Day views. Automatic conflict detection flags overlapping classes and study slots before they cause stress.
              </p>
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Month, Week, and Day views</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> ⚠️ Overlap conflict alerts</li>
              </ul>
            </div>

            {/* 4. Improve */}
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 p-8 rounded-3xl hover:border-amber-500/50 hover:bg-white/[0.06] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-2">Phase 4</span>
              <h3 className="text-2xl font-bold mb-3">Real-Time Study Groups</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Form accountability teams with searchable groups, join request approvals, real-time group chat, active member presence, and completion leaderboards.
              </p>
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-400" /> Request lifecycle &amp; chat</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-400" /> Podium progress rankings</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Spotlight: Metrics & Streaks */}
      <section className="py-24 bg-gradient-to-b from-[#030712] via-[#091124] to-[#030712] border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-4">
                <Flame size={14} /> Built-in Motivation Engine
              </div>
              <h2 className="font-display text-4xl sm:text-5xl mb-6">
                Stay consistent with streaks and instant AI guidance.
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                When you're overwhelmed by exams, the AI Assistant analyzes your syllabus completion gaps and suggests the exact next topic to study to maximize your grades.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 mt-1">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Daily &amp; Weekly Productivity Charts</h4>
                    <p className="text-sm text-gray-400">Recharts telemetry reveals when you study best and where you spend your time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 mt-1">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Deadlines Radar</h4>
                    <p className="text-sm text-gray-400">Never miss an assignment with rolling 7-day priority countdowns.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Preview Card */}
            <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                    DS
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Data Structures &amp; Algorithms</h4>
                    <p className="text-xs text-gray-400">Prof. Harrison &bull; 4 Credits</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  82% Complete
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Current Unit: Graph Traversal (DFS/BFS)</span>
                  <span className="text-blue-400 font-semibold">4 / 5 Topics</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '80%' }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-3">
                <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white mb-0.5">AI Recommendation:</strong>
                  Spend 45 minutes on Dijkstra's Shortest Path before tomorrow's lab to complete this module.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to start CTA Banner */}
      <section className="py-24 border-t border-white/10 text-center relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <h2 className="font-display text-5xl sm:text-7xl mb-6">Ready to Master Your Semester?</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Sign up in seconds with either your Email or Mobile phone number. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onSignup}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-9 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95"
            >
              Create Free Account
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-sm text-gray-500">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <span className="font-display text-xl tracking-wider text-white">Student Tracker</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Student Tracker Platform. Built for academic excellence.</p>
          <div className="flex items-center gap-4 text-xs">
            <button onClick={onLogin} className="hover:text-white transition-colors">Sign In</button>
            <button onClick={onSignup} className="hover:text-white transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
