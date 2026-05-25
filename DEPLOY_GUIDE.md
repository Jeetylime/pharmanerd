# PharmaNerd Deployment Guide

Here's how to get your site live on the **internet for free** in about 10 minutes. Your Node.js server runs on Render.com (free) and serves everything — the website and the API.

**Final result:** You'll visit `https://pharmanerd.onrender.com` and see your site live.

---

## Step 1: Push Your Code to GitHub (using GitHub Desktop)

### 1a. Open GitHub Desktop
If you don't have it installed:
1. Go to https://desktop.github.com
2. Download and install it
3. Open it and sign in with your GitHub account (create one at https://github.com if you don't have one)

### 1b. Create a New Repository on GitHub.com
1. Open your browser and go to https://github.com
2. Click the **+** icon (top right) → **New repository**
3. Fill in:
   - **Repository name:** `pharmanerd`
   - **Description:** (leave blank)
   - **Public** (selected)
   - **DO NOT** check "Add a README" or ".gitignore" — leave everything unchecked
4. Click **Create repository**

### 1c. Push Your Code from GitHub Desktop
1. In GitHub Desktop, click **File** → **Add local repository**
2. Click **Choose...** and navigate to: `Macintosh HD → Users → jettflynn → Documents → drug website → pharmanerd`
3. Click **Select Folder**
4. You'll see a pop-up saying "This directory doesn't appear to be a Git repository." Click **"Create a repository"**
5. On the next screen:
   - **Name:** `pharmanerd` (auto-filled)
   - **Description:** (leave blank)
   - **Local path:** should be the pharmanerd folder
   - Click **Create repository**
6. Now you'll see a list of all your files. At the bottom-left:
   - **Summary:** type `Initial commit`
   - Click **Commit to main**
7. Click **Publish repository** (the button at the top)
8. In the pop-up:
   - Make sure **"Keep this code private"** is **UNCHECKED** (you want it public)
   - Click **Publish repository**

**Done!** Your code is now on GitHub. You can verify by going to `https://github.com/YOUR_USERNAME/pharmanerd` in your browser.

---

## Step 2: Deploy on Render.com

### 2a. Create a Render Account
1. Go to https://render.com
2. Click **Get Started**
3. Click **Continue with GitHub** — this is the easiest way
4. Authorize Render to access your GitHub account (it will redirect you back)

### 2b. Create a Web Service
1. On your Render dashboard, click the **New +** button
2. Click **Web Service**
3. Click **Connect a repository**
4. Find and click **Connect** next to `pharmanerd`
5. Now fill out this form exactly:

| Setting | What to put |
|---------|-------------|
| **Name** | `pharmanerd` (auto-fills) |
| **Region** | Pick the one closest to you (e.g., `US East (Ohio)`) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | Leave blank |
| **Start Command** | `node server.js` |
| **Plan** | Select **Free** |

6. Click **Create Web Service**

### 2c. Wait for Deployment
- Render will take about 2-3 minutes
- You'll see a log screen streaming text
- Wait until you see: `PharmaNerd server running`
- When it's done, your site URL will be: `https://pharmanerd.onrender.com`

**🎉 That's it!** Click that URL — your site is live on the internet!

---

## Step 3: You're Done

Visit `https://pharmanerd.onrender.com` in your browser. Everything works:

- ✅ Browse drugs
- ✅ Search/filter drugs
- ✅ Compare drugs
- ✅ Drug interactions page
- ✅ Receptors, Classes, History
- ✅ Settings (saves in your browser)
- ✅ Drug search via openFDA
- ✅ RxNorm interaction lookups

The API features work because your Node.js server is running on Render.com and can make requests to openFDA and RxNorm (which a static GitHub Pages site cannot do).

---

## Troubleshooting

### Blank page or 404
- Wait 2-3 minutes after deploying
- Check Render dashboard → your service should say **Live**
- Click **Manual Deploy** → **Deploy latest commit** if needed

### "Failed to load data" in console
- Open Render dashboard → click your service → **Logs** tab
- Look for any error messages
- Common issue: make sure Start Command is exactly `node server.js`

### Site loads but API features don't work
- openFDA and RxNorm are external APIs — Render has internet access so they should work
- Check Render logs for any connection errors

### Making changes to your site
1. Edit your files in VS Code
2. Open GitHub Desktop — it will show your changed files
3. Bottom-left: type a summary (e.g., "Fixed search bug"), click **Commit to main**
4. Click **Push origin** (top bar)
5. Render will automatically redeploy in 1-2 minutes

### Site is slow on first visit
- Render's free tier "goes to sleep" after 15 minutes of inactivity
- First visit after sleep takes ~15 seconds to wake up
- This is normal — subsequent clicks will be fast
- To prevent sleeping: create a free account at https://cron-job.org and set it to ping `https://pharmanerd.onrender.com` every 10 minutes

---

## Cost Breakdown

| What | Cost |
|------|------|
| GitHub | Free |
| Render.com | Free (512 MB RAM, 1 CPU) |
| **Total** | **$0** |

---

## Quick Reference

| What | Where |
|------|-------|
| Your code (on your computer) | `~/Documents/drug website/pharmanerd/` |
| GitHub repo (online) | `https://github.com/YOUR_USERNAME/pharmanerd` |
| Render dashboard | `https://dashboard.render.com` |
| Your live site | `https://pharmanerd.onrender.com` |

---

## What's Happening Behind the Scenes

```
Your browser ──► pharmanerd.onrender.com ──► Node.js server on Render
                                                    │
                                           ┌────────┴────────┐
                                           ▼                 ▼
                                    HTML, CSS, JS     External APIs
                                    (web pages)       (openFDA, RxNorm)
```

Your Node.js server does **everything** — serves the website files and proxies API calls. Since it runs on Render.com (not just GitHub Pages), it can make requests to external APIs that your browser can't directly access.