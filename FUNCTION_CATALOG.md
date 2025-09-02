# Bar Employee CRM - Complete Function Catalog

## 🚨 Content Script Errors Analysis
The errors you're seeing (`contentScript.bundle.js`, `.INSTk`, `.monaco-editor[role="code"]`) are NOT from your Bar CRM system. These are from:
- A browser extension (likely VS Code or Monaco Editor related)
- Another application running in the background
- Chrome DevTools extensions

**Your Bar CRM system does NOT use content scripts or Monaco Editor** - it's a pure Google Apps Script web application.

## 📋 Function Categories & Workflow Order

### 🔧 **CORE INFRASTRUCTURE** (Foundation Layer)
These functions initialize and maintain the system infrastructure:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `doGet(e)` | **WEB APP ENTRY POINT** - Serves HTML pages based on URL parameters | None | **1st - Always called first** |
| `include(filename)` | Includes HTML partials into templates | None | Called by doGet |
| `getSystemInfo()` | Returns environment and spreadsheet info | getCRMSheet | **2nd - System validation** |
| `getAppSpreadsheet()` | Gets/creates the main spreadsheet | PropertiesService | **3rd - Data foundation** |
| `getCRMSheet()` | Gets/creates the main CRM data sheet | getAppSpreadsheet | **4th - Primary data sheet** |
| `ensureAllSheets()` | Creates all required sheets (CRM, Skills, Shifts, Positions) | getCRMSheet, getSkillsSheet, getShiftsSheet, getPositionsSheet | **5th - Complete setup** |

### 📊 **DATA MANAGEMENT** (CRUD Operations)
Core data operations for employee management:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `getAllEmployees()` | Reads all employee records from sheet | getCRMSheet | **After sheet initialization** |
| `saveAllEmployees(employees)` | Writes employee array to sheet | getCRMSheet, validateSheetHeaders | **After data modification** |
| `syncFromSheet()` | Refreshes employee data from sheet | getAllEmployees | **For data refresh** |
| `uploadEmployeePhoto(dataUrl, fileName, empId)` | Uploads employee photos to Google Drive | DriveApp | **During employee creation/update** |

### 🏢 **POSITION MANAGEMENT**
Manages job positions and organizational structure:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `getPositionsSheet()` | Gets/creates positions configuration sheet | getAppSpreadsheet | **After main sheet setup** |
| `initializePositionsSheet(spreadsheet)` | Sets up default positions with icons | None | **During first-time setup** |
| `getPositionsList()` | Returns positions with icons and descriptions | getPositionsSheet | **For UI population** |
| `savePositionsList(positions)` | Saves position configurations | getPositionsSheet | **After position changes** |

### 🎯 **SKILLS MANAGEMENT**
Manages bartender skills and ratings:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `getSkillsSheet()` | Gets/creates employee skills tracking sheet | getSkillsConfigSheet | **After config setup** |
| `getSkillsConfigSheet()` | Gets/creates skills categories configuration | getAppSpreadsheet | **Before skills operations** |
| `getSkillCategories()` | Returns skill categories with weights | getSkillsConfigSheet | **For skills UI** |
| `getEmployeeSkills(empId)` | Gets skill ratings for specific employee | getSkillsSheet | **For employee details** |
| `saveEmployeeSkills(empId, skills)` | Saves skill ratings for employee | getSkillsSheet | **After skill updates** |

### ⏰ **SHIFT MANAGEMENT**
Handles work shift tracking and scheduling:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `getShiftsSheet()` | Gets/creates shifts tracking sheet | getAppSpreadsheet | **For shift operations** |
| `getAllShifts()` | Returns all recorded shifts | getShiftsSheet | **For shift display** |
| `addShift(shiftData)` | Creates new shift record | getShiftsSheet, generateId | **When logging shifts** |
| `updateShift(shiftData)` | Updates existing shift | getShiftsSheet | **For shift modifications** |
| `deleteShift(shiftId)` | Removes shift record | getShiftsSheet | **For shift removal** |
| `getShiftStats()` | Calculates tips and hours aggregations | getAllShifts | **For reporting** |
| `calculateHours(date, startTime, endTime)` | Calculates shift duration | None | **Called by shift functions** |
| `generateId()` | Creates unique identifiers | None | **For new records** |

### 👤 **USER MANAGEMENT**
Handles "me" employee identification:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `getMeEmployeeId()` | Gets current user's employee ID | PropertiesService | **For personalization** |
| `setMeEmployeeId(empId)` | Sets current user's employee ID | PropertiesService | **During user setup** |
| `clearMeEmployeeId()` | Clears user identification | PropertiesService | **For logout/reset** |

### 🔧 **UTILITY FUNCTIONS**
Helper functions for data processing and validation:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `safeParseDate(dateInput)` | Safely parses date strings/objects | None | **For date processing** |
| `formatDateForDisplay(dateInput)` | Formats dates for UI display | safeParseDate | **For UI rendering** |
| `validateSheetHeaders(sheet)` | Ensures correct column headers | None | **Before data operations** |
| `initializeSheet(sheet)` | Sets up sheet formatting and headers | None | **During sheet creation** |
| `tryMigrateSheet(sheet)` | Handles schema migrations | None | **For version updates** |

### 🛠️ **MAINTENANCE & ADMIN**
Administrative and maintenance functions:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `testSetup()` | Validates system configuration | ensureAllSheets | **For troubleshooting** |
| `testConnection()` | Tests basic system connectivity | getSystemInfo | **For diagnostics** |
| `initializeSampleData()` | Creates sample employee data | saveAllEmployees | **For demo/testing** |
| `repairSheet()` | Fixes sheet headers and validation | getCRMSheet | **For maintenance** |
| `createBackup()` | Creates JSON backup of all data | getAllEmployees, getAllShifts | **For data protection** |
| `getLastBackupInfo()` | Returns backup metadata | PropertiesService | **For backup status** |
| `exportBackup()` | Exports data for external backup | getAllEmployees, getPositionsList | **For data export** |
| `cleanupOldPhotos()` | Removes unused employee photos | DriveApp | **For storage cleanup** |
| `getSheetUrl()` | Returns shareable spreadsheet URL | getAppSpreadsheet | **For sharing** |

### 📖 **DOCUMENTATION**
Self-documenting functions:

| Function | Description | Dependencies | Workflow Order |
|----------|-------------|--------------|----------------|
| `getFunctionCatalog()` | Returns function descriptions (basic) | None | **For documentation** |

## 🔄 **TYPICAL WORKFLOW SEQUENCES**

### **1. System Initialization Flow:**
```
doGet() → getSystemInfo() → getAppSpreadsheet() → ensureAllSheets() → initializePositionsSheet()
```

### **2. Employee Management Flow:**
```
getAllEmployees() → [User Actions] → saveAllEmployees() → syncFromSheet()
```

### **3. Skills Management Flow:**
```
getSkillsConfigSheet() → getSkillCategories() → getEmployeeSkills() → [User Updates] → saveEmployeeSkills()
```

### **4. Shift Tracking Flow:**
```
getShiftsSheet() → getAllShifts() → [addShift/updateShift/deleteShift] → getShiftStats()
```

### **5. Photo Upload Flow:**
```
[User selects photo] → uploadEmployeePhoto() → saveAllEmployees() → cleanupOldPhotos()
```

## 🚀 **FUNCTION DEPENDENCIES MAP**

### **Core Dependencies:**
- `PropertiesService` (Google Apps Script) - Used by: doGet, getSystemInfo, getCRMSheet, getMeEmployeeId, setMeEmployeeId, clearMeEmployeeId
- `SpreadsheetApp` (Google Apps Script) - Used by: getAppSpreadsheet, getCRMSheet, getPositionsSheet, getSkillsSheet, getShiftsSheet
- `DriveApp` (Google Apps Script) - Used by: uploadEmployeePhoto, cleanupOldPhotos
- `HtmlService` (Google Apps Script) - Used by: doGet, include

### **Internal Dependencies:**
- Most sheet functions depend on `getAppSpreadsheet()`
- Data functions depend on their respective sheet getters
- Utility functions are used throughout for data processing

## 🐛 **DEBUGGING INFO NEEDED**

To help fix the page display issues, I need to know:

1. **What specific pages are not showing?** (landing.html, employee.html, shift.html)
2. **What browser are you using?** (Chrome, Firefox, etc.)
3. **Are you seeing any JavaScript errors in the browser console?** (F12 → Console tab)
4. **What's the exact URL you're accessing?** (the Google Apps Script web app URL)
5. **Are you getting the Google Apps Script authorization screen?**

The content script errors are unrelated to your Bar CRM system - they're from a browser extension or another application.