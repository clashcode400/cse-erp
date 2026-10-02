# 🚀 CSE Department ERP — Web & Mobile App Deployment Guide

This guide details the complete deployment process for the **Computer Science & Engineering Department ERP**, covering:
1. **Web Deployment** (Frontend + Backend + PostgreSQL Database)
2. **Mobile App Deployment** (Instant PWA Installation & Native Android APK via Capacitor)

---

## 🌐 PART 1: Web Deployment

### Architecture Overview
- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts (Deploy on **Vercel**, **Netlify**, or **Render**)
- **Backend**: Django 5 + Django REST Framework + SimpleJWT + WhiteNoise (Deploy on **Render**, **Railway**, or **VPS**)
- **Database**: Managed PostgreSQL

---

### Option A: 1-Click Full-Stack Deployment with Render (`render.yaml`)

The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/ACER/.antigravity-ide/cse-erp/render.yaml) blueprint:

1. Push your code to GitHub/GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **Blueprints** → **New Blueprint Instance**.
3. Select your repository.
4. Render will automatically provision:
   - Managed **PostgreSQL Database** (`cse-erp-postgres`)
   - **Django Backend Web Service** (`cse-erp-backend`) with automatic migrations & static collection
   - **React Static Frontend** (`cse-erp-frontend`) with URL rewrites
5. Click **Apply** and wait ~3 minutes. Your ERP is live!

---

### Option B: Deploying Frontend to Vercel & Backend to Railway/Render

#### 1. Backend Deployment (e.g. Render / Railway)
- **Repository directory**: `backend/`
- **Build Command**:
  ```bash
  pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
  ```
- **Start Command**:
  ```bash
  gunicorn erp_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
  ```
- **Environment Variables**:
  - `DEBUG`: `False`
  - `SECRET_KEY`: `<Generate a random secure 50+ character string>`
  - `DATABASE_URL`: `<Your PostgreSQL connection string>`
  - `FRONTEND_URL`: `https://your-frontend-app.vercel.app`

#### 2. Frontend Deployment (e.g. Vercel)
- **Repository directory**: `frontend/`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  - `VITE_API_URL`: `https://your-backend-app.onrender.com/api` (Point to your deployed backend)
- Ready-to-go [`vercel.json`](file:///c:/Users/ACER/.antigravity-ide/cse-erp/frontend/vercel.json) handles client-side routing rewrites automatically.

---

## 📱 PART 2: Mobile App Deployment

### Method 1: Instant PWA Installation (Zero Setup, Works on Android & iOS)

The app is fully configured as a **Progressive Web App (PWA)** with:
- Web App Manifest: [`public/manifest.json`](file:///c:/Users/ACER/.antigravity-ide/cse-erp/frontend/public/manifest.json)
- Service Worker & Cache: [`public/sw.js`](file:///c:/Users/ACER/.antigravity-ide/cse-erp/frontend/public/sw.js)
- Mobile viewport lock and adaptive dark/light status bars.

#### How Students & Faculty Install the App:
- **On Android (Chrome / Brave / Edge)**:
  1. Open your deployed ERP website URL.
  2. A banner or browser menu option will appear: **"Install CSE ERP"** or **"Add to Home screen"**.
  3. Tap **Install**. The app will appear on the Android home screen with the college logo and run in full-screen standalone mode without any browser URL bars.
- **On iOS (Safari)**:
  1. Open the ERP website in Safari.
  2. Tap the **Share** button (box with upward arrow).
  3. Scroll down and tap **"Add to Home Screen"**.
  4. Tap **Add**. The app opens full-screen like a native iOS app.

---

### Method 2: Native Android APK Build (via Capacitor)

A [`capacitor.config.ts`](file:///c:/Users/ACER/.antigravity-ide/cse-erp/frontend/capacitor.config.ts) file is pre-configured in the `frontend` folder:

#### Step 1: Install Capacitor in frontend
```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

#### Step 2: Initialize and Add Android Platform
```bash
npx cap init "CSE ERP" "edu.college.cseerp" --web-dir dist
npx cap add android
```

#### Step 3: Build & Sync
```bash
npm run build
npx cap sync android
```

#### Step 4: Open in Android Studio & Generate APK
```bash
npx cap open android
```
- In Android Studio:
  - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
  - The `.apk` file will be generated in `android/app/build/outputs/apk/debug/app-debug.apk`.
  - Share this APK with students and faculty for direct side-loading or publish it to the Google Play Store!

---

## 🔐 Credentials & Verification Summary

| Role | Username | Password | Notes |
|---|---|---|---|
| **Student (Rohit)** | `student_rohit` | `StudentPassword123!` | Year 3, Section A |
| **Faculty (Dr. Ananya)** | `faculty_ananya` | `FacultyPassword123!` | Approves/Disproves Student IDs, Edits Subjects & Marks |
| **Admin (Dr. Rajesh)** | `admin_user` | `AdminPassword123!` | Manages Accounts, View Audit Logs |

### Student Self-Registration Workflow:
1. Prospective student clicks **"Create Account / Register"** on the login page.
2. Submits Register Number, Full Name, Desired Username, and Password.
3. Request enters **PENDING** state.
4. Faculty logs in → navigates to **"Student Approvals"** tab.
5. Faculty can:
   - **Approve**: Automatically activates account and links or creates student profile.
   - **Disprove / Reject**: Rejects with custom feedback reason.
   - **Add New Student**: Manually pre-registers a student into CSE department anytime!
