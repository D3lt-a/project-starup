# Project Starter

Minimal session-based auth starter using Express, MySQL, React, Vite, and React Router.

## Features
- Register with name, email, password
- Login with email and password
- Session-based authentication
- MySQL database
- Vite React frontend
- Protected dashboard
- Logout button

## Setup

1. Create the database and tables:
```bash
mysql -u root -p < db.sql
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Install dependencies: `backend-project and frontend-projec`
```bash
npm install
```

4. Run locally:
```bash
npm run dev
```

## Notes
- Backend runs on `http://localhost:5000`
- Frontend runs on Vite default port `http://localhost:5173`
- Vite proxies `/api` to the backend# project-starup
