# 🌍 Share Your Project Over Internet (Using ngrok)

Since your users are **not on the same WiFi**, you need to expose your local server to the internet using **ngrok**.

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install ngrok

**Option A: Download**
1. Go to https://ngrok.com/download
2. Download ngrok for Windows
3. Extract the `ngrok.exe` file to your project folder

**Option B: Using Chocolatey (if you have it)**
```cmd
choco install ngrok
```

### Step 2: Sign Up (Free)
1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

### Step 3: Configure ngrok
```cmd
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start Your Servers

**Terminal 1 - Backend:**
```cmd
cd server
npm start
```

**Terminal 2 - Frontend:**
```cmd
cd client
npm run dev
```

### Step 5: Start ngrok

**Terminal 3 - Expose Frontend:**
```cmd
ngrok http 5173
```

You'll see something like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:5173
```

**Copy that URL** (e.g., `https://abc123.ngrok-free.app`) and share it!

## ⚠️ Important: Update Backend URL

Since ngrok only exposes the frontend, you need to update the API URL:

### Option 1: Use ngrok for Backend Too (Recommended)

**Terminal 4 - Expose Backend:**
```cmd
ngrok http 5000
```

You'll get another URL like: `https://xyz789.ngrok-free.app`

**Update `client/src/utils/api.js`:**
```javascript
const API_BASE_URL = 'https://xyz789.ngrok-free.app'; // Your ngrok backend URL
```

### Option 2: Use Your Public IP (if you have one)

If you have a static public IP and can configure port forwarding on your router, you can use that instead.

## 📋 Complete Setup Example

**Terminal 1:**
```cmd
cd server
npm start
```

**Terminal 2:**
```cmd
cd client
npm run dev
```

**Terminal 3:**
```cmd
ngrok http 5173
```
Output: `https://abc123.ngrok-free.app` ← Share this!

**Terminal 4:**
```cmd
ngrok http 5000
```
Output: `https://xyz789.ngrok-free.app` ← Use this in api.js

**Update `client/src/utils/api.js`:**
```javascript
const API_BASE_URL = 'https://xyz789.ngrok-free.app';
```

**Restart frontend** (Ctrl+C and `npm run dev` again)

Now share: `https://abc123.ngrok-free.app`

## 🎯 Alternative: Use One ngrok Tunnel

You can use just one ngrok tunnel for the frontend, and the Vite proxy will handle the backend:

**Terminal 3:**
```cmd
ngrok http 5173
```

Share the ngrok URL: `https://abc123.ngrok-free.app`

The Vite proxy will forward `/api` requests to your local backend automatically!

## 💡 Pro Tips

### Keep URLs Stable
Free ngrok URLs change every time you restart. To get a fixed URL:
- Upgrade to ngrok paid plan ($8/month)
- Or use the same session (don't close ngrok)

### Multiple Tunnels at Once
Create `ngrok.yml` config:
```yaml
tunnels:
  frontend:
    proto: http
    addr: 5173
  backend:
    proto: http
    addr: 5000
```

Then run:
```cmd
ngrok start --all
```

### Check Active Tunnels
Open in browser: http://localhost:4040

## 🔒 Security Notes

- ⚠️ Your local server is now accessible to anyone with the link
- ⚠️ Don't share sensitive data or credentials
- ⚠️ This is for testing/demo only, not production
- ⚠️ Free ngrok has rate limits
- ⚠️ ngrok URLs expire when you close the terminal

## 🆓 Free Plan Limits

- ✅ 1 online ngrok process
- ✅ 4 tunnels per process
- ✅ 40 connections/minute
- ⚠️ Random URLs (changes on restart)
- ⚠️ ngrok banner on free URLs

## 🚀 Quick Start Commands

```cmd
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev

# Terminal 3
ngrok http 5173

# Share the ngrok URL that appears!
```

## 🎓 What's Happening?

```
Internet User
    ↓
https://abc123.ngrok-free.app (ngrok cloud)
    ↓
Your Computer (localhost:5173)
    ↓
Vite Proxy forwards /api to localhost:5000
    ↓
Your Backend Server
```

## 🔧 Troubleshooting

### "ngrok not found"
- Make sure ngrok.exe is in your PATH or current folder
- Try running `./ngrok` instead of `ngrok`

### "Failed to start tunnel"
- Check if you added your authtoken
- Make sure ports 5173 and 5000 are not blocked

### "API calls failing"
- Check if backend is running
- Verify API_BASE_URL in api.js
- Check browser console for CORS errors

### "ngrok banner appears"
- This is normal on free plan
- Users can click "Visit Site" to continue
- Upgrade to paid plan to remove it

## 🌟 Best Solution for Your Case

Since you want to share with people not on your WiFi:

1. **Start both servers** (backend + frontend)
2. **Run ngrok on frontend**: `ngrok http 5173`
3. **Share the ngrok URL**: `https://abc123.ngrok-free.app`
4. **Vite proxy handles the rest** (forwards API calls to local backend)

This is the simplest setup and works perfectly for demos and testing!

---

**Ready to share?**
1. Install ngrok
2. Run: `ngrok http 5173`
3. Share the URL that appears!
