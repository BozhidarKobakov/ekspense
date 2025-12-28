---
description: How to deploy the EKSPENSE application to the web using Vercel
---

# Deploying EKSPENSE to the Web

Follow these steps to make your application accessible through a public URL.

### 1. Initialize Git and Push to GitHub
If you haven't already, you need to put your code on GitHub.
// turbo
1. Initialize git: `git init`
2. Add all files: `git add .`
3. Commit: `git commit -m "Initial commit with Auth and Supabase"`
4. Create a new repository on [GitHub](https://github.com/new).
5. Follow the instructions on GitHub to "push an existing repository from the command line":
   - `git remote add origin https://github.com/YOUR_USERNAME/EKSPENSE.git`
   - `git branch -M main`
   - `git push -u origin main`

### 2. Connect to Vercel
1. Go to [Vercel.com](https://vercel.com) and Sign In (use your GitHub account).
2. Click **"Add New"** > **"Project"**.
3. Import your **EKSPENSE** repository.
4. In the **"Environment Variables"** dropdown, add:
   - `VITE_SUPABASE_URL`: (Your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
5. Click **Deploy**.

### 3. Continuous Deployment
Every time you push new code to GitHub, Vercel will automatically rebuild and update your website.
