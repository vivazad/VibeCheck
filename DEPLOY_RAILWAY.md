# Deploying to Railway (Alternative to Render)

Railway is an excellent alternative that is often easier to set up.

## Prerequisites
1.  GitHub Account (already connected)
2.  Code pushed to GitHub (already done)

## Step 1: Sign up
1.  Go to [Railway.app](https://railway.app/).
2.  Login with **GitHub**.
3.  Must verify account (sometimes requires a small credit card hold or GitHub age check).

## Step 2: Deploy Backend
1.  Click **New Project** -> **Deploy from GitHub repo**.
2.  Select `VibeCheck`.
3.  Click **Add Variables** (Environment Variables).
4.  Add the same variables:
    *   `MONGODB_URI`: (Your connection string)
    *   `JWT_SECRET`: (Random string)
    *   `HMAC_SECRET`: (Random string)
    *   `NODE_ENV`: `production`
    *   `PORT`: `3000` (Railway automatically listens on this port if exposed)
    *   `CORS_ORIGIN`: `*` (Update later)
5.  **Critical Configuration**:
    *   Railway needs to know where the backend code is.
    *   Click **Settings** (for the service) -> **Root Directory**.
    *   Set it to `/backend`.
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
6.  Click **Deploy**.

## Step 3: Deploy Frontend (Vercel)
*You should stick with Vercel for the frontend as it's the best for React/Vite.*

1.  If you already deployed to Vercel, just update the `VITE_API_URL`.
2.  Go to Vercel -> Project Settings -> Environment Variables.
3.  Update `VITE_API_URL` to your new **Railway App URL** (e.g., `https://vibecheck-production.up.railway.app`).
4.  Redeploy Vercel.

## Important Note on Uploads ⚠️
Your current code saves uploads to the **local filesystem** (disk).
*   **Railway (and Render/Heroku)**: The disk is ephemeral. This means every time you deploy or the app restarts, **all uploaded images will be deleted**.
*   **Solution**: To keep images permanently, you need to use an external storage service like **Cloudinary (Free Tier)** or **AWS S3**.
*   *For now, uploads will work temporarily but vanish on restart.*

