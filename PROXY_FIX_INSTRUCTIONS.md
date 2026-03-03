# Fix: Vite Proxy Not Working (Port 5173 instead of 5000)

## The Problem
Your frontend is making requests to `http://localhost:5173/api/...` instead of proxying to `http://localhost:5000/api/...`

## Root Cause
The Vite dev server needs to be restarted after proxy configuration changes, OR the proxy isn't working due to rolldown-vite.

## Solution Steps

### Step 1: Stop Both Servers
```bash
# Press Ctrl+C in both terminal windows
# Stop backend server (port 5000)
# Stop frontend server (port 5173)
```

### Step 2: Start Backend Server First
```bash
cd server
npm run dev
```

Wait until you see:
```
✅ Server running on port 5000
✅ Database connected
```

### Step 3: Start Frontend Server
```bash
cd client
npm run dev
```

Wait until you see:
```
VITE v... ready in ...ms
➜  Local:   http://localhost:5173/
```

### Step 4: Test the Proxy
Open browser console and run:
```javascript
fetch('/api/admin/aws-settings', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log).catch(console.error)
```

**Expected**: Request goes to `http://localhost:5000/api/admin/aws-settings`
**Current Issue**: Request goes to `http://localhost:5173/api/admin/aws-settings`

## Alternative Solution: Use Environment Variable

If the proxy still doesn't work, add this to `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Then update `client/src/pages/Admin/AWSSettings.jsx`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || '';

// In fetchAWSSettings:
const response = await fetch(`${API_URL}/api/admin/aws-settings`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
```

## Quick Test: Is Backend Running?

Open a new terminal and run:
```bash
curl http://localhost:5000/api/admin/aws-settings
```

**Expected Response**: 
```json
{"message":"Not authorized, no token provided."}
```

If you get "Connection refused", the backend is not running.

## Verify Proxy Configuration

Check if Vite is actually using the proxy:

1. Open browser DevTools
2. Go to Network tab
3. Try to access AWS Settings page
4. Look at the request URL

**Should be**: `http://localhost:5173/api/admin/aws-settings` (but proxied to 5000)
**Currently showing**: `http://localhost:5173/api/admin/aws-settings` (NOT proxied)

## Debug: Check Vite Console

When you start the frontend, you should see proxy logs if there are errors:
```
Proxy error: connect ECONNREFUSED 127.0.0.1:5000
```

If you see this, the backend is not running.

## Final Solution: Force Proxy to Work

Update `client/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'build',
    sourcemap: true,
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('🔄 Proxying:', path);
          return path;
        },
      },
    },
  },
});
```

## Check: Is Port 5000 in Use?

```bash
# Windows
netstat -ano | findstr :5000

# Should show something like:
# TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345
```

If nothing shows, backend is not running.

## Nuclear Option: Clear Everything

```bash
# Stop all servers
# Delete node_modules in both client and server
cd client
rm -rf node_modules
npm install
cd ../server
rm -rf node_modules
npm install

# Start backend
cd server
npm run dev

# Start frontend (in new terminal)
cd client
npm run dev
```

## After Restart: Test Again

1. Go to: http://localhost:5173/admin/aws-settings
2. Open DevTools > Network tab
3. Look for the request to `/api/admin/aws-settings`
4. Check the "General" section - it should show:
   - Request URL: `http://localhost:5173/api/admin/aws-settings`
   - But actually proxied to: `http://localhost:5000/api/admin/aws-settings`

## Still Not Working?

Check your backend server console for these logs:
```
🔐 [Authorization] Checking authorization...
   Required roles: [ 'admin' ]
   User role: "admin"
```

If you don't see these logs, the request is NOT reaching the backend.
