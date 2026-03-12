# 2FA Quick Setup & Management Guide

## 🎯 Complete 2FA Enablement Guide

### Method 1: Enable 2FA via Web Interface (Recommended)

#### Step 1: Access Settings
```
1. Open: http://localhost:5173/settings
2. Click: "Security" tab
3. Look for: "Two-Factor Authentication" section
```

#### Step 2: Two Possible States

**A) If you see "Enable 2FA" button:**
```
✅ Great! 2FA is not enabled yet.
→ Click "Enable 2FA"
→ QR Code will appear
→ Continue to Step 3
```

**B) If you see "2FA is currently ENABLED":**
```
⚠️ 2FA is already active but you might not have the app
→ You need to either:
   1. Use your existing authenticator app, OR
   2. Reset 2FA (see Method 2 below)
```

#### Step 3: Scan QR Code (For Fresh Enable)
```
1. Download Google Authenticator on your phone:
   - iOS: App Store → "Google Authenticator"
   - Android: Play Store → "Google Authenticator"

2. Open the app → Tap "+" → "Scan QR code"

3. Point camera at the QR code on your screen

4. App will add "Finsight (your@email.com)"

5. You'll see a 6-digit code that changes every 30 seconds
```

#### Step 4: Verify and Activate
```
1. Look at your phone's authenticator app
2. Find the 6-digit code under "Finsight"
3. Type that code in the verification field
4. Click "Verify and Activate"
5. ✅ Done! 2FA is now enabled
```

---

### Method 2: Reset 2FA (If Lost Access)

If 2FA is already enabled but you don't have the authenticator app:

#### Using the Reset Script:
```bash
# Navigate to backend folder
cd backend

# Reset 2FA for a specific user
node reset_2fa.js your@email.com

# Or for the default admin:
node reset_2fa.js admin@finsight.com
```

**Output:**
```
🔄 Resetting 2FA for: admin@finsight.com

Connected to database...
Found user: Admin User (admin@finsight.com)
Current 2FA status: ENABLED

✅ 2FA has been RESET for this user
You can now enable 2FA again from Settings > Security
```

#### After Reset:
1. Refresh the Settings page
2. You'll see "Enable 2FA" button again
3. Follow Method 1 to set up fresh

---

### Method 3: Get Current Code (Development Only)

**If you already have 2FA enabled and need a code for testing:**

```bash
cd backend
node get_2fa_code.js admin@finsight.com
```

**Output:**
```
🔐 Generating 2FA code for: admin@finsight.com

✅ Current 2FA code for Admin User:

   ┌─────────┐
   │ 482615 │
   └─────────┘

⏱️  This code is valid for ~30 seconds

⏳ Next code in: 22 seconds
```

**Use Case:** Testing without a phone during development

---

## 📱 Authenticator App Recommendations

### Google Authenticator (Most Popular)
- **Pros**: Simple, reliable, no account needed
- **Cons**: No cloud backup (lose phone = lose codes)
- **Download**: Free on iOS/Android

### Authy (Best for Backup)
- **Pros**: Cloud backup, multi-device support
- **Cons**: Requires phone number
- **Download**: Free on iOS/Android/Desktop

### Microsoft Authenticator
- **Pros**: Works with Microsoft accounts too
- **Cons**: UI can be confusing
- **Download**: Free on iOS/Android

---

## 🔧 Troubleshooting

### Problem 1: "Invalid 2FA Code"
**Causes:**
- Code expired (they change every 30 seconds)
- Phone clock is out of sync
- Typed wrong number

**Solution:**
- Wait for next code to appear (30 sec)
- Make sure phone's time is set to "Automatic"
- Double-check you're looking at "Finsight" not another app

### Problem 2: "2FA Already Enabled" but I Don't Have the App
**Solution:**
```bash
# Reset 2FA first
node reset_2fa.js your@email.com

# Then enable fresh
# Go to Settings > Security > Enable 2FA
```

### Problem 3: Lost Phone with Authenticator
**Solution:**
```bash
# Use the reset script
cd backend
node reset_2fa.js your@email.com
```

### Problem 4: Can't Scan QR Code
**Solution:**
- QR code not showing? Check browser console for errors
- Camera not working? Use manual entry:
  1. In authenticator app, choose "Enter setup key"
  2. Enter the text secret shown below QR code
  3. Example: `JBSWY3DPEHPK3PXP`

---

## 🔐 Security Best Practices

### DO:
✅ Enable 2FA on all important accounts  
✅ Use a reputable authenticator app  
✅ Keep backup codes in a safe place  
✅ Use 2FA for admin accounts  

### DON'T:
❌ Share 2FA codes with anyone  
❌ Use SMS-based 2FA (less secure)  
❌ Take screenshots of QR codes (security risk)  
❌ Use the same 2FA across multiple apps without backup  

---

## 📊 2FA Workflow Diagram

```
User Opens Settings
        ↓
   Security Tab
        ↓
    ┌─────────────┐
    │  2FA State? │
    └─────────────┘
         ↓    ↓
    ENABLED  DISABLED
         ↓         ↓
    [Disable]  [Enable]
         ↓         ↓
    Need Code   Show QR
         ↓         ↓
    From App   Scan QR
         ↓         ↓
    Enter Code  Setup App
         ↓         ↓
    Disabled   Enter Code
                   ↓
                Enabled
```

---

## 🚀 Quick Commands Reference

```bash
# Check if 2FA is enabled for a user
cd backend
node -e "require('./models/User').findOne({where:{email:'admin@finsight.com'}}).then(u=>console.log('2FA:',u.twoFactorEnabled))"

# Reset 2FA
node reset_2fa.js admin@finsight.com

# Get current code (if 2FA enabled)
node get_2fa_code.js admin@finsight.com

# Reset for different user
node reset_2fa.js john@company.com
```

---

## 💡 Pro Tips

1. **Setup Backup**: Enable 2FA on both Authy and Google Authenticator for redundancy

2. **Development**: Use `get_2fa_code.js` script instead of your phone while testing

3. **Team Setup**: Each team member should enable their own 2FA

4. **Lost Device**: Immediately run `reset_2fa.js` to disable 2FA, then re-enable with new device

5. **Multiple Accounts**: Authenticator apps can handle unlimited accounts - don't worry about clutter

---

## 📝 Summary

**To Enable 2FA:**
1. Settings → Security → Enable 2FA
2. Scan QR code with Google Authenticator
3. Enter 6-digit code
4. ✅ Done!

**To Get Codes:**
- **Production**: Use your phone's authenticator app
- **Development**: Run `node get_2fa_code.js email@example.com`

**To Reset 2FA:**
- **Quick Fix**: Run `node reset_2fa.js email@example.com`
- **Manual**: Disable in Settings → Re-enable
