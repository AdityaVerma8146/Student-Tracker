# 📚 Student Syllabus Tracker & To-Do List

> ## Correction: Java on Render needs Docker, not a "Java" runtime (this revision)
> Render has no native Java/Maven runtime option — a previous version of
> this README's deploy instructions said to pick "Environment: Java", which
> doesn't exist and silently falls back to Node.js auto-detection (which
> then fails, since there's no `package.json` at the repo root). Added
> `backend/Dockerfile` (multi-stage: builds the whole app — frontend +
> backend — into one runnable jar, then runs it on a slim JRE image) and a
> root `.dockerignore`. See the corrected "Deploy everything as one Render
> Web Service" steps in `backend/README.md` — the key changes are Root
> Directory stays **blank** (repo root, not `backend`), Runtime is
> **Docker**, and Dockerfile Path is `backend/Dockerfile`.
>
> ## Single-service deploy: Maven now builds + bundles the frontend (this revision)
> `backend/pom.xml` gained a `frontend-maven-plugin` + `maven-resources-plugin`
> build step: `mvn package` (and `mvn spring-boot:run`) now also builds
> `frontend/` and copies its output into
> `backend/src/main/resources/static`, so Spring Boot serves the whole app
> itself. This means the entire project — frontend, backend, and AI
> assistant — can deploy as **one** Render Web Service with **one** URL, no
> CORS setup and no `VITE_API_URL` needed. See "Deploy everything as one
> Render Web Service" in `backend/README.md` for the exact steps
> (`GROQ_API_KEY` env var + a persistent disk for the H2 database file are
> both still required there). For active frontend development, keep using
> `cd frontend && npm run dev` — it's instant hot-reload; the bundled build
> only updates when the backend restarts.
>
> ## Repo restructure: `frontend/` + `backend/` (this revision)
> All frontend files (`src/`, `index.html`, `package.json`, `vite.config.ts`,
> `tailwind.config.js`, `postcss.config.js`, `tsconfig*.json`,
> `.env.example`) moved into a new `frontend/` folder, mirroring the
> existing `backend/` folder — the repo root now only has `frontend/`,
> `backend/`, and this README. Nothing inside either app changed because of
> the move (verified with a clean `tsc --noEmit` and `vite build` from the
> new `frontend/` location); only the two READMEs' instructions were updated
> to `cd frontend` / `cd backend` first.
>
> ## Bug-fix pass: AI chat, white-screen crashes, icon (this revision)
> - **AI Assistant can now hold a real conversation.** New **Chat** tab
>   (`AIAssistant.tsx`) backed by `POST /api/ai/chat`
>   (`AiController`/`AiService.chat`/new `AiChatMessage`/`AiChatRequest`/
>   `AiChatResponse` DTOs) — it answers anything, not just the "Fix Mistakes"
>   / "Build Schedule" flows, and keeps the running conversation for
>   multi-turn context.
> - **"AI isn't working" checklist:** the backend hard-requires `GROQ_API_KEY`
>   (`AiService.requireApiKey`) — if it's unset on your deployed backend, every
>   AI call fails. Double check it's set in your host's environment variables
>   (see `backend/.env.example`). Also note the backend's H2 database is a
>   local **file** (`DB_PATH`, default `./data/authdb`) — if your host's
>   filesystem is ephemeral (wiped on restart/redeploy), accounts/data (and
>   AI config that lives alongside it) can appear to reset unexpectedly;
>   mount a persistent volume at that path if your platform supports one.
> - **Fixed "[object Object]" style error messages.** `utils/apiError.ts`'s
>   `extractErrorMessage` now defensively coerces *any* shape of backend/axios
>   error into a plain string before it ever reaches React state, instead of
>   assuming `error.response.data.error` is always already a string.
>   `aiService.ts` also now checks that a successful response is actually the
>   expected JSON shape (not e.g. an HTML page from a misconfigured proxy)
>   before using it.
> - **Fixed "entire screen turns white".** There was no error boundary
>   anywhere in the app, so any uncaught render error (a missing field, an
>   unexpected response shape, etc.) blanked the whole page with nothing in
>   the UI to recover from. Added `components/ErrorBoundary.tsx`, wrapping
>   the app in `main.tsx`, so a crash now shows a recoverable error screen
>   (with "Try again" / "Reload") instead. Also hardened
>   `GroupDetailView.tsx` (`members`/`tasks` default to `[]`, `Avatar`
>   handles a missing name/email) so a group with an unusual member record
>   degrades gracefully instead of crashing that view in the first place.
> - **Fixed the floating AI icon.** Its ambient glow used to animate both
>   opacity *and* `transform: scale(...)`, which read as the icon
>   drifting/jittering in place — now opacity-only. Its z-index is also
>   raised above every modal in the app so it can never end up hidden behind
>   one.
> - **Centralized all API calls** through one `services/apiClient.ts` axios
>   instance. By default it still calls relative `/api/...` paths (correct
>   when Spring Boot serves the built frontend, the recommended setup below),
>   but now supports an optional `VITE_API_URL` build-time env var for
>   frontend/backend deployed on separate hosts with no `/api` proxy between
>   them — see `.env.example`.
>
> ## Stack rewrite (this revision)
> - **Frontend is now TypeScript.** Every file in `src/` is `.ts`/`.tsx`, with
>   a central `src/types.ts` defining the data model (`Subject`, `Chapter`,
>   `Topic`, `DailyTask`, `DiaryEntry`, `CalendarTask`, `Roadmap`, `Profile`,
>   `UserData`). Verified with `tsc --noEmit` (zero errors) and a production
>   `vite build`.
> - **Backend is now Spring Boot** (Java 17 + Maven), in `backend/`, replacing
>   the old Node/Express + SQLite server. Same API surface (`/api/signup`,
>   `/api/login`, `/api/google-login`, `/api/reset-password`, `/api/user-data`),
>   but:
>   - **SQLite → H2** (file-based, embedded, zero external setup — the closest
>     native Spring Boot equivalent).
>   - **Real password hashing.** The old backend's `hashPassword()` was
>     literally just Base64 — not a hash, trivially reversible. The new
>     backend uses `BCryptPasswordEncoder`. This is a genuine security fix,
>     not just a language-parity change.
>   - Google ID token verification via a plain call to Google's `tokeninfo`
>     endpoint (`AuthService.googleLogin`), rather than pulling in the full
>     `google-auth-library` dependency tree.
>   - ⚠️ **This sandbox has no network access to Maven Central**, so the Java
>     code could not be compiled/run here the way the frontend was. It was
>     written carefully by hand and reviewed for correctness (a couple of real
>     mistakes — a multi-public-type file, a non-existent `ObjectMapper`
>     method — were caught during that review), but you should run
>     `mvn spring-boot:run` yourself before trusting it in production.
> - **New: AI Assistant** (`src/components/AIAssistant.tsx`, backend
>   `AiController`/`AiService`) — a floating panel with two modes:
>   - **Build Schedule** — describe a goal + timeframe in plain language, get
>     a day-by-day task list back, and add it to your Calendar in one click.
>   - **Fix Mistakes** — paste text (task titles, diary entries, roadmap
>     notes) and get spelling/grammar corrections without changing your
>     meaning.
>   - Both call Groq's API server-side — you provide your own
>     `GROQ_API_KEY` (see `backend/.env.example`). The key never touches
>     the frontend.
> - **Real bug fixed along the way:** `authStorage.ts`'s localStorage fallback
>   used to trigger on *any* backend error, including legitimate ones — so a
>   real "wrong password" response from the server could get masked by a
>   confusing "no account found" from the separate local fallback store.
>   Fixed to only fall back when the backend is genuinely unreachable.
>
> ## AI provider swap, Settings menu, and Contact/Report (this revision)
> - **Groq instead of Anthropic** for the AI Assistant. `AiService` now calls
>   Groq's OpenAI-compatible `/openai/v1/chat/completions` endpoint (a
>   genuinely different request/response shape than Anthropic's `/v1/messages`
>   — this wasn't just a config rename). Set `GROQ_API_KEY` in the backend
>   env instead of `ANTHROPIC_API_KEY`. Default model is
>   `openai/gpt-oss-120b` (switched from `llama-3.3-70b-versatile`, which
>   Groq retired in August 2026 — using it now 404s).
> - **Navbar cleanup** — Profile, theme mode, accent color, Contact Us,
>   Report a Problem, and Logout are now consolidated into a single Settings
>   menu (gear icon, top right) instead of six separate buttons cluttering
>   the bar. The main nav row is back down to 6 items.
> - **Contact Us / Report a Problem** — new `POST /api/feedback` endpoint
>   (`FeedbackEntity`/`FeedbackService`/`FeedbackController`) backing a
>   shared modal (`ContactModal.tsx`) for both. Submissions are persisted to
>   the database and logged server-side — there's no email/ticketing
>   integration wired up, so this is the honest state of it: messages are
>   captured and reviewable, not auto-emailed anywhere.
>
> ⚠️ If you shared a real API key in a chat to get this built, rotate it —
> anything that's touched a chat log should be treated as compromised, even
> if it's not committed to a file anywhere.

> See `backend/README.md` for how to run the Spring Boot server.

> ## Group Study, Friends & Badges (this revision)
> A new **Groups** tab, backed by four new backend tables (`study_groups`,
> `group_members`, `group_tasks`, `friendships`) and a matching set of
> controllers/services:
> - **Friends** — search by name or email (`GET /api/users/search`), send/
>   accept/decline requests, list friends. You can only add *accepted
>   friends* to a group.
> - **Groups** — create a group (you become its leader), add friends as
>   members, and a shared task board: the **leader can assign tasks to any
>   member**; **members can create their own tasks** for themselves or leave
>   them unassigned/open. Anyone in the group can see everyone's progress.
> - **Results** — a 1st/2nd/3rd podium ranking members by completion % of
>   their own tasks (assigned + self-created), with ties broken by completed
>   count, then join date. The rest of the group is listed below the podium.
> - **Badges** (on the Profile page) — nine achievements computed live from
>   real activity (topics completed, daily-task streak days, diary entries,
>   groups led/joined, group tasks completed, 1st-place finishes). Nothing is
>   stored — they're always in sync with actual data, and locked ones show
>   greyed-out so there's something to work toward.
>
> This is a genuinely large addition — 4 new entities, ~9 new DTOs, 3 new
> services, 3 new controllers, and 6 new frontend components — verified the
> same way as everything else: `tsc --noEmit` + `vite build` pass clean on
> the frontend. As with the rest of the backend, **the Java code itself
> could not be compiled in this sandbox** (no Maven Central access) — it was
> reviewed by hand (filenames vs. public type names, package declarations vs.
> directory structure, and DTO field order/naming vs. what the frontend
> expects, all checked explicitly), but treat it as unverified until you've
> run it yourself.

> **Earlier merge note:** this app (originally "Student Tracker") is the base
> — real functionality (auth, subjects/chapters/topics, daily tasks, diary,
> profile, dashboard charts) — restyled after a separate dashboard project's
> UI/UX (navy "panel & line" dark theme, `Bebas Neue` headings) with a
> Roadmap tab and a Calendar tab merged in from two other prototypes.


A beautiful, full-featured web application for tracking your study progress across multiple subjects, chapters, and topics. Built with React, featuring real-time progress calculations, stunning dashboards with charts, and a responsive design.

## ✨ Features

### 📊 Dashboard & Analytics
- **Overall Progress Dashboard** - View your complete study status at a glance
- **Subject-wise Progress Chart** - Bar chart showing completion percentage for each subject
- **Completion Analytics** - Pie chart showing completed vs. remaining topics
- **Statistics Overview** - Total subjects, chapters, topics, and completion rates
- **Real-time Updates** - All metrics update instantly as you mark topics complete

### 📚 Subject Management
- Create unlimited subjects
- Edit subject names anytime
- Delete subjects with confirmation
- View subject-wise completion progress
- Organize all your courses in one place

### 📖 Chapter Organization
- Add multiple chapters to each subject
- Edit chapter names
- Delete chapters with all their topics
- Track completion per chapter
- Visual progress bars for each chapter

### ✅ Topic Management
- Add unlimited topics to each chapter
- Mark topics as complete with checkboxes
- Quick visual feedback with strikethrough for completed topics
- Delete individual topics
- Easy topic management interface

### 🎨 Beautiful UI/UX
- **Dark Mode Support** - Toggle dark/light theme with one click
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Smooth Animations** - Elegant transitions and interactions
- **Color-coded Sections** - Easy visual distinction between sections
- **Intuitive Navigation** - Simple and user-friendly interface

### 💾 Data Persistence
- **Local Storage** - All data automatically saved locally
- **Export Data** - Download backup of all your data as JSON
- **Import Data** - Restore from backup file
- **Automatic Saves** - No need to manually save

### 🔍 Search & Filter
- Search across all topics
- Filter by topic name
- Real-time search results
- Global search from any page

## 🚀 Getting Started

### Project layout
```
Student-Tracker/
├── frontend/     ← React + TypeScript + Vite app (everything under here)
└── backend/      ← Spring Boot (Java) API (everything under here)
```
Run each from inside its own folder — they're independent projects with
their own `package.json` / `pom.xml`.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Java 17 + Maven (for the backend — see `backend/README.md`)

### Installation

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend dev server**
   ```bash
   npm run dev
   ```
   This proxies `/api/*` to `http://localhost:4000` in dev, so also start
   the backend (see `backend/README.md`) for a fully working app.

3. **Open in Browser**
   - The app will automatically open at `http://localhost:5173` (Vite's default port)

### Build for Production
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist`.

## 📖 How to Use

### 1. Create a Subject
- Click on "Subjects" in the navigation
- Enter a subject name in the form
- Click "Add Subject"

### 2. Add Chapters
- Click on a subject to expand it
- Click "Add Chapter"
- Enter the chapter name
- The chapter will be added to the subject

### 3. Add Topics
- Click on a chapter to expand it
- Click "Add Topic"
- Enter the topic name
- The topic will be added to the chapter

### 4. Track Progress
- Click the checkbox next to a topic to mark it complete
- Completed topics will show with a checkmark and strikethrough
- Progress bars automatically update
- Dashboard shows real-time statistics

### 5. View Dashboard
- Click "Dashboard" to see your overall progress
- View completion percentages and charts
- See subject-wise progress breakdown
- Check your study statistics

### 6. Dark Mode
- Click the sun/moon icon in the navbar
- Theme will toggle between light and dark modes
- Preference is saved automatically

### 7. Search Topics
- Use the search bar in the navbar
- Results filter in real-time
- Search across all topics

## 📊 Data Structure

```
{
  subjects: [
    {
      id: timestamp,
      name: "Subject Name",
      chapters: [
        {
          id: timestamp,
          name: "Chapter Name",
          topics: [
            {
              id: timestamp,
              name: "Topic Name",
              completed: false
            }
          ]
        }
      ]
    }
  ]
}
```

## 🛠️ Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons
- **Local Storage API** - Data persistence

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🎯 Key Statistics Tracked

- **Total Subjects** - Number of subjects created
- **Total Chapters** - Combined chapters across all subjects
- **Total Topics** - All topics across all chapters
- **Completed Topics** - Topics marked as complete
- **Remaining Topics** - Topics yet to be completed
- **Overall Completion %** - Overall study progress percentage
- **Subject-wise Completion %** - Individual completion for each subject
- **Chapter-wise Completion %** - Individual completion for each chapter

## 🔧 Customization

### Change Colors
Edit `tailwind.config.js` to customize color scheme:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
    }
  }
}
```

### Modify Chart Colors
Edit the `COLORS` array in `src/components/Dashboard.jsx`

## 📝 Notes

- All data is stored locally in your browser
- Clear browser cache to reset data
- Export your data regularly for backup
- Data is not synced across devices
- Perfect for personal study planning

## 🐛 Troubleshooting

### Data not persisting?
- Check if local storage is enabled in your browser
- Try clearing browser cache
- Use private/incognito mode if having issues

### Charts not showing?
- Ensure you have added topics with completion status
- Try refreshing the page
- Check browser console for errors

### Dark mode not working?
- Ensure JavaScript is enabled
- Try refreshing the page
- Check browser console for errors

## 🚀 Future Enhancements

- [ ] Backend integration for cloud sync
- [ ] Multi-device sync
- [ ] Collaborative study groups
- [ ] Spaced repetition algorithm
- [ ] Study streak tracking
- [ ] Performance analytics
- [ ] Notes section for topics
- [ ] Time tracking per topic
- [ ] Mobile app version

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to submit pull requests or open issues for bugs and feature requests.

---

**Happy Studying! 📚✨**
