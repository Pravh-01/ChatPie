## Plan: Add Random Chat Feature

TL;DR: Implement a backend endpoint that selects a random non-friend user and a frontend action/button that starts a chat with that selected user.

Steps
1. Add a new controller action in `backend/src/controllers/chat.controller.js` named `getRandomChatUser`.
   - Use `req.user._id` to identify the current user.
   - Query accepted friendships from `FriendRequest` and collect friend IDs.
   - Select a random `User` where `_id` is not current user and not in accepted friend IDs.
   - Return 404 if no eligible user exists.
2. Extend `backend/src/routes/chat.route.js` to expose `GET /random` using `protectRoute`.
3. Add a new action in `frontend/src/store/useChatStore.js` named `startRandomChat`.
   - Call `/chat/random`.
   - On success, set `selectedUser` and fetch messages for that user.
   - Handle errors with toast feedback.
4. Add a visible UI control in `frontend/src/components/Sidebar.jsx`.
   - Add a `Random chat` button near the sidebar action area.
   - Call `startRandomChat` when clicked.

Relevant files
- `backend/src/controllers/chat.controller.js` — add random-user selection logic
- `backend/src/routes/chat.route.js` — add new random-chat route
- `frontend/src/store/useChatStore.js` — add action to fetch random chat partner and load messages
- `frontend/src/components/Sidebar.jsx` — add UI button to start random chat

Verification
1. Confirm `GET /api/chat/random` returns a random non-friend user and excludes the current user.
2. Confirm clicking the sidebar `Random chat` button selects a partner and loads the conversation.
3. Confirm a friendly error message appears when no eligible users are available.

Decisions
- Use the existing chat route namespace (`/api/chat`) for the random-chat endpoint.
- Exclude only already accepted friends from matching; pending friend requests are not blocked by this feature.
- No friendship creation is performed; this is an ad hoc random chat selection.
