# 🔧 Iframe Navigation Fix for Google Apps Script

## 🐛 Problem Identified

Your logs show that the web app is running inside an iframe environment:
```
Current URL: https://n-a2balbwe5g46m7zknx2y7f37gbdov4fefc2usba-0lu-script.googleusercontent.com/userCodeAppPanel
```

This `googleusercontent.com` domain indicates the app is being served through Google's iframe-based content delivery system. The relative URL navigation (`?page=employee`) wasn't working because:

1. The iframe environment may have different URL handling
2. Cross-origin restrictions may prevent access to parent frame
3. Simple relative URLs don't always work in embedded contexts

## ✅ Solution Implemented

I've updated the `navigateToPage()` function in all three HTML files (landing.html, employee.html, shift.html) to:

### 1. **Detect Iframe Environment**
```javascript
if (window.location.href.includes('googleusercontent.com')) {
    console.log('[NAVIGATION] 🔍 Detected iframe/embedded environment');
}
```

### 2. **Try Multiple Navigation Methods**
The function now attempts navigation in this order:
- First: Try to navigate the top-level window (if in iframe)
- Second: Try normal window navigation
- Third: Fallback to relative URL navigation

### 3. **Construct Full URLs**
Instead of just using `?page=employee`, the function now:
- Gets the base URL by removing query parameters
- Constructs the full URL with the new page parameter
- Handles the special case for landing page (no parameters)

## 📝 What Changed

### Before:
```javascript
const newUrl = '?page=' + page;
window.location.href = newUrl;
```

### After:
```javascript
// Get base URL
let baseUrl = window.location.href.split('?')[0];

// Construct full URL
const newUrl = page === 'landing' ? baseUrl : baseUrl + '?page=' + page;

// Try multiple navigation methods
if (window.top && window.top !== window) {
    window.top.location.href = newUrl;
} else {
    window.location.href = newUrl;
}
```

## 🧪 Testing Instructions

1. **Deploy your updated web app**:
   - Go to Google Apps Script editor
   - Deploy → New Deployment
   - Choose "Web app" as the type
   - Execute as: "Me"
   - Who has access: Configure as needed
   - Click "Deploy"

2. **Test navigation with console open**:
   - Open browser developer tools (F12)
   - Navigate to your web app URL
   - Click navigation buttons
   - Watch for these new console logs:
     ```
     [NAVIGATION] 🔍 Detected iframe/embedded environment
     [NAVIGATION] 📍 Parent URL: ...
     [NAVIGATION] 🎯 Full URL: ...
     [NAVIGATION] 🔄 Attempting top-level navigation
     ```

3. **Expected behavior**:
   - Clicking "Employee CRM" should load the employee page
   - Clicking "Shift Tracker" should load the shift page
   - Clicking "Dashboard" should return to landing page
   - URL should change to reflect the current page

## 🔍 Debugging Tips

If navigation still doesn't work:

1. **Check console for errors**:
   - Look for any JavaScript errors
   - Check for cross-origin security errors
   - Verify the navigation function is being called

2. **Verify deployment**:
   - Ensure you've deployed the latest version
   - Check that all HTML files are updated
   - Confirm the web app URL is correct

3. **Test direct URLs**:
   - Try accessing pages directly:
     - `https://script.google.com/macros/s/YOUR_ID/exec`
     - `https://script.google.com/macros/s/YOUR_ID/exec?page=employee`
     - `https://script.google.com/macros/s/YOUR_ID/exec?page=shift`

4. **Check browser compatibility**:
   - Test in different browsers
   - Disable browser extensions that might interfere
   - Try incognito/private mode

## 🎯 Expected Console Output

When navigation works correctly, you should see:
```
[LANDING] 🧭 Navigating to page: employee
[LANDING] 📍 Current URL: https://n-a2balbwe5g46m7zknx2y7f37gbdov4fefc2usba-0lu-script.googleusercontent.com/userCodeAppPanel
[LANDING] 🔍 Detected iframe/embedded environment
[LANDING] ⚠️ Cannot access parent URL (cross-origin)
[LANDING] 🎯 Full URL: https://n-a2balbwe5g46m7zknx2y7f37gbdov4fefc2usba-0lu-script.googleusercontent.com/userCodeAppPanel?page=employee
[LANDING] 🔄 Attempting top-level navigation
```

The navigation should then load the requested page.

## 🚀 Summary

The navigation system has been updated to handle Google Apps Script's iframe-based serving environment. The new implementation:
- Detects when running in an iframe
- Constructs full URLs instead of relative ones
- Attempts multiple navigation methods for compatibility
- Includes comprehensive logging for debugging

This should resolve the "leads to nothing" issue you were experiencing!