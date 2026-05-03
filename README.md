# Chat-Pie: Fullstack Chat App

A modern fullstack chat application with real-time messaging, friend requests, and audio/video calls. Built with a React frontend and Node.js/Express backend.

## Features

- User authentication (sign up, login, JWT-based auth)
- Real-time chat with WebSockets (Socket.io)
- Friend requests and friend management
- Audio/video call support
- Responsive UI with Tailwind CSS
- Profile management and settings

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, MongoDB, Socket.io
- **Other:** Cloudinary (image uploads), JWT, bcrypt

## Folder Structure

```
fullstack-chat-app-master/
├── backend/        # Express server, API, WebSocket logic
├── frontend/       # React app (Vite), UI components
├── docs/           # Documentation and screenshots
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/fullstack-chat-app-master.git
cd fullstack-chat-app-master
```

### 2. Setup Backend

```bash
cd backend
npm install
# Create a .env file (see .env.example if available)
npm start
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 4. Open in Browser

Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

## Environment Variables

- Backend: Create a `.env` file in `backend/` with MongoDB URI, JWT secret, Cloudinary keys, etc.
- Frontend: (if needed) create a `.env` file in `frontend/` for API base URLs.

## Screenshots

See `Screenshots/` for UI previews.
