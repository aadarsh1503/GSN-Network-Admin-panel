# 🌍 Share Your Project Over Internet - SIMPLE GUIDE

## The Problem
Your users are **not on the same WiFi** as you, so they can't access `http://192.168.x.x:5173`

## The Solution
Use **ngrok** to create a public internet URL that anyone can access!

---

## 🚀 Super Simple Setup (3 Steps)

### Step 1: Install ngrok (One Time Only)

1. Go to: **https://ngrok.com/download**
2. Download ngrok for Windows
3. Extract `ngrok.exe` to your project folder (same folder as this file)
4. Sign up at: **https://dashboard.ngrok.com/signup**
5. Copy your authtoken from: **https://dashboard.ngrok.com/get-started/your-authtoken**
6. Open CMD in this folder and run:
   ```cmd
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### Step 2: Start Everything

**Option A: Automatic (Easy)**
- Double-click: `start_with_ngrok.bat`
- Wait for 3 windows to open

**Option B: Manual**
```cmd
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev

# Terminal 3
ngrok http 5173
```

### Step 3: Share the Link

In the ngrok window, you'll see:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5173
```

**Copy that URL** (e.g., `https://abc123.ngrok-free.app`) and share it with anyone!

---

## ✅ That's It!

Anyone with that link can access your project from anywhere in the world!

---

## 📝 Important Notes

- ✅ Works from anywhere (not just same WiFi)
- ✅ Free to use
- ⚠️ URL changes every time you restart ngrok
- ⚠️ Free plan shows ngrok banner (users click "Visit Site")
- ⚠️ Keep all 3 terminals open while sharing
- ⚠️ Your computer must stay on

---

## 🔄 Every Time You Want to Share

1. Run `start_with_ngrok.bat` (or start servers manually)
2. Copy the new ngrok URL from the terminal
3. Share the URL
4. Keep terminals open

---

## 💰 Want a Permanent URL?

Free ngrok URLs change every restart. For a fixed URL:
- Upgrade to ngrok paid plan ($8/month)
- Get a custom domain like `yourproject.ngrok.app`

---

## 🆘 Troubleshooting

### "ngrok not found"
- Make sure `ngrok.exe` is in your project folder
- Or add ngrok to your system PATH

### "Failed to start tunnel"
- Did you add your authtoken? Run: `ngrok config add-authtoken YOUR_TOKEN`
- Check if port 5173 is already in use

### "API calls not working"
- Make sure backend server is running (Terminal 1)
- Check if you see "Server running on port 5000"

### "ngrok banner appears"
- This is normal on free plan
- Users just click "Visit Site" to continue

---

## 🎯 Quick Reference

**Install ngrok:** https://ngrok.com/download
**Get authtoken:** https://dashboard.ngrok.com/get-started/your-authtoken
**Start servers:** Double-click `start_with_ngrok.bat`
**Share:** Copy the `https://xxx.ngrok-free.app` URL

---

## 🌟 Example

You run:
```cmd
ngrok http 5173
```

You get:
```
https://abc123.ngrok-free.app
```

You share that URL with your friend in another city, and they can access your project!

---

**Ready to share?**
1. Install ngrok (one time)
2. Run `start_with_ngrok.bat`
3. Copy and share the ngrok URL!
