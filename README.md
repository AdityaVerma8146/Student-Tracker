# 📚 Student Syllabus Tracker & To-Do List

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

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - The app will automatically open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

The built files will be in the `dist` directory.

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
