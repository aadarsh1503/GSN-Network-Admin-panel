# AWS Settings - Troubleshooting Guide

## Issue: 403 Forbidden Error

### Problem
When accessing AWS Settings page, you get:
```
User role 'admin' is not authorized to access this route
POST http://localhost:5173/api/admin/aws-settings/test 403 (Forbidden)
```

### Root Causes

#### 1. **Wrong Port (5173 instead of 5000)**
The frontend is making requests to port 5173 instead of using the backend proxy to port 5000.

**Solution**: Use relative URLs in fetch requests (already fixed in AWSSettings.jsx)
```javascript
// ✅ CORRECT - Uses Vite proxy
fetch('/api/admin/aws-settings', { ... })

// ❌ WRONG - Bypasses proxy
fetch('http://localhost:5173/api/admin/aws-settings', { ... })
```

#### 2. **Authorization Middleware Issue**
The authorization middleware might have issues with role comparison.

**Solution**: Added detailed logging to track the issue:
- Check server console for authorization logs
- Look for role comparison details
- Verify user role in database

### Debugging Steps

#### Step 1: Check Server Logs
When you access the AWS Settings page, check your server console for:
```
🔐 [Authorization] Checking authorization...
   Required roles: [ 'admin' ]
   User: { id: X, role: 'admin', ... }
   User role: "admin"
   Is authorized: true/false
```

#### Step 2: Verify Admin User in Database
Run this SQL query:
```sql
SELECT id, name, email, role, status 
FROM users 
WHERE role = 'admin';
```

Check for:
- Role is exactly 'admin' (no extra spaces)
- Status is 1 (active)
- User exists

#### Step 3: Check Token
In browser console:
```javascript
// Check if token exists
console.log(localStorage.getItem('token'));

// Decode token (use jwt.io)
// Verify it has correct user ID and role
```

#### Step 4: Test API Directly
Use Postman or curl:
```bash
curl -X GET http://localhost:5000/api/admin/aws-settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Common Issues & Solutions

#### Issue: "Cannot find module 'dotenv'"
**Cause**: Running test scripts from wrong directory
**Solution**: Run from server directory or install dependencies

#### Issue: "Access denied for user"
**Cause**: Database credentials not loaded
**Solution**: Ensure server/.env file exists and is correct

#### Issue: "AWS settings not found"
**Cause**: Database table not created
**Solution**: Run `node setup_aws_settings.js`

#### Issue: "Token expired"
**Cause**: JWT token has expired
**Solution**: Log out and log in again

### Verification Checklist

- [ ] Backend server is running on port 5000
- [ ] Frontend dev server is running on port 5173
- [ ] Vite proxy is configured correctly
- [ ] Admin user exists in database with role='admin'
- [ ] JWT token is valid and not expired
- [ ] aws_settings table exists in database
- [ ] Authorization middleware is working

### Quick Fixes

#### Fix 1: Restart Both Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Fix 2: Clear Browser Cache
- Clear localStorage
- Hard refresh (Ctrl+Shift+R)
- Try incognito mode

#### Fix 3: Re-login
- Log out from admin panel
- Clear browser cache
- Log in again

### Expected Behavior

When everything works correctly:

1. **Frontend Request**:
   ```
   GET /api/admin/aws-settings
   Authorization: Bearer <token>
   ```

2. **Vite Proxy**:
   ```
   Proxies to: http://localhost:5000/api/admin/aws-settings
   ```

3. **Backend Logs**:
   ```
   🔐 [Authorization] Checking authorization...
      Required roles: [ 'admin' ]
      User role: "admin"
      Is authorized: true
   ✅ [Authorization] Access granted
   🔍 [AWS Settings] GET request received
   ✅ [AWS Settings] Settings retrieved successfully
   ```

4. **Response**:
   ```json
   {
     "id": 1,
     "access_key_id": "AKIAIOSFODNN7EXAMPLE",
     "secret_access_key": "••••••••••••••••",
     "region": "eu-north-1",
     "ses_from_email": "info@promo.gulfstarnetwork.com",
     "ses_from_name": "GSN Network"
   }
   ```

### Still Having Issues?

Check the detailed logs added to:
- `server/middleware/authMiddleware.js` - Authorization logs
- `server/controllers/awsSettingsController.js` - AWS Settings logs

The logs will show exactly where the issue is occurring.

### Contact Support

If the issue persists:
1. Check server console logs
2. Check browser console logs
3. Verify database connection
4. Ensure all dependencies are installed
5. Try creating a new admin user
