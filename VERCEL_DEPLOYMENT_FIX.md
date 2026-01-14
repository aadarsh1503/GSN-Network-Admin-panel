# 🚀 Vercel Deployment Fix

## ❌ Error You're Getting:
```
Failed to load module script: Expected a JavaScript module script 
but the server responded with a MIME type of "text/html"
```

## ✅ Solution:

### Step 1: Update vercel.json (Already Done)
I've updated `client/vercel.json` with proper configuration.

### Step 2: Vercel Deployment Settings

When deploying on Vercel, use these settings:

**Framework Preset:** Other (or leave blank)
**Build Command:** `npm run build`
**Output Directory:** `build`
**Install Command:** `npm install`
**Root Directory:** `client`

### Step 3: Environment Variables (Important!)

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-url.com
```

Replace `your-backend-url.com` with your actual backend URL.

### Step 4: Deploy

**Option A: Via Vercel Dashboard**
1. Go to Vercel Dashboard
2. Import your GitHub repository
3. Set Root Directory to `client`
4. Use settings from Step 2
5. Deploy

**Option B: Via Vercel CLI**
```bash
cd client
vercel --prod
```

### Step 5: After Deployment

If you still see the error:
1. Go to Vercel Dashboard
2. Go to your project → Settings → General
3. Scroll to "Build & Development Settings"
4. Make sure:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
5. Redeploy

## 🔧 Alternative: Use Standard Vite

Your package.json uses `rolldown-vite` which might cause issues. To use standard Vite:

**Update `client/package.json`:**

Remove these lines:
```json
"vite": "npm:rolldown-vite@7.1.14"
```

```json
"overrides": {
  "vite": "npm:rolldown-vite@7.1.14"
}
```

Add standard Vite:
```json
"vite": "^6.0.0"
```

Then:
```bash
cd client
npm install
npm run build
```

## 📋 Checklist:

- ✅ vercel.json updated (done)
- ⬜ Root directory set to `client` in Vercel
- ⬜ Build command: `npm run build`
- ⬜ Output directory: `build`
- ⬜ Environment variables added
- ⬜ Redeploy

## 🎯 Quick Fix Commands:

```bash
# In client folder
cd client

# Clean install
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build

# If build succeeds, deploy
vercel --prod
```

## 🔍 Debug:

If still not working, check:
1. Build logs in Vercel dashboard
2. Make sure `build` folder is created after build
3. Check if `build/index.html` exists
4. Verify all assets are in `build/assets/`

## 💡 Common Issues:

**Issue 1: 404 on routes**
- Fixed by rewrites in vercel.json ✅

**Issue 2: MIME type error**
- Fixed by headers in vercel.json ✅

**Issue 3: Assets not loading**
- Check if base path is correct in vite.config.js
- Should be: `base: '/'` (default)

---

**After following these steps, your deployment should work!** 🎉
