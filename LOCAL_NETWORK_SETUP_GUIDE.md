# 🌐 Local Network Server Setup Guide

This guide will help you share your project with others on the same local network (WiFi/LAN).

## ✅ What's Already Configured

I've updated your project to allow network access:
- ✅ Vite frontend configured to listen on `0.0.0.0` (all network interfaces)
- ✅ Backend server configured to accept connections from network
- ✅ Both servers will show network URLs when started

## 📋 Step-by-Step Setup

### Step 1: Find Your Local IP Address

**On Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet)
Example: `192.168.1.100`

**On Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```
Look for `inet` address (not 127.0.0.1)

### Step 2: Update Backend CORS Settings

Your backend needs to allow requests from network IPs. Check `server/index.js` CORS configuration:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://YOUR_LOCAL_IP:5173',  // Add your IP here
    'http://192.168.1.100:5173'   // Example
  ],
  credentials: true
}));
```

### Step 3: Update Frontend API URL (if needed)

Check `client/src/utils/api.js` - if it uses absolute URLs, update them:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://YOUR_LOCAL_IP:5000';
```

Or create a `.env` file in the `client` folder:
```
VITE_API_URL=http://192.168.1.100:5000
```

### Step 4: Configure Windows Firewall

**Allow Node.js through firewall:**

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Click "Change settings" → "Allow another app"
4. Browse to your Node.js installation (usually `C:\Program Files\nodejs\node.exe`)
5. Add it and check both "Private" and "Public" networks

**Or create firewall rules for specific ports:**

```powershell
# Run PowerShell as Administrator

# Allow port 5173 (Vite frontend)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Allow port 5000 (Backend API)
New-NetFirewallRule -DisplayName "Node Backend API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Step 5: Start Your Servers

**Terminal 1 - Start Backend:**
```cmd
cd server
npm start
```
You should see:
```
🚀 Server running on port 5000
📡 Network access: http://YOUR_LOCAL_IP:5000
💻 Local access: http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```cmd
cd client
npm run dev
```
Vite will show:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Step 6: Share the Link

Share the **Network URL** with others on the same WiFi/LAN:
```
http://YOUR_LOCAL_IP:5173
```

Example: `http://192.168.1.100:5173`

## 🔧 Troubleshooting

### Issue: Others can't access the site

**Check 1: Same Network**
- Ensure all devices are on the same WiFi/LAN network
- Can't work across different networks without port forwarding

**Check 2: Firewall**
```cmd
# Test if port is accessible
netstat -an | findstr :5173
netstat -an | findstr :5000
```

**Check 3: Ping Test**
From another PC:
```cmd
ping YOUR_LOCAL_IP
```

**Check 4: CORS Issues**
If you see CORS errors in browser console, update backend CORS settings to include the network IP.

### Issue: "Network: use --host to expose"

Already fixed! The `host: '0.0.0.0'` in vite.config.js handles this.

### Issue: API calls failing

Update the proxy target in `client/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://YOUR_LOCAL_IP:5000',  // Use your actual IP
    changeOrigin: true,
  }
}
```

## 🌍 Alternative: Using ngrok (Internet Access)

If you want to share over the internet (not just local network):

1. Install ngrok: https://ngrok.com/download
2. Start your servers normally
3. Run ngrok:
```cmd
ngrok http 5173
```
4. Share the ngrok URL (e.g., `https://abc123.ngrok.io`)

**Note:** You'll need to update CORS and API URLs to use the ngrok URL.

## 📱 Mobile Testing

To test on mobile devices on the same WiFi:
1. Find your PC's IP address
2. Open mobile browser
3. Navigate to `http://YOUR_LOCAL_IP:5173`

## 🔒 Security Notes

- This setup is for **development/testing only**
- Don't expose your development server to the public internet
- Use proper production deployment for real users
- Keep your `.env` file secure (never commit it)

## 🚀 Quick Start Commands

```cmd
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client
npm run dev

# Share this URL with others on your network:
# http://YOUR_LOCAL_IP:5173
```

## 📝 Example Configuration

If your IP is `192.168.1.100`:

**Frontend URL:** `http://192.168.1.100:5173`
**Backend URL:** `http://192.168.1.100:5000`

Others on your network can access the frontend URL in their browsers!

---

**Need Help?**
- Check firewall settings
- Verify same network
- Check console for errors
- Ensure both servers are running
