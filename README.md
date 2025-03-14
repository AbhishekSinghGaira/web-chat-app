# ChatApp - Mobile Responsive Chat Application

A feature-rich chat application with Google authentication, media sharing, voice calls, group chats, and user search functionality.

## Features

- **Google Authentication**: Secure login with Google accounts
- **Real-time Messaging**: Instant message delivery and updates
- **Media Sharing**: Share images, videos, audio, and files directly through Firestore
- **Voice/Video Calls**: Connect with friends through voice and video calls
- **Group Chats**: Create and manage group conversations
- **User Search**: Find other users by username
- **Unique Usernames**: Each user has a unique username for easy discovery
- **Mobile Responsive**: Works seamlessly on both desktop and mobile devices

## Technologies Used

- React 19
- TypeScript
- Firebase (Authentication, Firestore Database)
- Material UI 6
- React Router 7
- Simple-peer (for WebRTC voice/video calls)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase project

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
3. Create Firestore Database:
   - Go to Firestore Database > Create database
   - Start in production mode
   - Set up appropriate security rules for your database
4. Get your Firebase configuration:
   - Go to Project settings > General
   - Scroll down to "Your apps" section
   - Click on the web app (create one if needed)
   - Copy the firebaseConfig object

### Project Setup

1. Clone the repository
   ```
   git clone <repository-url>
   cd chat-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Update Firebase configuration
   - Open `src/firebase.ts`
   - Replace the firebaseConfig object with your own Firebase configuration

4. Start the development server
   ```
   npm start
   ```

5. Build for production
   ```
   npm run build
   ```

## Usage Guide

### Authentication

- When you first open the app, you'll be directed to the login page
- Click "Sign in with Google" to authenticate
- On first login, a unique username will be automatically generated for you

### Messaging

- Select a chat from the sidebar to start messaging
- Type your message in the input field and press Enter or click the send button
- Share media by clicking the attachment icon (limited to 5MB per file)

### Media Sharing

- The app uses Firestore to store media files as base64 encoded strings
- Images, videos, audio files, and documents can be shared
- File size is limited to 5MB for all media types
- Group profile images are limited to 2MB

### Finding Users

- Click the "Find Users" button in the sidebar
- Search for users by username
- Click "Message" to start a conversation

### Creating Groups

- Click the "Create Group" button in the sidebar
- Add a group name and optional group image
- Search and select users to add to the group
- Click "Create Group" to create the group chat

### Profile Management

- Click on your profile to view and edit your information
- Update your username (must be unique)

### Voice/Video Calls

- Open a chat with a user
- Click the video call icon in the chat header
- Accept the call on the other end to start the conversation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Firebase](https://firebase.google.com/) for backend services
- [Material UI](https://mui.com/) for UI components
- [Simple-peer](https://github.com/feross/simple-peer) for WebRTC implementation
"# web-chat-app" 
