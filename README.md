# Streaming SSE App

A single-page React app that simulates a **real-time streaming API** using **Server-Sent Events (SSE)**.  
It mocks the backend, streams one event every 100ms, parses the data into TypeScript types, and renders it in a styled chat UI with TailwindCSS.

## ✨ Features

- **Runs locally** — no external services needed.
- **Mock API** — streams pre-defined events at 100ms intervals, ending with a `complete` event.
- **Type-safe parsing** — converts SSE JSON messages into TypeScript types.
- **Live UI updates** — assistant messages update in real-time as events arrive.
- **Card actions** — approve (✓) to finalize, reject (✕) to remove from chat.
- **UI polish** — gradient backgrounds, rounded chat bubbles, hover effects, and animations.
- **Brief assistant display** — shows only the first 120 characters for a clean chat flow.

## 📸 UI Preview

- **User messages** — appear in blue-toned bubbles.
- **Assistant messages** — brief text with a typing indicator while streaming.
- **Edit cards** — show suggested changes with approve/reject controls.
- **Finalized cards** — highlighted in green.

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** TailwindCSS (via CDN)
- **Backend:** Node.js + Express (SSE server)

## 🚀 Getting Started

### 1️⃣ Install dependencies
```bash
npm install

```

### 2️⃣ Start the development server
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001/api/improve