# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChronoQuest is a full-stack educational platform consisting of:

1. **CHRONO-GAMEAPP**: A Flutter game app featuring a Philippine history-themed auto-runner platformer where students learn through gameplay
2. **CHRONO-DASHBOARD**: A web-based admin/teacher dashboard for managing students, quizzes, and analytics (monorepo with separate frontend and backend)

## Repository Structure

```
CHRONO/
├── CHRONO-GAMEAPP/        # Flutter mobile game app
│   ├── lib/               # Flutter source code
│   ├── assets/            # Game assets (backgrounds, characters, sounds, etc.)
│   ├── pubspec.yaml       # Flutter dependencies
│   └── test/              # Flutter unit tests
└── CHRONO-DASHBOARD/      # Web dashboard (monorepo)
    ├── CDASH/             # React frontend (Vite)
    │   ├── src/           # React components, pages, API clients
    │   ├── package.json   # Frontend dependencies
    │   └── vite.config.js # Vite build config
    └── CBACK/             # Express.js backend
        ├── src/           # Controllers, routes, models, middleware
        ├── package.json   # Backend dependencies
        └── server.js      # Express server entry point
```

## Technology Stack

### Frontend (CDASH)
- **Framework**: React 18 with Vite build tool
- **Styling**: Tailwind CSS + PostCSS
- **State & Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6 with protected/role-based routes
- **API Client**: Axios with centralized configuration
- **UI Components**: Custom components (Button, Modal, DataTable, etc.) + Lucide React icons
- **Data Visualization**: Recharts for analytics
- **Testing**: Vitest with Testing Library
- **Auth**: Google OAuth integration via @react-oauth/google

**Key Patterns**:
- `src/context/AuthContext.jsx`: Centralized authentication state
- `src/hooks/`: Custom hooks for auth, debouncing, polling
- `src/api/`: Modular API clients (auth, analytics, admin, teacher)
- `src/routes/`: Protected routes and role-based access
- Role-based pages: auth/, admin/, teacher/

### Backend (CBACK)
- **Framework**: Express.js with Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Google OAuth Library
- **Security**: Helmet, CORS, Express Validator, Rate Limiting, Bcrypt password hashing
- **Logging**: Morgan for HTTP logging, custom audit log middleware
- **Testing**: Vitest with Supertest and mongodb-memory-server
- **Code Structure**: MVC pattern (controllers, routes, models)

**Key Models**:
- Teacher, Student (users with roles)
- Score, QuizResult (game progress tracking)
- ActivityLog (audit trail)
- SystemSetting (admin configuration)

**API Routes**:
- `/api/v1/auth/`: Login, register, profile completion
- `/api/v1/teacher/`: Teacher-specific endpoints
- `/api/v1/student/`: Student management and performance
- `/api/v1/admin/`: System administration and audit logs
- `/api/v1/analytics/`: Analytics and reporting
- `/health`: Server health check

### Game App (CHRONO-GAMEAPP)
- **Framework**: Flutter with Flame game engine
- **State Management**: Riverpod with code generation
- **Routing**: Go Router for navigation
- **HTTP Client**: Dio for API calls
- **Storage**: Hive for local data persistence, flutter_secure_storage for credentials
- **Animation**: Lottie for smooth animations
- **Fonts & Assets**: Google Fonts, extensive game assets (characters, enemies, obstacles, etc.)
- **Testing**: Flutter test suite

**Key Components**:
- `lib/game/chrono_game.dart`: Main Flame game instance
- `lib/game/components/`: Player, enemies, obstacles, collectibles
- `lib/game/overlays/`: HUD, pause menu, quiz questions
- `lib/screens/`: Game screens (level select, character selection, etc.)
- `lib/providers/`: Riverpod state management (auth, game progress, player data)
- `lib/services/`: API, audio, storage integration

## Common Development Commands

### Frontend (CDASH)
```bash
cd CHRONO-DASHBOARD/CDASH
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:5173)
npm run build                  # Build for production
npm run preview               # Preview production build
npm test                      # Run tests once
npm run test:watch           # Run tests in watch mode
```

### Backend (CBACK)
```bash
cd CHRONO-DASHBOARD/CBACK
npm install                    # Install dependencies
npm run dev                    # Start dev server with nodemon (port 5000)
npm start                     # Start production server
npm test                      # Run tests once
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage report
```

### Game App (CHRONO-GAMEAPP)
```bash
cd CHRONO-GAMEAPP
flutter pub get               # Install dependencies
flutter run                   # Run on connected device/emulator
flutter run -d web           # Run in browser
flutter test                 # Run unit tests
flutter build apk            # Build Android APK
flutter build ios            # Build iOS app
flutter pub run build_runner build  # Generate Riverpod/Hive code
```

## Architecture Patterns & Key Concepts

### Authentication Flow
1. **Frontend**: Google OAuth or email/password login via `/api/v1/auth/login`
2. **Backend**: Validates credentials, issues JWT token
3. **Game App**: Stores token securely via flutter_secure_storage, includes in API requests
4. **Protected Routes**: Frontend wraps protected routes, backend validates JWT middleware

### Role-Based Access Control
- **Roles**: Admin, Teacher, Student
- **Frontend**: `src/routes/RoleRoute.jsx` gates pages by role
- **Backend**: Auth middleware validates JWT claims
- **Game App**: Checks user role before accessing teacher-specific features

### Data Flow: Dashboard to Game
1. Teachers create quizzes/classes via dashboard
2. Backend stores in MongoDB
3. Game app fetches quiz data via Dio API client
4. Player answers questions, scores submitted back to backend
5. Dashboard displays real-time analytics from backend

### State Management
- **Frontend**: React Context (AuthContext) + component-level state
- **Game App**: Riverpod providers for auth, game progress, player data
- **Backend**: Mongoose models for persistent state

### Error Handling
- **Frontend**: API errors caught and displayed via react-hot-toast
- **Backend**: Centralized errorHandler middleware transforms exceptions to standard format
- **Game App**: Dio error interceptors handle network failures

## Environment Configuration

### Backend (CBACK)
Create `.env` in `CHRONO-DASHBOARD/CBACK/`:
```
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173  # Frontend URL for CORS
```

### Frontend (CDASH)
Environment variables can be set in `.env`, but check `vite.config.js` for any build-time configuration needs.

### Game App (CHRONO-GAMEAPP)
API endpoints configured in `lib/core/dio_client.dart` and `lib/services/api_service.dart`. Adjust base URL for different backend environments.

## Testing Strategy

- **Frontend**: Vitest for unit tests, Testing Library for component tests
- **Backend**: Vitest for unit/integration tests, mongodb-memory-server for database testing
- **Game App**: Flutter test framework for unit tests
- Run tests frequently during development to catch regressions

## Performance & Optimization Notes

- **Frontend**: Vite provides fast HMR; Tailwind is purged for production
- **Backend**: Rate limiting middleware protects against abuse; MongoDB indexes should be configured for common queries
- **Game App**: Flame handles rendering efficiently; Riverpod prevents unnecessary rebuilds via code generation

## Deployment

- **Frontend**: Deployable to Vercel (see `vercel.json`)
- **Backend**: Deployable to Vercel or any Node.js host
- **Game App**: Build APK for Android, or use Firebase App Distribution

## Key Files to Know

- **Backend Route Registration**: `CHRONO-DASHBOARD/CBACK/src/routes/index.js` - all routes defined here
- **Frontend API Configuration**: `CHRONO-DASHBOARD/CDASH/src/api/axios.js` - centralized Axios setup
- **Game App Navigation**: `CHRONO-GAMEAPP/lib/core/router.dart` - Go Router configuration
- **Database Models**: `CHRONO-DASHBOARD/CBACK/src/models/` - Mongoose schemas
