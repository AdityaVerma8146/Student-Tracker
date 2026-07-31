# 📚 Student Syllabus Tracker & To-Do List

A full-stack study companion for tracking your syllabus progress across subjects, chapters, and topics — plus daily study habits, a mood diary, and a personal profile. Built with React + Vite on the frontend and a small Express/Node backend for accounts and data storage.

## ✨ Features

### 🔐 Accounts
- Email/password sign up and login
- **Sign in with Google** (real Google account picker via Google Identity Services)
- Password reset
- Each account's data is private and stored server-side, keyed by email

### 📊 Dashboard & Analytics
- Overall progress dashboard with real-time stats
- Subject-wise progress bar chart
- Completed vs. remaining topics pie chart
- Weekly/monthly daily-task completion trends

### 📚 Subject / Chapter / Topic Tracking
- Create unlimited subjects, each with chapters and topics
- Edit or delete subjects and chapters (with confirmation)
- Mark topics complete with a checkbox; strikethrough + timestamp on completion
- Live progress percentage per chapter and per subject

### ✅ Daily Tasks
- Add recurring daily study tasks (e.g. "Revise flashcards", "30 min reading")
- Weekly tracker grid (Monday–Sunday) to check off each day
- Progress charts by day/week/month

### 📝 Diary
- Log a daily mood + written note
- **Edit or delete** any past entry (hover an entry to reveal the actions)
- Entries show an "edited" timestamp after being updated

### 👤 Profile
- Upload a profile photo (or auto-filled from your Google account)
- Set a display name and a short bio / study goals
- Quick stats: subjects, topics completed, daily tasks, diary entries
- Accessible from the navbar avatar or the "Profile" menu link

### 🎨 UI/UX
- Dark mode toggle (saved automatically)
- Responsive layout for desktop, tablet, and mobile
- Global search across topics

### 💾 Data Persistence
- All data is saved to the backend automatically as you use the app — no manual save needed
- JSON export/import utilities available in `src/utils/storage.js`

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Redux Toolkit, Tailwind CSS, Recharts, Lucide React, `@react-oauth/google`
**Backend:** Node.js, Express, `google-auth-library` (verifies Google sign-in tokens), flat-file JSON storage (`backend-data.json`)

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
npm install
```

### Run locally (frontend + backend together)

```bash
npm start
```

This runs the Express API on `http://localhost:4000` and the Vite dev server on `http://localhost:3000` (which proxies `/api` requests to the backend). Open `http://localhost:3000` in your browser.

Running the pieces separately, if you need to:

```bash
npm run server   # backend only, port 4000
npm run dev      # frontend only, port 3000
```

### Build for production

```bash
npm run build
```

Output goes to the `dist` directory. Note: the backend (`server.js`) needs to be deployed/hosted separately and `dist` served behind it or a reverse proxy that forwards `/api` to it — a static-only host (e.g. Netlify, GitHub Pages) cannot run the Express server.

### Enabling Google Sign-In (optional)

Google sign-in is disabled by default until you provide your own OAuth client ID:

1. Create a Client ID at the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) (Application type: **Web application**).
2. Add `http://localhost:3000` (and your production domain, once deployed) under **Authorized JavaScript origins**.
3. Copy `.env.example` to `.env` and fill in your client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
4. Restart `npm start`.

Without this, the "Continue with Google" button is shown disabled with an explanatory tooltip — the rest of the app works normally with email/password accounts.

## 📖 How to Use

1. **Sign up / log in** — create an account with email + password, or use Google once configured.
2. **Add a subject** → add chapters → add topics, then check off topics as you complete them.
3. **Daily Tasks** on the Dashboard — add a recurring task and tick it off day by day in the weekly grid.
4. **Diary** — write a note with your mood; hover an entry to edit or delete it.
5. **Profile** — click your avatar in the navbar to upload a photo and set your name/bio.
6. **Dashboard** — see your overall completion, charts, and trends at a glance.
7. **Dark mode** — toggle via the sun/moon icon; your preference is remembered.
8. **Search** — use the navbar search box to filter topics in real time.

## 📊 Data Model

Each account's stored data looks like:

```json
{
  "subjects": [
    {
      "id": "timestamp",
      "name": "Subject Name",
      "chapters": [
        {
          "id": "timestamp",
          "name": "Chapter Name",
          "topics": [
            { "id": "timestamp", "name": "Topic Name", "completed": false, "completedAt": null }
          ]
        }
      ]
    }
  ],
  "dailyTasks": [
    { "id": "timestamp", "name": "Task name", "duration": "30m", "schedule": { "2026-07-27": true } }
  ],
  "diaryEntries": [
    { "id": "timestamp", "text": "...", "mood": "😊", "createdAt": "ISO date", "updatedAt": "ISO date" }
  ],
  "profile": {
    "name": "",
    "bio": "",
    "avatar": "data:image/png;base64,..."
  }
}
```

## 📁 Project Structure

```
├── server.js                 # Express API: auth, Google sign-in verification, user data storage
├── backend-data.json         # Auto-created; local JSON "database" of accounts (gitignored)
├── src/
│   ├── App.jsx                # Top-level state, routing between views, autosave
│   ├── main.jsx                # React entry point, GoogleOAuthProvider setup
│   ├── components/
│   │   ├── Login.jsx / Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── SubjectList.jsx / SubjectForm.jsx / ChapterList.jsx / ChapterForm.jsx / TopicList.jsx / TopicForm.jsx
│   │   ├── DailyTasks.jsx
│   │   ├── Diary.jsx
│   │   ├── Profile.jsx
│   │   └── Navbar.jsx
│   ├── store/                 # Redux Toolkit slices (auth)
│   └── utils/                 # storage.js (stats/date helpers), authStorage.js (API calls)
```

## 🔧 Customization

**Change theme colors:** edit `tailwind.config.js`.
**Change chart colors:** edit the `COLORS` array in `src/components/Dashboard.jsx`.

## 🐛 Troubleshooting

**"Request failed with status code 502"** — the frontend can't reach the backend. Make sure `npm start` (or `npm run server`) is actually running the Express API on port 4000, and that nothing else is using that port.

**Stuck on a blank/loading screen after restarting the server** — this happens if `backend-data.json` was reset/deleted while your browser still remembers a previous login. The app will now detect this and return you to the login screen automatically; just log in or sign up again.

**Google button is greyed out** — you haven't set `VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID` in `.env` yet (see setup steps above).

**Dark mode / charts not updating** — try a hard refresh; check the browser console for errors.

## 🚀 Possible Future Enhancements

- [ ] Multi-device sync improvements / real database instead of flat JSON file
- [ ] Study streak tracking
- [ ] Notes attached to individual topics
- [ ] Time tracking per topic
- [ ] Collaborative study groups

## 📄 License

MIT License — free to use for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for bugs and feature requests.

---

**Happy Studying! 📚✨**
