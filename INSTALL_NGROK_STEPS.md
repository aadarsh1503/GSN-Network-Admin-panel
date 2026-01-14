# 📥 Install ngrok - Step by Step

## The Error You Got
```
ngrok : The term 'ngrok' is not recognized
```

This means **ngrok is not installed yet**. Let's fix that!

---

## 🚀 Installation Steps (5 Minutes)

### Step 1: Download ngrok

1. Go to: **https://ngrok.com/download**
2. Click **"Download for Windows"**
3. You'll get a file called `ngrok-v3-stable-windows-amd64.zip`
4. **Extract the ZIP file** (right-click → Extract All)
5. You'll get a file called **`ngrok.exe`**

### Step 2: Copy ngrok.exe to Your Project

Copy `ngrok.exe` to your project folder:
```
D:\GSN NETWORK\ngrok.exe
```

**Important:** Put it in the main folder (where you see `client` and `server` folders)

### Step 3: Sign Up for ngrok (Free)

1. Go to: **https://dashboard.ngrok.com/signup**
2. Sign up with your email (it's FREE)
3. Verify your email

### Step 4: Get Your Authtoken

1. After signing up, go to: **https://dashboard.ngrok.com/get-started/your-authtoken**
2. You'll see something like: `2abc123def456ghi789jkl0`
3. **Copy that token**

### Step 5: Configure ngrok

Open PowerShell in your project folder (`D:\GSN NETWORK`) and run:

```powershell
.\ngrok config add-authtoken YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the token you copied.

Example:
```powershell
.\ngrok config add-authtoken 2abc123def456ghi789jkl0
```

### Step 6: Test ngrok

Still in PowerShell, run:
```powershell
.\ngrok http 5173
```

You should see:
```
ngrok

Session Status                online
Account                       your@email.com
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5173
```

**Success!** Press `Ctrl+C` to stop it.

---

## 🎯 Quick Installation (Automatic)

**Option 1:** Double-click `install_ngrok.bat` and follow the prompts

**Option 2:** Follow the manual steps above

---

## ✅ After Installation

Once ngrok is installed, you can:

**Start everything automatically:**
```cmd
start_with_ngrok.bat
```

**Or manually:**
```powershell
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev

# Terminal 3
.\ngrok http 5173
```

---

## 🔍 Verify Installation

Check if ngrok.exe is in your folder:
```powershell
dir ngrok.exe
```

You should see:
```
ngrok.exe
```

---

## 📁 Folder Structure After Installation

```
D:\GSN NETWORK\
├── ngrok.exe          ← Put it here!
├── client\
├── server\
├── install_ngrok.bat
└── start_with_ngrok.bat
```

---

## 🆘 Troubleshooting

### "ngrok not recognized"
- Make sure `ngrok.exe` is in `D:\GSN NETWORK\`
- Use `.\ngrok` instead of `ngrok` in PowerShell
- Or add ngrok to your PATH

### "Failed to start tunnel"
- Did you add your authtoken?
- Run: `.\ngrok config add-authtoken YOUR_TOKEN`

### "Can't download ngrok"
- Direct download link: https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip

---

## 🎓 What is ngrok?

ngrok creates a secure tunnel from the internet to your local computer:

```
Internet (https://abc123.ngrok-free.app)
    ↓
ngrok Cloud
    ↓
Your Computer (localhost:5173)
```

This lets anyone access your local project from anywhere!

---

## 💰 Is it Free?

Yes! The free plan includes:
- ✅ Public URLs
- ✅ HTTPS
- ✅ 40 connections/minute
- ⚠️ URLs change on restart
- ⚠️ Shows ngrok banner

---

## 🚀 Next Steps

After installing ngrok:

1. **Start your servers:**
   ```cmd
   cd server && npm start
   cd client && npm run dev
   ```

2. **Start ngrok:**
   ```powershell
   .\ngrok http 5173
   ```

3. **Share the URL** that appears!

---

**Ready to install?**
1. Download ngrok from https://ngrok.com/download
2. Extract and copy `ngrok.exe` to `D:\GSN NETWORK\`
3. Sign up at https://dashboard.ngrok.com/signup
4. Get your token and run: `.\ngrok config add-authtoken YOUR_TOKEN`
5. Test: `.\ngrok http 5173`
