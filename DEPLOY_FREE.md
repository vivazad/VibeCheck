# Free Deployment Guide (MERN Stack)

This guide helps you deploy VibeCheck for **free** using 3 services:
1.  **MongoDB Atlas** (Database)
2.  **Render** (Backend API)
3.  **Vercel** (Frontend)

---

## Part 1: Database (MongoDB Atlas)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up.
2.  Create a new project.
3.  **Create a Cluster**:
    -   Select **M0 Sandbox** (Free Tier).
    -   Choose a provider (AWS) and region close to you.
    -   Click **Create Deployment**.
4.  **Security Setup**:
    -   Create a database user (username/password). **Save these!**
    -   Under "Network Access", add IP Address `0.0.0.0/0` (Allow access from anywhere - required for Render).
5.  **Get Connection String**:
    -   Click **Connect** -> **Drivers**.
    -   Copy the connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).

---

## Part 2: Backend (Render)

Render offers a free tier for Node.js web services.

1.  Push your code to **GitHub** (if you haven't already).
2.  Sign up at [Render.com](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configuration**:
    -   **Root Directory**: `backend`
    -   **Runtime**: Node
    -   **Build Command**: `npm install && npm run build` (or `npm install && tsc` if using basic typescript)
        -   *Note: Since we are in a monorepo, you might need to run `npm install` in the root first, or just `cd backend && npm install && npm run build` if the backend is self-contained.*
        -   **Better Command for simple setup**: `npm install && npm run build` inside the backend folder context.
    -   **Start Command**: `npm start`
    -   **Instance Type**: Free
6.  **Environment Variables** (Advanced):
    -   Add `MONGO_USERNAME`: (your db username)
    -   Add `MONGO_PASSWORD`: (your db password)
    -   Add `MONGODB_URI`: (your full connection string from Part 1, replace `<password>` with actual password)
    -   Add `JWT_SECRET`: (generate a random string)
    -   Add `HMAC_SECRET`: (generate a random string)
    -   Add `CORS_ORIGIN`: `*` (initially, to test) or your Vercel URL later.
    -   Add `NODE_ENV`: `production`
7.  Click **Create Web Service**.
    -   *Note: Free tier spins down after inactivity. The first request will take ~50 seconds to wake it up.*

---

## Part 3: Frontend (Vercel)

Vercel is the best place to host the React/Vite frontend.

1.  Sign up at [Vercel.com](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Project Configuration**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    -   `VITE_API_URL`: The URL of your Render backend (e.g., `https://vibecheck-backend.onrender.com/api/v1`).
        -   *Important: Do not add a trailing slash.*
6.  Click **Deploy**.

---

## Part 4: Final Connection

1.  Once Vercel finishes, you will get a domain (e.g., `vibecheck.vercel.app`).
2.  Go back to **Render** -> Dashboard -> Environment Variables.
3.  Update `CORS_ORIGIN` to your Vercel domain (e.g., `https://vibecheck.vercel.app`).
    -   *Remove trailing slash.*
4.  Redeploy Render (Metrics -> Manual Deploy -> Deploy latest commit) to apply changes.

---

## Verification

1.  Open your Vercel URL.
2.  The app should load.
3.  Try to log in.
    -   *Note: If the backend is "sleeping", the login might timeout the first time. Wait 1 minute and try again.*
