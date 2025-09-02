# 🚀 Google Apps Script Web App Deployment Guide

## 🚨 **CRITICAL: You're Using the Editor Preview, Not the Deployed App**

### **Problem Identified:**
Your URL shows `userCodeAppPanel` which is the **Google Apps Script editor preview**, not the actual deployed web app.

## 📋 **Step-by-Step Deployment Instructions:**

### **1. Open Google Apps Script**
- Go to **script.google.com**
- Open your Bar Employee CRM project

### **2. Deploy as Web App**
1. Click **Deploy** button (top right)
2. Select **New Deployment**
3. Click the **gear icon** next to "Select type"
4. Choose **Web app**

### **3. Configure Deployment Settings**
- **Description**: `Bar Employee CRM v1.0`
- **Execute as**: **Me** (your Google account)
- **Who has access**: **Anyone** (or **Anyone with Google account** for security)

### **4. Deploy and Get URL**
1. Click **Deploy**
2. **Authorize** if prompted (click "Authorize access")
3. **Copy the Web app URL** - it should look like:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
4. **This is your correct URL** - bookmark it!

### **5. Test the Deployed App**
- Open the **Web app URL** (not the editor URL)
- You should see the landing page with dashboard cards
- Navigation should work properly
- No iframes or editor interface

## 🔍 **URL Comparison:**

### **❌ WRONG (Editor Preview):**
```
https://n-a2balbwe5g46m7zknx2y7f37gbdov4fefc2usba-0lu-script.googleusercontent.com/userCodeAppPanel
```
- Contains `userCodeAppPanel`
- Shows in iframes
- Has editor interface
- Limited functionality

### **✅ CORRECT (Deployed Web App):**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
- Contains `/macros/s/` and `/exec`
- Full page application
- No editor interface
- Complete functionality

## 🧪 **Testing URLs:**

Once you have the correct web app URL, test these:

1. **Landing Page:**
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

2. **Employee CRM:**
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?page=employee
   ```

3. **Shift Tracker:**
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?page=shift
   ```

## 📊 **Expected Console Logs (Correct Deployment):**

### **Landing Page:**
```
🚀 [LANDING] Bar Operations Landing Page
[LANDING] ⏰ Load started at: 2025-01-15T...
[LANDING] 📍 Current URL: https://script.google.com/macros/s/.../exec
[LANDING] 🔧 Google Apps Script available: true
```

### **Employee Page:**
```
🚀 [INIT] Bar Employee CRM - Page Loading
[INIT] 📍 Page URL: https://script.google.com/macros/s/.../exec?page=employee
[SYSTEM] 🔄 Starting system info load...
[EMPLOYEES] 🔄 Starting employee data load...
```

## 🔧 **If You Still Have Issues:**

### **1. Check Deployment Status**
- Go to script.google.com → your project
- Click **Deploy** → **Manage deployments**
- Verify web app is **Active**

### **2. Re-deploy if Needed**
- Click **Deploy** → **New deployment**
- Follow steps above again
- Use the new URL

### **3. Clear Browser Cache**
- Press **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
- Or use incognito/private browsing mode

## 🎯 **Summary**

**The fix is simple**: You need to use the **deployed web app URL** that ends with `/exec`, not the editor preview URL with `userCodeAppPanel`.

Once you use the correct URL:
- ✅ Landing page will show the dashboard
- ✅ Navigation buttons will work properly  
- ✅ No more iframe/tab behavior
- ✅ Full application functionality

**Get the correct deployment URL and try again!**