# 🔗 Relative URL Navigation - NO SCRIPT ID NEEDED!

## ✅ **PROBLEM SOLVED - No More Script IDs!**

I've updated all navigation to use **relative URLs** instead of requiring script IDs. Now your navigation will work regardless of the deployment URL.

## 🔧 **What Changed:**

### **Before (Required Script ID):**
```javascript
const baseUrl = window.location.href.split('?')[0];
const newUrl = baseUrl + '?page=' + page;
window.location.href = newUrl;
```

### **After (Relative URLs):**
```javascript
// For non-landing pages
const newUrl = '?page=' + page;
window.location.href = newUrl;

// For landing page  
const newUrl = '.';  // Just go to base URL
window.location.href = newUrl;
```

## 📋 **Updated Files:**

### **1. landing.html**
- ✅ Navigation uses `?page=employee` and `?page=shift`
- ✅ No script ID required

### **2. employee.html**
- ✅ Dashboard button uses `.` (base URL)
- ✅ Shift button uses `?page=shift`
- ✅ No script ID required

### **3. shift.html**
- ✅ Dashboard button uses `.` (base URL)
- ✅ Employee button uses `?page=employee`
- ✅ No script ID required

### **4. Code.gs (Backend)**
- ✅ Error redirects use `.` instead of full URLs
- ✅ No script ID hardcoding

## 🎯 **How It Works Now:**

### **Navigation URLs:**
```
Landing Page:    .
Employee CRM:    ?page=employee
Shift Tracker:   ?page=shift
```

### **Example Navigation Flow:**
1. **Start at**: `https://script.google.com/macros/s/YOUR_ID/exec`
2. **Click Employee**: Goes to `?page=employee` → Full URL becomes `https://script.google.com/macros/s/YOUR_ID/exec?page=employee`
3. **Click Dashboard**: Goes to `.` → Full URL becomes `https://script.google.com/macros/s/YOUR_ID/exec`
4. **Click Shifts**: Goes to `?page=shift` → Full URL becomes `https://script.google.com/macros/s/YOUR_ID/exec?page=shift`

## 🚀 **Benefits:**

### **✅ Portability**
- Works with any Google Apps Script deployment
- No need to update URLs when redeploying
- Works in different environments (dev, prod, etc.)

### **✅ Simplicity**
- Clean, short URLs
- No hardcoded script IDs
- Easy to maintain

### **✅ Reliability**
- Relative navigation always works
- No broken links from script ID changes
- Works regardless of deployment method

## 🧪 **Testing:**

### **Console Logs to Expect:**
```
[NAVIGATION] 🧭 Navigating from employee page to: shift
[NAVIGATION] 📍 Current URL: https://script.google.com/.../exec?page=employee
[NAVIGATION] 🎯 Relative URL: ?page=shift
```

### **URL Changes:**
- **From Landing**: `?page=employee` or `?page=shift`
- **To Landing**: `.` (removes parameters)
- **Between Pages**: `?page=newpage`

## 🎯 **How to Use:**

### **1. Deploy Your Web App**
- Go to script.google.com
- Deploy as Web App
- Get your deployment URL (ends with `/exec`)

### **2. Use Any of These URLs:**
```
https://script.google.com/macros/s/YOUR_ID/exec
https://script.google.com/macros/s/YOUR_ID/exec?page=employee
https://script.google.com/macros/s/YOUR_ID/exec?page=shift
```

### **3. Navigation Just Works**
- Click any navigation button
- URLs automatically adjust relative to current location
- No script ID needed in code

## 🔍 **Debug Information:**

The console logs will now show:
```
[LANDING] 🎯 Relative URL: ?page=employee
[NAVIGATION] 🎯 Relative URL: ?page=shift
[NAVIGATION] 🎯 Relative URL: .
```

## 🎉 **Result:**

**Your navigation system now works with ANY Google Apps Script deployment URL - no script ID configuration needed!**

Just deploy your web app and use the provided URL. All navigation will work automatically using relative paths.