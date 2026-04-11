<div align="center">
  
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg" width="60" alt="React" style="margin-bottom: 20px;" />

  # 🌿 StudySync
  **Organize your academic life. Find your flow. Stay in the zone.**

  <p>
    StudySync is a premium React-based academic command center that integrates real-time task management, an intelligent calendar with conflict detection, and a focused study timer. It features a calming "soft-green" aesthetic and leverages Firebase to provide students with a unified, high-performance platform for organizing their academic life.
  </p>

  <p>
    <a href="#-core-modules">Explore Modules</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-deployment">Deployment</a>
  </p>

</div>

---

## ✨ Philosophy & Design
StudySync rejects the harsh, utilitarian look of traditional planners. Instead, it utilizes a custom **"Luminous Organicism"** design system:
- **Calming Color Palette:** Soft emeralds, sky blues, and warm amber tones.
- **Glassmorphism:** Frosted glass panels, ambient shadows, and signature gradients.
- **Micro-animations:** Satisfying, barely-there interactions that reward user behavior without distraction.

---

## 🧩 Core Modules

### 1. 📋 Sanctuary (Dashboard)
Your central command hub for academic life.
- **Smart Task Management:** Full CRUD operations for your assignments. Set priorities, subjects, and deadlines.
- **Live Sync:** Changes reflect instantly across devices using Firestore `onSnapshot`.
- **Dynamic Weekly Insights:** A visual bar chart mapping completed vs. pending tasks.
- **AI-Vibe Textual Insights:** Encouraging prompts ("You have 3 tasks due tomorrow", "10 tasks completed this week!").

### 2. 📅 Intelligent Calendar
A comprehensive scheduling suite offering full visibility over your academic timeline.
- **Multiple Views:** Seamlessly switch between Month, Week, and Day layouts.
- **Conflict Detection:** Automatically warns you if study sessions or task deadlines overlap.
- **Smart Suggestions:** Evaluates past workflows to suggest an optimal, data-backed study slot for the day.
- **Unified Task Management:** Implements a centralized task-creation modal ensuring perfectly synchronized state between the Dashboard and Calendar.

### 3. 🗂️ Library (Cloud Storage)
A complete, Google Drive-style file management system integrated directly into your workspace.
- **Hierarchical Folders:** Create, rename, delete, and navigate infinite folder trees.
- **PDF Vault:** Upload and store your research and study materials.
- **Smart Tech:** Uses a zero-CORS Base64-to-Firestore encoding strategy for instant, frictionless file storage.
- **View Controls:** Toggle between List and Grid interfaces. Sort by Date Modified or Name. Tag files by subject.

### 4. ⏳ Focus Sanctuary (Flow State)
A breathtaking, distraction-free environment engineered to lock you into deep work.
- **Advanced Pomodoro Engine:** Highly customizable Focus, Break, and Lap configurations.
- **Web-Audio Ambient Soundscapes:** Built-in programmatic audio generation. Listen to *Forest Rain, Morning Birds, Library Ambience, Café, or White Noise*—no external audio files required.
- **Task Tethering:** Link a specific dashboard task to your current focus session and track its progress.
- **Daily Goals & Stats:** Set a daily focus goal (e.g., 120 mins) and watch the circular progress ring fill up as you crush your sessions.

---

## 🛠️ Tech Stack

### Frontend Architecture
- **React.js (Vite):** Blazing fast module bundling and HMR.
- **Tailwind CSS:** Fully customized theme mapping to our unique style tokens.
- **React Router:** Seamless, instant page transitions.
- **Web Audio API:** Native, zero-dependency procedural audio synthesis for ambient soundscapes.

### Backend Infrastructure
- **Firebase Auth:** Secure, instant Email/Password authentication protocols.
- **Cloud Firestore:** NoSQL database handling Users, Tasks, Folders, Files, and Focus Preferences with real-time reactivity.

---

## 📦 Database Schema

**`users/{uid}`**
- `email`, `role`, `createdAt`

**`tasks/{taskId}`**
- `userId`, `title`, `subject`, `deadline`, `status` (pending/completed), `priority` (normal/urgent)

**`library_folders/{folderId}`**
- `userId`, `name`, `parentId`

**`library_files/{fileId}`**
- `userId`, `folderId`, `name`, `size`, `downloadUrl` (Base64), `tag`

**`focus_prefs/{uid}`**
- `focusMins`, `breakMins`, `laps`, `dailyGoal`, `focusedToday`

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-username/StudySync.git
cd StudySync
npm install
```

### 2. Firebase Configuration
1. Head to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication (Email/Password)** and **Firestore Database**.
3. Copy your project configuration object.
4. Replace the config in `src/firebase/config.js` with your keys.

*Note: Since the library uses Firestore Base64 encoding, Firebase Storage configuration is not required!*

### 3. Run the Sanctuary
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Create an account and step into your clean, focused workspace.

---

## 🌐 Deployment

StudySync is fully optimized for Vercel. 
1. Build the production app: `npm run build`
2. Push to GitHub.
3. Import the repository into Vercel.
4. Framework preset: **Vite**.
5. Deploy and share with the world!

---

<div align="center">
  <p><i>"Breathe in. Immerse yourself. Begin your flow."</i></p>
  <p>Built with 💚 for students everywhere.</p>
</div>
