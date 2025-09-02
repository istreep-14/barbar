# 🐛 Bar Employee CRM - Debugging Guide

## 🚨 Content Script Errors - NOT YOUR CRM SYSTEM

The errors you're seeing are **NOT from your Bar Employee CRM**:

```
Element not found: .INSTk
contentScript.bundle.js:1 Element not found: .monaco-editor[role="code"]
```

### What These Errors Are:
- **Source**: Browser extension or VS Code related extension
- **Cause**: Another application trying to find DOM elements that don't exist
- **Impact**: **ZERO impact on your Bar CRM system**
- **Solution**: Ignore them or disable the problematic browser extension

### How to Identify the Source:
1. Open Chrome DevTools (F12)
2. Go to **Extensions** tab
3. Look for Monaco Editor, VS Code, or code editing extensions
4. Disable them one by one to identify the culprit

## 🔍 Your CRM System Debugging

### Console Log Categories:
- `[INIT]` - Page initialization
- `[SYSTEM]` - System info and connection
- `[EMPLOYEES]` - Employee data operations
- `[SHIFT-INIT]` - Shift tracker initialization  
- `[SHIFT-LOAD]` - Shift data loading
- `[SHIFT-DEBUG]` - Shift tracker debugging
- `[PHOTO]` - Photo upload operations

### Essential Debugging Steps:

#### 1. **Check Page Loading**
Look for these logs in console:
```
🚀 [INIT] Bar Employee CRM - Page Loading
[INIT] ⏰ Load started at: [timestamp]
[INIT] 🔧 Google Apps Script available: true/false
```

#### 2. **Verify Google Apps Script Connection**
```
[SYSTEM] 📡 Starting system info load...
[SYSTEM] ✅ System info response received: [object]
```

#### 3. **Check Employee Data Loading**
```
[EMPLOYEES] 🔄 Starting employee data load...
[EMPLOYEES] ✅ Employee data response received: [object]
[EMPLOYEES] 📊 Loaded employees count: [number]
```

## 🚨 Common Issues & Solutions

### Issue 1: Page Not Displaying
**Symptoms**: Blank page or loading forever
**Check**:
1. Console for `[INIT]` logs
2. Google Apps Script availability: `google.script` object
3. Network tab for failed requests

**Solution**:
```javascript
// Check in console:
typeof google !== 'undefined' && typeof google.script !== 'undefined'
// Should return: true
```

### Issue 2: No Employee Data
**Symptoms**: Empty employee table
**Check**:
1. `[EMPLOYEES]` logs in console
2. Google Sheets permissions
3. Spreadsheet ID in system info

**Debug Commands** (paste in console):
```javascript
// Check if employees array is populated
console.log('Employees:', employees);

// Check system info
console.log('System Info:', systemInfo);

// Test direct Google Apps Script call
google.script.run
  .withSuccessHandler(data => console.log('Direct test:', data))
  .withFailureHandler(err => console.error('Direct test error:', err))
  .testConnection();
```

### Issue 3: Shift Tracker Not Working
**Symptoms**: Shifts not loading or saving
**Check**:
1. `[SHIFT-INIT]` and `[SHIFT-LOAD]` logs
2. Mock data vs real data mode

**Debug Commands**:
```javascript
// Check shift loading mode
console.log('Google Apps Script mode:', isGoogleAppsScript);

// Check shifts array
console.log('Shifts:', shifts);
```

## 📊 System Health Check

### Quick Health Check (paste in console):
```javascript
console.log('=== CRM SYSTEM HEALTH CHECK ===');
console.log('1. Google Apps Script:', typeof google?.script !== 'undefined' ? '✅' : '❌');
console.log('2. Employees loaded:', Array.isArray(employees) && employees.length > 0 ? '✅' : '❌');
console.log('3. System info:', systemInfo ? '✅' : '❌');
console.log('4. Essential elements:', 
  ['tableContainer', 'employeeModal', 'statusMessage'].every(id => document.getElementById(id)) ? '✅' : '❌'
);
console.log('5. Current URL:', window.location.href);
console.log('================================');
```

## 🔧 Advanced Debugging

### Enable Verbose Logging
Add this to console for more detailed logs:
```javascript
// Override console.log to add timestamps
const originalLog = console.log;
console.log = function(...args) {
  originalLog('[' + new Date().toISOString() + ']', ...args);
};
```

### Network Debugging
1. Open DevTools → Network tab
2. Reload the page
3. Look for:
   - HTML file loads (employee.html, shift.html)
   - Google Apps Script API calls
   - Any 404 or 500 errors

### Google Apps Script Debugging
1. Go to script.google.com
2. Open your project
3. View → Executions
4. Check for runtime errors

## 📋 Troubleshooting Checklist

- [ ] Browser console shows `[INIT]` logs
- [ ] Google Apps Script available (`google.script` exists)
- [ ] System info loads successfully
- [ ] Employee data loads (check count > 0)
- [ ] No JavaScript errors in console (except content script ones)
- [ ] Correct Google Apps Script web app URL
- [ ] Web app deployed with proper permissions
- [ ] Spreadsheet exists and is accessible

## 🆘 If Still Not Working

### Gather This Information:
1. **Browser & Version**: Chrome 120, Firefox 115, etc.
2. **Console Logs**: Copy all `[INIT]`, `[SYSTEM]`, `[EMPLOYEES]` logs
3. **URL**: The Google Apps Script web app URL you're accessing
4. **Network Errors**: Any failed requests in Network tab
5. **Google Apps Script Logs**: From script.google.com executions

### Emergency Reset:
```javascript
// Clear all local data and reload
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Remember: The `contentScript.bundle.js` and `.INSTk`/`.monaco-editor` errors are **NOT** from your CRM system and can be safely ignored!