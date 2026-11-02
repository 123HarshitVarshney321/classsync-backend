# ClassSync Frontend

A simple, readable React frontend for the ClassSync classroom scheduling and timetable system. Built with plain JavaScript, React 19, declarative React Router, and Tailwind CSS v4.

---

## Prerequisites

- **Node.js**: Node 20.19+, 22.12+, or 26+ (`node -v`)
- **npm**: npm 10+ (`npm -v`)
- **Backend**: Spring Boot backend running on `http://localhost:8080` (Java 21, MySQL 8)

---

## Getting Started

### 1. Install Dependencies

From inside the `frontend/` directory:

```bash
npm install
```

### 2. Start the Backend First

Ensure the Spring Boot backend is running on port 8080. For example, from the repository root:

```bash
mvn spring-boot:run
```

Verify that `curl http://localhost:8080/api/health` returns `{"status":"UP"}`.

### 3. Start the Frontend Dev Server

From the `frontend/` directory:

```bash
npm run dev
```

The application will be accessible at:
[http://localhost:5173](http://localhost:5173)

---

## Demo Accounts

All seed demo accounts use the password: `password123`

| Role | Email | Accessible Screens |
|---|---|---|
| **ADMIN** | `admin@classsync.edu` | Timetables, Generate, Campus, Occupancy |
| **PROFESSOR** | `aturing@classsync.edu` | My Week, Find a Room, Occupancy |
| **PROFESSOR** | `alovelace@classsync.edu` | My Week, Find a Room, Occupancy |

Demo account quick-fill buttons are provided on the login page for convenience.

---

## Available npm Scripts

From the `frontend/` folder:

- `npm run dev`: Start the local Vite development server on port 5173 with API proxying.
- `npm run build`: Compile and bundle production assets to `dist/`.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint across all JavaScript/JSX source files.
- `npm test`: Run plain JavaScript unit tests via `vitest run`.

---

## How the API Proxy Works

During development, the browser communicates exclusively with `http://localhost:5173`.
All requests beginning with `/api` are transparently proxied to the backend on `http://localhost:8080` via Vite's built-in development proxy configured in `vite.config.js`:

```js
// vite.config.js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: { environment: 'node' },
})
```

Because requests originate from the same host and port (`localhost:5173`), the standard browser HTTP-only session cookie (`JSESSIONID`) is automatically handled by the browser without cross-origin configuration hurdles.

All client API calls in `src/api/` use relative paths (`/api/...`) and never hard-code port 8080.

---

## Folder Structure

```
frontend/
  index.html
  package.json
  package-lock.json
  vite.config.js
  eslint.config.js
  README.md
  src/
    main.jsx                          BrowserRouter + AuthProvider + App
    App.jsx                           All declarative route mappings
    index.css                         Tailwind v4 (@import "tailwindcss";)
    api/
      client.js                       Fetch wrapper, ApiError, 401 callback
      client.test.js                  Unit tests for HTTP client
      endpoints.js                    Typed API functions matching backend contracts
    auth/
      AuthContext.jsx                 React state auth, login/logout, /api/auth/me restore
      RequireRole.jsx                 Role-based route protection guard
    components/
      Navbar.jsx                      Top navigation bar with role links and logout
      Alert.jsx                       Accessible error and success message banners
      Modal.jsx                       Modal dialog overlay
      ConfirmDialog.jsx               Action confirmation dialog
      Loading.jsx                     Loading indicator
      StatusBadge.jsx                 Color-coded status pills
      WeekNavigator.jsx               Monday–Sunday week selector controls
      WeekCalendar.jsx                Professor calendar view (days × hours)
      OccupancyGrid.jsx               Rooms × hours campus occupancy grid
    pages/
      LoginPage.jsx                   Sign in form with demo account helpers
      NotAllowedPage.jsx              403 Access Denied fallback
      NotFoundPage.jsx                404 Not Found fallback
      professor/
        MyWeekPage.jsx                Weekly calendar, class cancellation, reschedule entry
        FindRoomPage.jsx              Ranked room recommendations, booking & move modes
      shared/
        OccupancyPage.jsx             Campus-wide room occupancy matrix
      admin/
        CampusPage.jsx                Complexes, rooms and facilities management
        TimetablesPage.jsx            Semester draft creation, activation, archiving
        VersionDetailPage.jsx         Master timetable weekly entries management
        GeneratePage.jsx              Calendar occurrence projection & conflict analysis
    utils/
      dates.js                        Time, interval overlaps, and grid position math
      dates.test.js                   Unit tests for date & interval helpers
```
