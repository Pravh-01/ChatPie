# Chat-Pie: Fullstack Chat App

A modern fullstack chat application with real-time messaging, friend requests, audio/video calls, and random stranger chat. Features end-to-end encryption, image sharing, multiple themes, and a responsive UI built with React and Node.js.

## Features

- **User Authentication**: Secure sign up, login with JWT-based authentication
- **Real-time Chat**: Instant messaging with WebSockets (Socket.io) and message seen status
- **End-to-End Encryption**: Messages and images are encrypted for privacy
- **Image Sharing**: Upload and share images in chats using Cloudinary
- **Friend System**: Send friend requests, manage friends, and chat with friends
- **Random Stranger Chat**: Connect with random users for anonymous conversations
- **Audio/Video Calls**: Make voice and video calls with friends or random matches
- **Multiple Themes**: Choose from 30+ beautiful themes including light, dark, and colorful options
- **Profile Management**: Update profile information and avatar
- **Settings**: Customize app preferences and appearance
- **Responsive UI**: Mobile-friendly interface built with Tailwind CSS and DaisyUI
- **Unread Message Indicators**: Track unread messages in sidebar

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, DaisyUI, Axios, Zustand (state management)
- **Backend:** Node.js, Express, MongoDB, Socket.io, Stream Chat
- **Security:** JWT authentication, bcrypt password hashing, AES-256-GCM encryption
- **Media:** Cloudinary (image uploads), WebRTC (audio/video calls)
- **Other:** Crypto (message encryption), UUID (call IDs)

## Folder Structure

```
ChatPie/
├── backend/           # Express server, API, WebSocket logic, encryption
│   ├── src/
│   │   ├── controllers/    # Route handlers (auth, chat, friends, messages)
│   │   ├── lib/           # Utilities (Cloudinary, DB, encryption, Socket.io, Stream Chat)
│   │   ├── middleware/    # Authentication middleware
│   │   ├── models/        # MongoDB schemas (User, Message, FriendRequest)
│   │   ├── routes/        # API routes
│   │   └── seeds/         # Database seed data
├── frontend/          # React app (Vite), UI components
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Login, Chat, Profile, etc.)
│   │   ├── store/         # Zustand state management
│   │   └── lib/           # Utilities and API client
└── screenshots/       # UI preview images
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/Pravh-01/ChatPie.git
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

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env):**

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `STREAM_API_KEY`: Stream Chat API key
- `STREAM_SECRET_KEY`: Stream Chat secret key
- `ENCRYPTION_KEY`: 64-character hex key for message encryption (auto-generated if not provided)

**Frontend (.env):**

- `VITE_API_BASE_URL`: Backend API URL (e.g., http://localhost:5001)

## Screenshots

See `screenshots/` for UI previews.
