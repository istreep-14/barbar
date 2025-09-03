/**
 * Bar Employee CRM - Google Apps Script Backend (Fixed Date Handling)
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project (script.google.com)
 * 2. Replace Code.gs content with this script
 * 3. Add the HTML file as 'index.html' 
 * 4. Deploy as Web App with execute as "Me" and access "Anyone"
 * 5. Copy the web app URL and test the connection
 */

// Configuration
const CRM_SHEET_NAME = 'Bar_Employee_CRM_Data';
const POSITIONS_SHEET_NAME = 'Position_Config';
const PHOTOS_FOLDER_NAME = 'Bar_Employee_Photos';
const SKILLS_SHEET_NAME = 'Bartender_Skills';
const SKILLS_CONFIG_SHEET_NAME = 'Bartender_Skill_Config';
const SHIFTS_SHEET_NAME = 'Shifts';
const LOCATIONS_SHEET_NAME = 'Locations_Config';
const COWORKERS_SHEET_NAME = 'Shift_Coworkers';
const HEADER_ROW = 1;
const DATA_START_ROW = 2;

// Headers in order
const HEADERS = [
  'Emp Id', 'First Name', 'Last Name', 'Phone', 'Email', 
  'Position', 'Status', 'Note', 'Photo URL', 'Created Date', 'Last Modified',
  'Is Manager', 'Is Assistant Manager', 'Is Me'
];

// Default bartender skill categories
const DEFAULT_SKILL_CONFIG = [
  { name: 'Mixology', description: 'Classic cocktails, balance, techniques', weight: 1 },
  { name: 'Bar Maintenance', description: 'Restock, organization, station readiness', weight: 1 },
  { name: 'Sanitation', description: 'Cleanliness, food safety practices', weight: 1 },
  { name: 'Payment Management', description: 'POS accuracy, tabs, settlements', weight: 1 },
  { name: 'Alcohol Awareness', description: 'ID checks, over-service prevention', weight: 1 },
  { name: 'Multitasking', description: 'Juggling orders, prioritization, composure', weight: 1 },
  { name: 'Customer Service', description: 'Hospitality, communication, recovery', weight: 1 }
];

/**
 * Get or create bartender skills sheet with headers
 */
function getSkillsSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('CRM_SHEET_ID');
  if (!sheetId) {
    throw new Error('CRM sheet not initialized');
  }
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName(SKILLS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SKILLS_SHEET_NAME);
  }
  // Ensure headers exist: Emp Id + categories from config sheet (avoid recursion)
  let categories = [];
  try {
    const cfg = getSkillsConfigSheet();
    const lastRow = cfg.getLastRow();
    if (lastRow >= 2) {
      const vals = cfg.getRange(2, 1, lastRow - 1, 1).getValues();
      vals.forEach(r => { const name = (r[0] || '').toString().trim(); if (name) categories.push(name); });
    }
  } catch (e) {}
  if (categories.length === 0) {
    categories = DEFAULT_SKILL_CONFIG.map(c => c.name);
  }
  const expectedHeaders = ['Emp Id'].concat(categories);
  const lastCol = Math.max(sheet.getLastColumn(), expectedHeaders.length);
  let currentHeaders = [];
  if (sheet.getLastRow() >= 1 && lastCol > 0) {
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  let headersChanged = false;
  expectedHeaders.forEach((h, i) => {
    if (currentHeaders[i] !== h) {
      headersChanged = true;
    }
  });
  if (headersChanged || sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  }
  return sheet;
}

/**
 * Ensure and return the skills config sheet (Category, Description, Weight)
 */
function getSkillsConfigSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('CRM_SHEET_ID');
  if (!sheetId) {
    throw new Error('CRM sheet not initialized');
  }
  const ss = SpreadsheetApp.openById(sheetId);
  let cfg = ss.getSheetByName(SKILLS_CONFIG_SHEET_NAME);
  if (!cfg) {
    cfg = ss.insertSheet(SKILLS_CONFIG_SHEET_NAME);
  }
  const headers = ['Category', 'Description', 'Weight'];
  const lastCol = Math.max(cfg.getLastColumn(), headers.length);
  let currentHeaders = [];
  if (cfg.getLastRow() >= 1 && lastCol > 0) {
    currentHeaders = cfg.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  let needsInit = false;
  headers.forEach((h, i) => {
    if (currentHeaders[i] !== h) {
      needsInit = true;
    }
  });
  if (needsInit || cfg.getLastRow() < 1) {
    cfg.getRange(1, 1, 1, headers.length).setValues([[headers[0], headers[1], headers[2]]]);
    if (DEFAULT_SKILL_CONFIG.length > 0) {
      const rows = DEFAULT_SKILL_CONFIG.map(c => [c.name, c.description, c.weight]);
      cfg.getRange(2, 1, rows.length, 3).setValues(rows);
    }
    cfg.setFrozenRows(1);
    cfg.getRange(1, 1, 1, headers.length).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  }
  // Style weight column as number
  const lastRow = cfg.getLastRow();
  if (lastRow >= 2) {
    cfg.getRange(2, 3, lastRow - 1, 1).setNumberFormat('0.00');
  }
  return cfg;
}

/**
 * Return the list of skill categories (with descriptions and weights)
 */
function getSkillCategories() {
  try {
    const cfg = getSkillsConfigSheet();
    const lastRow = cfg.getLastRow();
    let categories = [];
    const descriptions = {};
    const weights = {};
    if (lastRow >= 2) {
      const vals = cfg.getRange(2, 1, lastRow - 1, 3).getValues();
      vals.forEach(r => {
        const name = (r[0] || '').toString().trim();
        if (!name) return;
        const desc = (r[1] || '').toString().trim();
        const w = parseFloat(r[2]);
        categories.push(name);
        descriptions[name] = desc;
        weights[name] = isNaN(w) ? 1 : w;
      });
    }
    if (categories.length === 0) {
      categories = DEFAULT_SKILL_CONFIG.map(c => c.name);
      DEFAULT_SKILL_CONFIG.forEach(c => {
        descriptions[c.name] = c.description;
        weights[c.name] = c.weight;
      });
    }
    // Ensure skills sheet headers are aligned
    getSkillsSheet();
    return { success: true, categories: categories, descriptions: descriptions, weights: weights };
  } catch (e) {
    const categories = DEFAULT_SKILL_CONFIG.map(c => c.name);
    const descriptions = {};
    const weights = {};
    DEFAULT_SKILL_CONFIG.forEach(c => { descriptions[c.name] = c.description; weights[c.name] = c.weight; });
    return { success: true, categories, descriptions, weights, error: e.toString() };
  }
}

/**
 * Get skills for a specific employee (object of category -> integer 0-5)
 */
function getEmployeeSkills(empId) {
  try {
    if (!empId) return { success: false, error: 'empId required' };
    const sheet = getSkillsSheet();
    const catsResult = getSkillCategories();
    const categories = catsResult.categories || DEFAULT_SKILL_CONFIG.map(c => c.name);
    const weights = catsResult.weights || {};
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, skills: {}, overall: 0 };
    }
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (let i = 0; i < data.length; i++) {
      if ((data[i][0] || '').toString().trim() === empId) {
        const skills = {};
        let totalWeighted = 0;
        let sumWeights = 0;
        for (let c = 0; c < categories.length; c++) {
          const v = data[i][c + 1];
          const val = typeof v === 'number' ? v : parseFloat(v);
          const safe = isNaN(val) ? 0 : Math.max(0, Math.min(5, val));
          skills[categories[c]] = safe;
          const w = parseFloat(weights[categories[c]]) || 1;
          totalWeighted += safe * w;
          sumWeights += w;
        }
        const overall = sumWeights > 0 ? totalWeighted / sumWeights : 0;
        return { success: true, skills, overall: overall, weights: weights };
      }
    }
    return { success: true, skills: {}, overall: 0 };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save skills for a specific employee
 */
function saveEmployeeSkills(empId, skills) {
  try {
    if (!empId) return { success: false, error: 'empId required' };
    const sheet = getSkillsSheet();
    const catsResult = getSkillCategories();
    const categories = catsResult.categories || DEFAULT_SKILL_CONFIG.map(c => c.name);
    // Find existing row
    const lastRow = sheet.getLastRow();
    let targetRow = -1;
    if (lastRow >= 2) {
      const range = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < range.length; i++) {
        if ((range[i][0] || '').toString().trim() === empId) {
          targetRow = i + 2;
          break;
        }
      }
    }
    if (targetRow === -1) {
      targetRow = lastRow >= 2 ? lastRow + 1 : 2;
      sheet.getRange(targetRow, 1).setValue(empId);
    }
    // Build row values: Emp Id + category values 0-5
    const rowValues = [empId];
    for (let i = 0; i < categories.length; i++) {
      const key = categories[i];
      const valRaw = (skills && skills[key] != null) ? parseFloat(skills[key]) : 0;
      const val = Math.max(0, Math.min(5, isNaN(valRaw) ? 0 : valRaw));
      rowValues.push(val);
    }
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    // Number format for skills columns
    const lastCol = sheet.getLastColumn();
    if (lastCol > 1) {
      sheet.getRange(2, 2, Math.max(1, sheet.getLastRow() - 1), lastCol - 1).setNumberFormat('0.0');
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Default positions with icons (matching HTML)
const DEFAULT_POSITIONS = [
  { name: 'Bartender', icon: '🍸' },
  { name: 'Server', icon: '🍽️' },
  { name: 'Manager', icon: '👔' },
  { name: 'Host', icon: '🎯' },
  { name: 'Kitchen Staff', icon: '👨‍🍳' },
  { name: 'Security', icon: '🛡️' },
  { name: 'Assistant Manager', icon: '🎖️' }
];

/**
 * Utility function to safely convert string dates to Date objects
 */
function safeParseDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    // If it's already a Date object, return it
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    // If it's a string, try to parse it
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // If it's a number (timestamp), convert it
    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  } catch (error) {
    Logger.log('Date parsing error: ' + error.toString() + ' for input: ' + dateInput);
    return null;
  }
}

/**
 * Utility function to format date for display
 */
function formatDateForDisplay(dateInput) {
  const date = safeParseDate(dateInput);
  return date ? date.toISOString() : '';
}

/**
 * Serves the main web app HTML
 */
function doGet(e) {
  const timestamp = new Date().toISOString();
  console.log(`[DOGET] 🚀 ${timestamp} - Page request received`);
  console.log(`[DOGET] 📊 Request parameters:`, e?.parameter || 'None');
  
  try {
    const pageParam = e && e.parameter ? (e.parameter.page || e.parameter.view) : null;
    const page = pageParam ? String(pageParam) : 'landing';
    console.log(`[DOGET] 📄 Serving page: ${page}`);
    console.log(`[DOGET] 🔍 Available parameters:`, JSON.stringify(e?.parameter || {}));
    
    // Validate page parameter
    const validPages = ['landing', 'employee', 'shift', 'coworkers'];
    if (!validPages.includes(page)) {
      console.log(`[DOGET] ⚠️ Invalid page '${page}', redirecting to landing`);
      // Use relative redirect to avoid hardcoding script ID
      const redirectHtml = HtmlService.createHtmlOutput(`
        <html>
          <head><meta http-equiv="refresh" content="0;url=."></head>
          <body>Redirecting to landing page...</body>
        </html>
      `);
      return redirectHtml;
    }
    
    let pageTitle = 'Bar Operations';
    if (page === 'employee') pageTitle = 'Bar Employee CRM';
    if (page === 'shift') pageTitle = 'Bartending Shift Tracker';
    if (page === 'coworkers') pageTitle = 'Shift Coworkers';
    
    console.log(`[DOGET] 📝 Page title: ${pageTitle}`);
    console.log(`[DOGET] 🔄 Creating HTML template for: ${page}`);
    
    const html = HtmlService.createTemplateFromFile(page);
    const htmlOutput = html.evaluate()
      .setTitle(pageTitle)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    console.log(`[DOGET] ✅ Successfully created HTML output for: ${page}`);
    console.log(`[DOGET] 🔗 Web app URL structure: ${ScriptApp.getService().getUrl()}`);
    return htmlOutput;
  } catch (error) {
    console.error(`[DOGET] ❌ Error serving HTML:`, error);
    console.error(`[DOGET] 📝 Error stack:`, error.stack);
    Logger.log('Error serving HTML: ' + error.toString());
    
    const errorHtml = HtmlService.createHtmlOutput(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>🚫 CRM System Error</h2>
          <p>There was an error loading the Bar Employee CRM.</p>
          <p><strong>Error:</strong> ${error.toString()}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Requested Page:</strong> ${e?.parameter?.page || 'landing'}</p>
          <button onclick="location.reload()">🔄 Reload Page</button>
          <hr>
          <p><small>Check the browser console (F12) for more details</small></p>
        </body>
      </html>
    `).setTitle('CRM Error');
    return errorHtml;
  }
}

/**
 * Include CSS and JS files in HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get or create the CRM data sheet
 */
function getCRMSheet() {
  try {
    const props = PropertiesService.getScriptProperties();
    let sheetId = props.getProperty('CRM_SHEET_ID');
    let sheet = null;
    
    if (sheetId) {
      try {
        const spreadsheet = SpreadsheetApp.openById(sheetId);
        sheet = spreadsheet.getSheetByName(CRM_SHEET_NAME);
        
        if (sheet && !validateSheetHeaders(sheet)) {
          Logger.log('Sheet headers invalid, attempting migration...');
          if (!tryMigrateSheet(sheet)) {
            Logger.log('Migration not possible, reinitializing sheet...');
            initializeSheet(sheet);
          }
        }
      } catch (e) {
        Logger.log('Existing sheet not accessible: ' + e.toString());
        sheetId = null;
      }
    }
    
    if (!sheet) {
      const spreadsheet = SpreadsheetApp.create('Bar Employee CRM Data - ' + new Date().getFullYear());
      sheet = spreadsheet.getActiveSheet();
      sheet.setName(CRM_SHEET_NAME);
      
      sheetId = spreadsheet.getId();
      props.setProperty('CRM_SHEET_ID', sheetId);
      
      initializeSheet(sheet);
      initializePositionsSheet(spreadsheet);
      
      Logger.log('Created new CRM sheet: ' + sheetId);
    }
    
    return sheet;
  } catch (error) {
    throw new Error('Failed to access or create CRM data sheet: ' + error.toString());
  }
}

/**
 * Returns the shared spreadsheet used by all domains (employees, shifts, etc.)
 */
function getAppSpreadsheet() {
  const crmSheet = getCRMSheet();
  return crmSheet.getParent();
}

/**
 * Get or create positions configuration sheet
 */
function getPositionsSheet() {
  try {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty('CRM_SHEET_ID');
    
    if (!sheetId) {
      throw new Error('No CRM sheet ID found');
    }
    
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let posSheet = spreadsheet.getSheetByName(POSITIONS_SHEET_NAME);
    
    if (!posSheet) {
      posSheet = initializePositionsSheet(spreadsheet);
    }
    
    return posSheet;
  } catch (error) {
    Logger.log('Error getting positions sheet: ' + error.toString());
    return null;
  }
}

/**
 * Initialize positions configuration sheet
 */
function initializePositionsSheet(spreadsheet) {
  try {
    const posSheet = spreadsheet.insertSheet(POSITIONS_SHEET_NAME);
    
    posSheet.getRange(1, 1, 1, 2).setValues([['Position Name', 'Icon']]);
    
    const positionData = DEFAULT_POSITIONS.map(pos => [pos.name, pos.icon]);
    if (positionData.length > 0) {
      posSheet.getRange(2, 1, positionData.length, 2).setValues(positionData);
    }
    
    const headerRange = posSheet.getRange(1, 1, 1, 2);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    posSheet.setColumnWidth(1, 200);
    posSheet.setColumnWidth(2, 80);
    posSheet.setFrozenRows(1);
    
    Logger.log('Initialized positions sheet');
    return posSheet;
  } catch (error) {
    Logger.log('Error initializing positions sheet: ' + error.toString());
    return null;
  }
}

/**
 * Validate sheet headers
 */
function validateSheetHeaders(sheet) {
  try {
    const existingHeaders = sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length).getValues()[0];
    return HEADERS.every((header, index) => existingHeaders[index] === header);
  } catch (error) {
    return false;
  }
}

/**
 * Initialize the main data sheet with headers
 */
function initializeSheet(sheet) {
  try {
    sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length).setValues([HEADERS]);
    
    const headerRange = sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    sheet.setColumnWidth(1, 100);  // Emp ID
    sheet.setColumnWidth(2, 120);  // First Name
    sheet.setColumnWidth(3, 120);  // Last Name
    sheet.setColumnWidth(4, 140);  // Phone
    sheet.setColumnWidth(5, 180);  // Email
    sheet.setColumnWidth(6, 200);  // Position
    sheet.setColumnWidth(7, 80);   // Status
    sheet.setColumnWidth(8, 250);  // Note
    sheet.setColumnWidth(9, 200);  // Photo URL
    sheet.setColumnWidth(10, 120); // Created Date
    sheet.setColumnWidth(11, 120); // Last Modified
    sheet.setColumnWidth(12, 100); // Is Manager
    sheet.setColumnWidth(13, 150); // Is Assistant Manager
    sheet.setColumnWidth(14, 80);  // Is Me
    
    sheet.setFrozenRows(1);
    
    const statusRange = sheet.getRange(DATA_START_ROW, 7, 1000, 1);
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Inactive'])
      .setAllowInvalid(false)
      .setHelpText('Select Active or Inactive')
      .build();
    statusRange.setDataValidation(statusRule);

    // Add checkbox validations for boolean columns
    const boolRange = sheet.getRange(DATA_START_ROW, 12, 1000, 3);
    try { boolRange.insertCheckboxes(); } catch (e) { /* older Apps Script? ignore */ }
    
    Logger.log('Sheet initialized successfully');
    return { success: true };
  } catch (error) {
    Logger.log('Error initializing sheet: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Attempt to migrate an older sheet schema to the latest headers
 */
function tryMigrateSheet(sheet) {
  try {
    const existingHeadersRow = sheet.getRange(HEADER_ROW, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
    const oldHeaders = [
      'Emp Id', 'First Name', 'Last Name', 'Phone', 'Email',
      'Position', 'Status', 'Note', 'Photo URL', 'Created Date', 'Last Modified'
    ];
    const existingFirst11 = existingHeadersRow.slice(0, oldHeaders.length);
    const isOldSchema = oldHeaders.every((h, i) => existingFirst11[i] === h);
    if (!isOldSchema) {
      return false;
    }
    // Append new headers in place
    const newHeaderValues = [HEADERS];
    sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length).setValues(newHeaderValues);
    // Set widths for new columns
    sheet.setColumnWidth(12, 100);
    sheet.setColumnWidth(13, 150);
    sheet.setColumnWidth(14, 80);
    // Add checkbox validations for boolean columns
    const lastRow = sheet.getLastRow();
    const numRows = Math.max(1000, lastRow - HEADER_ROW);
    const boolRange = sheet.getRange(DATA_START_ROW, 12, numRows, 3);
    try { boolRange.insertCheckboxes(); } catch (e) { /* ignore */ }
    Logger.log('Migrated sheet headers to latest schema');
    return true;
  } catch (e) {
    Logger.log('Migration failed: ' + e.toString());
    return false;
  }
}

/**
 * Get system information and verify connection
 */
function getSystemInfo() {
  try {
    const props = PropertiesService.getScriptProperties();
    let sheetId = props.getProperty('CRM_SHEET_ID');
    
    let sheetAccessible = false;
    try {
      if (sheetId) {
        const sheet = SpreadsheetApp.openById(sheetId);
        sheetAccessible = !!sheet;
      }
    } catch (e) {
      Logger.log('Sheet access test failed: ' + e.toString());
    }
    
    if (!sheetAccessible) {
      try {
        getCRMSheet();
        sheetId = props.getProperty('CRM_SHEET_ID');
        sheetAccessible = true;
      } catch (e) {
        Logger.log('Sheet creation failed: ' + e.toString());
      }
    }
    
    const userEmail = Session.getActiveUser().getEmail();
    const scriptTimeZone = Session.getScriptTimeZone();
    
    return {
      success: true,
      info: {
        scriptId: ScriptApp.getScriptId(),
        sheetId: sheetId,
        sheetAccessible: sheetAccessible,
        timezone: scriptTimeZone,
        userEmail: userEmail,
        lastSync: new Date().toISOString(),
        version: '2.0',
        positionsCount: DEFAULT_POSITIONS.length
      }
    };
  } catch (error) {
    Logger.log('Error in getSystemInfo: ' + error.toString());
    return { 
      success: false, 
      error: error.toString(),
      info: {
        scriptId: ScriptApp.getScriptId() || 'unknown',
        sheetAccessible: false,
        version: '2.0'
      }
    };
  }
}

/**
 * Get the Google Sheet URL
 */
function getSheetUrl() {
  try {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty('CRM_SHEET_ID');
    
    if (sheetId) {
      return { 
        success: true, 
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
      };
    } else {
      const sheet = getCRMSheet();
      const newSheetId = props.getProperty('CRM_SHEET_ID');
      return { 
        success: true, 
        url: `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`
      };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Ensure all required sheets and headers are created and aligned
 */
function ensureAllSheets() {
  try {
    // Ensure main CRM sheet exists and headers are valid/migrated
    const crmSheet = getCRMSheet();
    // Re-apply boolean checkbox validations defensively
    try {
      const lastRow = Math.max(2, crmSheet.getLastRow());
      const boolRange = crmSheet.getRange(DATA_START_ROW, 12, Math.max(1000, lastRow - 1), 3);
      boolRange.insertCheckboxes();
    } catch (e) { /* ignore */ }

    // Ensure positions config
    getPositionsSheet();

    // Ensure skills config and skills data sheets
    getSkillsConfigSheet();
    getSkillsSheet();
    // Ensure Shifts sheet
    getShiftsSheet();

    return { success: true, message: 'All sheets ensured and aligned.' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all employees from the sheet with enhanced error handling
 */
function getAllEmployees() {
  try {
    Logger.log('getAllEmployees: Starting to load employees...');
    
    const sheet = getCRMSheet();
    const lastRow = sheet.getLastRow();
    
    Logger.log(`getAllEmployees: Sheet has ${lastRow} rows total`);
    
    if (lastRow < DATA_START_ROW) {
      Logger.log('getAllEmployees: No data rows found, returning empty array');
      return { success: true, employees: [], message: 'No employees found - ready to add data!' };
    }
    
    const dataRange = sheet.getRange(DATA_START_ROW, 1, lastRow - HEADER_ROW, HEADERS.length);
    const values = dataRange.getValues();
    
    Logger.log(`getAllEmployees: Retrieved ${values.length} data rows`);
    
    const employees = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    values.forEach((row, index) => {
      try {
        if (!row[0] || row[0].toString().trim() === '') {
          skippedCount++;
          return;
        }
        
        const employee = {
          empId: row[0] ? row[0].toString().trim() : '',
          firstName: row[1] ? row[1].toString().trim() : '',
          lastName: row[2] ? row[2].toString().trim() : '',
          phone: row[3] ? row[3].toString().trim() : '',
          email: row[4] ? row[4].toString().trim() : '',
          position: row[5] ? row[5].toString().trim() : '',
          status: row[6] ? row[6].toString().trim() : 'Active',
          note: row[7] ? row[7].toString().trim() : '',
          photoUrl: row[8] ? row[8].toString().trim() : '',
          createdDate: formatDateForDisplay(row[9]),
          lastModified: formatDateForDisplay(row[10]),
          isManager: !!row[11],
          isAssistantManager: !!row[12],
          isMe: !!row[13]
        };
        
        employees.push(employee);
        processedCount++;
      } catch (rowError) {
        Logger.log(`Error processing row ${index + DATA_START_ROW}: ${rowError.toString()}`);
        skippedCount++;
      }
    });
    
    Logger.log(`getAllEmployees: Successfully processed ${processedCount} employees, skipped ${skippedCount} rows`);
    
    return { 
      success: true, 
      employees: employees,
      message: `Loaded ${employees.length} employees from Google Sheets`
    };
    
  } catch (error) {
    Logger.log('Critical error in getAllEmployees: ' + error.toString());
    return { 
      success: false, 
      error: `Failed to load employees: ${error.toString()}`,
      employees: []
    };
  }
}

/**
 * Save all employees to the sheet with enhanced validation and fixed date handling
 */
function saveAllEmployees(employees) {
  try {
    Logger.log(`saveAllEmployees: Starting to save ${employees ? employees.length : 0} employees`);
    
    if (!Array.isArray(employees)) {
      throw new Error('Invalid data format: employees must be an array');
    }
    
    const sheet = getCRMSheet();
    const now = new Date();
    
    // Validate and clean each employee record
    const validEmployees = [];
    const errors = [];
    
    employees.forEach((emp, index) => {
      try {
        if (!emp || typeof emp !== 'object') {
          errors.push(`Employee ${index + 1}: Invalid employee object`);
          return;
        }
        
        if (!emp.empId || emp.empId.toString().trim() === '') {
          errors.push(`Employee ${index + 1}: Employee ID is required`);
          return;
        }
        
        // Parse dates safely
        let createdDate = safeParseDate(emp.createdDate);
        let lastModified = safeParseDate(emp.lastModified);
        
        // If dates are invalid, use defaults
        if (!createdDate) {
          createdDate = now;
        }
        if (!lastModified) {
          lastModified = now;
        }
        
        const cleanEmployee = {
          empId: emp.empId.toString().trim(),
          firstName: (emp.firstName || '').toString().trim(),
          lastName: (emp.lastName || '').toString().trim(),
          phone: (emp.phone || '').toString().trim(),
          email: (emp.email || '').toString().trim(),
          position: (emp.position || '').toString().trim(),
          status: (emp.status || 'Active').toString().trim(),
          note: (emp.note || '').toString().trim(),
          photoUrl: (emp.photoUrl || '').toString().trim(),
          createdDate: createdDate,
          lastModified: lastModified,
          isManager: !!emp.isManager,
          isAssistantManager: !!emp.isAssistantManager,
          isMe: !!emp.isMe
        };
        
        validEmployees.push(cleanEmployee);
      } catch (empError) {
        errors.push(`Employee ${index + 1}: ${empError.toString()}`);
      }
    });
    
    if (errors.length > 0) {
      Logger.log('Validation errors found: ' + errors.join('; '));
      if (validEmployees.length === 0) {
        return { 
          success: false, 
          error: 'No valid employees to save. Errors: ' + errors.join('; ')
        };
      }
    }
    
    // Check for duplicate Employee IDs
    const empIds = new Set();
    const duplicates = [];
    validEmployees.forEach(emp => {
      if (empIds.has(emp.empId)) {
        duplicates.push(emp.empId);
      } else {
        empIds.add(emp.empId);
      }
    });
    
    if (duplicates.length > 0) {
      return {
        success: false,
        error: `Duplicate Employee IDs found: ${duplicates.join(', ')}`
      };
    }
    
    // Clear existing data (keep headers)
    try {
      const lastRow = sheet.getLastRow();
      if (lastRow >= DATA_START_ROW) {
        const clearRange = sheet.getRange(DATA_START_ROW, 1, lastRow - HEADER_ROW + 1, HEADERS.length);
        clearRange.clear();
        Logger.log(`Cleared ${lastRow - HEADER_ROW + 1} existing rows`);
      }
    } catch (clearError) {
      Logger.log('Error clearing existing data: ' + clearError.toString());
    }
    
    if (validEmployees.length > 0) {
      // Prepare data rows with proper Date objects
      const dataRows = validEmployees.map(emp => [
        emp.empId,
        emp.firstName,
        emp.lastName,
        emp.phone,
        emp.email,
        emp.position,
        emp.status,
        emp.note,
        emp.photoUrl,
        emp.createdDate,  // This is already a Date object
        emp.lastModified, // This is already a Date object
        emp.isManager,
        emp.isAssistantManager,
        emp.isMe
      ]);
      
      try {
        const range = sheet.getRange(DATA_START_ROW, 1, dataRows.length, HEADERS.length);
        range.setValues(dataRows);
        
        // Format date columns
        const createdDateRange = sheet.getRange(DATA_START_ROW, 10, dataRows.length, 1);
        const lastModifiedRange = sheet.getRange(DATA_START_ROW, 11, dataRows.length, 1);
        createdDateRange.setNumberFormat('MM/dd/yyyy hh:mm:ss');
        lastModifiedRange.setNumberFormat('MM/dd/yyyy hh:mm:ss');
        
        Logger.log(`Successfully wrote ${dataRows.length} rows to sheet`);
      } catch (writeError) {
        throw new Error(`Failed to write data to sheet: ${writeError.toString()}`);
      }
    }
    
    let message = `Successfully saved ${validEmployees.length} employees to Google Sheets`;
    if (errors.length > 0) {
      message += `. Note: ${errors.length} records had validation issues.`;
    }
    
    Logger.log(message);
    return { 
      success: true, 
      message: message,
      saved: validEmployees.length,
      errors: errors.length
    };
    
  } catch (error) {
    const errorMessage = `Failed to save employees: ${error.toString()}`;
    Logger.log('Critical error in saveAllEmployees: ' + errorMessage);
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

/**
 * Sync data from sheet (refresh from source)
 */
function syncFromSheet() {
  try {
    const result = getAllEmployees();
    if (result.success) {
      return { 
        success: true, 
        employees: result.employees,
        message: `Synced ${result.employees.length} employees from sheet`
      };
    } else {
      return result;
    }
  } catch (error) {
    Logger.log('Error in syncFromSheet: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Get positions list with icons
 */
function getPositionsList() {
  try {
    Logger.log('getPositionsList: Loading positions...');
    
    const posSheet = getPositionsSheet();
    
    if (!posSheet) {
      Logger.log('getPositionsList: No positions sheet found, returning defaults');
      return { 
        success: true, 
        positions: DEFAULT_POSITIONS,
        message: 'Using default positions'
      };
    }
    
    const lastRow = posSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('getPositionsList: Positions sheet empty, returning defaults');
      return { 
        success: true, 
        positions: DEFAULT_POSITIONS,
        message: 'No custom positions found, using defaults'
      };
    }
    
    const dataRange = posSheet.getRange(2, 1, lastRow - 1, 2);
    const values = dataRange.getValues();
    
    const positions = [];
    values.forEach((row, index) => {
      if (row[0] && row[0].toString().trim() !== '') {
        positions.push({
          name: row[0].toString().trim(),
          icon: row[1] ? row[1].toString().trim() : '📋'
        });
      }
    });
    
    if (positions.length === 0) {
      Logger.log('getPositionsList: No valid custom positions, returning defaults');
      return { 
        success: true, 
        positions: DEFAULT_POSITIONS,
        message: 'No valid custom positions found, using defaults'
      };
    }
    
    Logger.log(`getPositionsList: Loaded ${positions.length} custom positions`);
    return { 
      success: true, 
      positions: positions,
      message: `Loaded ${positions.length} custom positions`
    };
    
  } catch (error) {
    Logger.log('Error in getPositionsList: ' + error.toString());
    return { 
      success: true, 
      positions: DEFAULT_POSITIONS,
      message: 'Error loading custom positions, using defaults',
      error: error.toString()
    };
  }
}

/**
 * Save positions list
 */
function savePositionsList(positions) {
  try {
    Logger.log(`savePositionsList: Saving ${positions ? positions.length : 0} positions`);
    
    if (!Array.isArray(positions)) {
      throw new Error('Positions must be an array');
    }
    
    const posSheet = getPositionsSheet();
    
    if (!posSheet) {
      throw new Error('Could not access positions configuration sheet');
    }
    
    const lastRow = posSheet.getLastRow();
    if (lastRow > 1) {
      const clearRange = posSheet.getRange(2, 1, lastRow - 1, 2);
      clearRange.clear();
    }
    
    if (positions && positions.length > 0) {
      const positionData = positions.map(pos => {
        if (typeof pos === 'string') {
          return [pos, '📋'];
        } else if (pos && typeof pos === 'object') {
          return [
            (pos.name || pos).toString().trim(),
            (pos.icon || '📋').toString().trim()
          ];
        } else {
          return ['Unknown Position', '📋'];
        }
      });
      
      if (positionData.length > 0) {
        const range = posSheet.getRange(2, 1, positionData.length, 2);
        range.setValues(positionData);
        Logger.log(`Saved ${positionData.length} positions to sheet`);
      }
    }
    
    return { 
      success: true, 
      message: `Successfully saved ${positions ? positions.length : 0} positions`,
      count: positions ? positions.length : 0
    };
    
  } catch (error) {
    Logger.log('Error in savePositionsList: ' + error.toString());
    return { 
      success: false, 
      error: `Failed to save positions: ${error.toString()}`
    };
  }
}

/**
 * Get/Set "me" employee ID (for highlighting current user)
 */
function getMeEmployeeId() {
  try {
    const props = PropertiesService.getScriptProperties();
    const empId = props.getProperty('ME_EMPLOYEE_ID') || '';
    return { success: true, empId: empId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function setMeEmployeeId(empId) {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('ME_EMPLOYEE_ID', empId || '');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function clearMeEmployeeId() {
  try {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty('ME_EMPLOYEE_ID');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Enhanced test function to verify complete setup
 */
function testSetup() {
  try {
    Logger.log('=== TESTING BAR OPERATIONS SETUP (Employees + Shifts) ===');
    
    const results = {
      success: true,
      tests: {},
      details: {},
      errors: []
    };
    
    // Test 1: Sheet creation/access
    try {
      Logger.log('Test 1: Testing sheet access...');
      const sheet = getCRMSheet();
      const sheetId = PropertiesService.getScriptProperties().getProperty('CRM_SHEET_ID');
      results.tests.sheetAccess = true;
      results.details.sheetId = sheetId;
      Logger.log('✓ Sheet access successful - ID: ' + sheetId);
    } catch (e) {
      results.tests.sheetAccess = false;
      results.errors.push('Sheet access failed: ' + e.toString());
      results.success = false;
      Logger.log('✗ Sheet access failed: ' + e.toString());
    }
    
    // Test 2: System info
    try {
      Logger.log('Test 2: Testing system info...');
      const sysInfo = getSystemInfo();
      results.tests.systemInfo = sysInfo.success;
      results.details.systemInfo = sysInfo.info;
      Logger.log('✓ System info retrieved successfully');
    } catch (e) {
      results.tests.systemInfo = false;
      results.errors.push('System info failed: ' + e.toString());
      Logger.log('✗ System info failed: ' + e.toString());
    }
    
    // Test 3: Positions loading
    try {
      Logger.log('Test 3: Testing positions...');
      const positions = getPositionsList();
      results.tests.positions = positions.success;
      results.details.positionsCount = positions.positions ? positions.positions.length : 0;
      Logger.log('✓ Positions loaded: ' + results.details.positionsCount);
    } catch (e) {
      results.tests.positions = false;
      results.errors.push('Positions loading failed: ' + e.toString());
      Logger.log('✗ Positions loading failed: ' + e.toString());
    }
    
    // Test 4: Employee data operations
    try {
      Logger.log('Test 4: Testing employee data operations...');
      const employees = getAllEmployees();
      results.tests.employeeData = employees.success;
      results.details.employeeCount = employees.employees ? employees.employees.length : 0;
      Logger.log('✓ Employee data operations successful - Count: ' + results.details.employeeCount);
    } catch (e) {
      results.tests.employeeData = false;
      results.errors.push('Employee data operations failed: ' + e.toString());
      Logger.log('✗ Employee data operations failed: ' + e.toString());
    }
    
    // Test 5: User preferences
    try {
      Logger.log('Test 5: Testing user preferences...');
      const meResult = getMeEmployeeId();
      results.tests.userPrefs = meResult.success;
      results.details.meEmployeeId = meResult.empId || 'Not set';
      Logger.log('✓ User preferences working - Me ID: ' + results.details.meEmployeeId);
    } catch (e) {
      results.tests.userPrefs = false;
      results.errors.push('User preferences failed: ' + e.toString());
      Logger.log('✗ User preferences failed: ' + e.toString());
    }
    
    // Test 6: Sheet URL access
    try {
      Logger.log('Test 6: Testing sheet URL access...');
      const urlResult = getSheetUrl();
      results.tests.sheetUrl = urlResult.success;
      results.details.sheetUrl = urlResult.url;
      Logger.log('✓ Sheet URL access successful');
    } catch (e) {
      results.tests.sheetUrl = false;
      results.errors.push('Sheet URL access failed: ' + e.toString());
      Logger.log('✗ Sheet URL access failed: ' + e.toString());
    }
    
    // Test 7: Date handling
    try {
      Logger.log('Test 7: Testing date handling...');
      const testDate = new Date();
      const parsedDate = safeParseDate(testDate.toISOString());
      const formattedDate = formatDateForDisplay(testDate);
      results.tests.dateHandling = !!parsedDate && !!formattedDate;
      results.details.dateHandling = {
        originalDate: testDate.toISOString(),
        parsedDate: parsedDate ? parsedDate.toISOString() : null,
        formattedDate: formattedDate
      };
      Logger.log('✓ Date handling working correctly');
    } catch (e) {
      results.tests.dateHandling = false;
      results.errors.push('Date handling failed: ' + e.toString());
      Logger.log('✗ Date handling failed: ' + e.toString());
    }
    
    // Shifts domain
    try {
      const shiftsSheet = getShiftsSheet();
      results.tests.shiftsSheet = !!shiftsSheet;
      let shifts = getAllShifts();
      results.tests.shiftsRead = Array.isArray(shifts);
      results.details.shiftCount = results.tests.shiftsRead ? shifts.length : 0;
    } catch (e) {
      results.tests.shiftsSheet = false;
      results.tests.shiftsRead = false;
      results.errors.push('Shifts domain failed: ' + e.toString());
    }

    // Final summary
    const passedTests = Object.values(results.tests).filter(test => test === true).length;
    const totalTests = Object.keys(results.tests).length;
    results.details.testSummary = `${passedTests}/${totalTests} tests passed`;
    results.details.timestamp = new Date().toISOString();
    results.success = passedTests === totalTests;
    results.message = results.success
      ? `Setup test completed successfully! All ${totalTests} tests passed.`
      : `Setup test completed with issues. ${passedTests}/${totalTests} tests passed.`;
    return results;
    
  } catch (error) {
    Logger.log('CRITICAL ERROR in testSetup: ' + error.toString());
    return { 
      success: false, 
      error: 'Critical test failure: ' + error.toString(),
      message: 'Setup test failed to complete',
      details: { timestamp: new Date().toISOString() }
    };
  }
}

/**
 * Quick connectivity test (lighter version)
 */
function testConnection() {
  try {
    const sheet = getCRMSheet();
    const sysInfo = getSystemInfo();
    
    return {
      success: true,
      message: 'Connection test passed',
      details: {
        sheetAccessible: !!sheet,
        systemInfoAvailable: sysInfo.success,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Connection test failed'
    };
  }
}

/**
 * Initialize sample data (for new installations)
 */
function initializeSampleData() {
  try {
    Logger.log('Initializing sample data...');
    
    // Check if data already exists
    const existing = getAllEmployees();
    if (existing.success && existing.employees && existing.employees.length > 0) {
      return {
        success: false,
        message: 'Sample data not added - existing employees found',
        existingCount: existing.employees.length
      };
    }
    
    // Sample employees with proper date handling
    const now = new Date().toISOString();
    const sampleEmployees = [
      {
        empId: 'MGR001',
        firstName: 'Alex',
        lastName: 'Johnson',
        phone: '(555) 123-4567',
        email: 'alex.johnson@yourbar.com',
        position: 'Manager',
        status: 'Active',
        note: 'Bar manager with 8+ years experience',
        photoUrl: '',
        createdDate: now,
        lastModified: now
      },
      {
        empId: 'BTD001',
        firstName: 'Sarah',
        lastName: 'Martinez',
        phone: '(555) 987-6543',
        email: 'sarah.martinez@yourbar.com',
        position: 'Bartender',
        status: 'Active',
        note: 'Expert mixologist, specializes in craft cocktails',
        photoUrl: '',
        createdDate: now,
        lastModified: now
      },
      {
        empId: 'SRV001',
        firstName: 'Mike',
        lastName: 'Chen',
        phone: '(555) 456-7890',
        email: 'mike.chen@yourbar.com',
        position: 'Server',
        status: 'Active',
        note: 'Excellent customer service, knows wine pairings',
        photoUrl: '',
        createdDate: now,
        lastModified: now
      }
    ];
    
    const saveResult = saveAllEmployees(sampleEmployees);
    
    if (saveResult.success) {
      Logger.log('Sample data initialized successfully');
      return {
        success: true,
        message: 'Sample data added successfully',
        sampleCount: sampleEmployees.length
      };
    } else {
      return {
        success: false,
        message: 'Failed to add sample data',
        error: saveResult.error
      };
    }
    
  } catch (error) {
    Logger.log('Error initializing sample data: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to initialize sample data'
    };
  }
}

/**
 * Backup and restore functions
 */
function createBackup() {
  try {
    Logger.log('Creating backup...');
    
    const employees = getAllEmployees();
    const positions = getPositionsList();
    const sysInfo = getSystemInfo();
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      employees: employees.success ? employees.employees : [],
      positions: positions.success ? positions.positions : DEFAULT_POSITIONS,
      systemInfo: sysInfo.success ? sysInfo.info : {},
      employeeCount: employees.success ? employees.employees.length : 0,
      positionsCount: positions.success ? positions.positions.length : 0
    };
    
    // Save backup to script properties (for recent backup)
    try {
      const props = PropertiesService.getScriptProperties();
      props.setProperty('LAST_BACKUP', JSON.stringify({
        timestamp: backup.timestamp,
        employeeCount: backup.employeeCount,
        success: true
      }));
    } catch (propsError) {
      Logger.log('Warning: Could not save backup info to properties: ' + propsError.toString());
    }
    
    Logger.log(`Backup created successfully - ${backup.employeeCount} employees, ${backup.positionsCount} positions`);
    
    return {
      success: true,
      backup: backup,
      message: `Backup created with ${backup.employeeCount} employees and ${backup.positionsCount} positions`
    };
    
  } catch (error) {
    Logger.log('Error creating backup: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to create backup'
    };
  }
}

function getLastBackupInfo() {
  try {
    const props = PropertiesService.getScriptProperties();
    const backupInfo = props.getProperty('LAST_BACKUP');
    
    if (backupInfo) {
      const info = JSON.parse(backupInfo);
      return { success: true, backupInfo: info };
    } else {
      return { success: false, message: 'No backup information found' };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Advanced sheet management
 */
function repairSheet() {
  try {
    Logger.log('Starting sheet repair...');
    
    const sheet = getCRMSheet();
    
    // Verify and fix headers
    const headerRange = sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length);
    const currentHeaders = headerRange.getValues()[0];
    
    let headersFixed = false;
    HEADERS.forEach((expectedHeader, index) => {
      if (currentHeaders[index] !== expectedHeader) {
        Logger.log(`Fixing header ${index + 1}: "${currentHeaders[index]}" -> "${expectedHeader}"`);
        sheet.getRange(HEADER_ROW, index + 1).setValue(expectedHeader);
        headersFixed = true;
      }
    });
    
    // Re-apply header formatting
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // Check and fix column widths
    const columnWidths = [100, 120, 120, 140, 180, 200, 80, 250, 200, 120, 120];
    columnWidths.forEach((width, index) => {
      sheet.setColumnWidth(index + 1, width);
    });
    
    // Re-apply data validation
    const statusRange = sheet.getRange(DATA_START_ROW, 7, 1000, 1);
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Inactive'])
      .setAllowInvalid(false)
      .setHelpText('Select Active or Inactive')
      .build();
    statusRange.setDataValidation(statusRule);
    
    sheet.setFrozenRows(1);
    
    Logger.log('Sheet repair completed');
    
    return {
      success: true,
      message: 'Sheet repair completed successfully',
      headersFixed: headersFixed
    };
    
  } catch (error) {
    Logger.log('Error repairing sheet: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      message: 'Sheet repair failed'
    };
  }
}

/**
 * Upload employee photo
 */
function uploadEmployeePhoto(dataUrl, fileName, empId) {
  try {
    // Get or create photos folder
    let photosFolder;
    const folders = DriveApp.getFoldersByName(PHOTOS_FOLDER_NAME);
    
    if (folders.hasNext()) {
      photosFolder = folders.next();
    } else {
      photosFolder = DriveApp.createFolder(PHOTOS_FOLDER_NAME);
    }
    
    // Extract base64 data
    const base64Data = dataUrl.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg');
    
    // Create unique filename
    const timestamp = new Date().getTime();
    const cleanEmpId = empId.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${cleanEmpId}_${timestamp}_${fileName}`;
    
    // Delete existing photos for this employee
    const existingFiles = photosFolder.getFilesByName(cleanEmpId);
    while (existingFiles.hasNext()) {
      const file = existingFiles.next();
      if (file.getName().startsWith(cleanEmpId + '_')) {
        photosFolder.removeFile(file);
      }
    }
    
    // Upload new photo
    const file = photosFolder.createFile(blob.setName(uniqueFileName));
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the public URL
    const photoUrl = `https://drive.google.com/uc?id=${file.getId()}`;
    
    Logger.log(`Uploaded photo for employee ${empId}: ${photoUrl}`);
    return { success: true, url: photoUrl };
  } catch (error) {
    Logger.log('Error uploading photo: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Backup data (export to JSON)
 */
function exportBackup() {
  try {
    const employeesResult = getAllEmployees();
    const positionsResult = getPositionsList();
    
    if (!employeesResult.success) {
      throw new Error('Failed to get employees data');
    }
    
    const backup = {
      timestamp: new Date().toISOString(),
      employees: employeesResult.employees || [],
      positions: positionsResult.success ? positionsResult.positions : DEFAULT_POSITIONS,
      version: '2.0'
    };
    
    return { success: true, backup: backup };
  } catch (error) {
    Logger.log('Error creating backup: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Clean up old photo files (run periodically)
 */
function cleanupOldPhotos() {
  try {
    const folders = DriveApp.getFoldersByName(PHOTOS_FOLDER_NAME);
    if (!folders.hasNext()) {
      return { success: true, message: 'No photos folder found' };
    }
    
    const photosFolder = folders.next();
    const files = photosFolder.getFiles();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months ago
    
    let deletedCount = 0;
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDateCreated() < cutoffDate) {
        photosFolder.removeFile(file);
        deletedCount++;
      }
    }
    
    Logger.log(`Cleaned up ${deletedCount} old photo files`);
    return { success: true, message: `Deleted ${deletedCount} old files` };
  } catch (error) {
    Logger.log('Error cleaning up photos: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * =============================
 * Shifts Domain (Unified Spreadsheet)
 * =============================
 */

function getShiftsSheet() {
  const ss = getAppSpreadsheet();
  let sheet = ss.getSheetByName(SHIFTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHIFTS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 10).setValues([[
      'ID', 'Date', 'Start Time', 'End Time', 'Hours', 'Location', 'Tips', 'Tips/Hour', 'Notes', 'Created'
    ]]);
    const headerRange = sheet.getRange(1, 1, 1, 10);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#34495e');
    headerRange.setFontColor('white');
  }
  return sheet;
}

function calculateHours(date, startTime, endTime) {
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);
  if (endDateTime < startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);
  return (endDateTime - startDateTime) / (1000 * 60 * 60);
}

function getAllShifts() {
  try {
    const sheet = getShiftsSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    const data = sheet.getRange(1, 1, lastRow, 10).getValues();
    const shifts = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1] && !row[2]) continue;
      let dateValue = row[1];
      if (dateValue instanceof Date) {
        dateValue = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('T')) dateValue = dateValue.split('T')[0];
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            const month = String(parts[0]).padStart(2, '0');
            const day = String(parts[1]).padStart(2, '0');
            const year = parts[2];
            dateValue = `${year}-${month}-${day}`;
          }
        }
      } else if (typeof dateValue === 'number') {
        const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
        dateValue = Utilities.formatDate(excelDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      let startTime = row[2];
      let endTime = row[3];
      if (startTime instanceof Date) {
        const h = String(startTime.getHours()).padStart(2, '0');
        const m = String(startTime.getMinutes()).padStart(2, '0');
        startTime = `${h}:${m}`;
      } else if (typeof startTime === 'string') {
        if (startTime.includes('T')) startTime = startTime.split('T')[1].substring(0, 5);
        if (startTime.length === 4) startTime = '0' + startTime;
      } else if (typeof startTime === 'number') {
        const totalMinutes = Math.round(startTime * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      if (endTime instanceof Date) {
        const h2 = String(endTime.getHours()).padStart(2, '0');
        const m2 = String(endTime.getMinutes()).padStart(2, '0');
        endTime = `${h2}:${m2}`;
      } else if (typeof endTime === 'string') {
        if (endTime.includes('T')) endTime = endTime.split('T')[1].substring(0, 5);
        if (endTime.length === 4) endTime = '0' + endTime;
      } else if (typeof endTime === 'number') {
        const totalMinutes2 = Math.round(endTime * 24 * 60);
        const hours2 = Math.floor(totalMinutes2 / 60);
        const minutes2 = totalMinutes2 % 60;
        endTime = `${String(hours2).padStart(2, '0')}:${String(minutes2).padStart(2, '0')}`;
      }
      const shift = {
        id: String(row[0] || ''),
        date: String(dateValue || ''),
        startTime: String(startTime || ''),
        endTime: String(endTime || ''),
        hours: Number(parseFloat(row[4]) || 0),
        location: String(row[5] || ''),
        tips: Number(parseFloat(row[6]) || 0),
        tipsPerHour: Number(parseFloat(row[7]) || 0),
        notes: String(row[8] || ''),
        created: row[9] ? String(row[9]) : ''
      };
      shifts.push(shift);
    }
    shifts.sort((a, b) => {
      try { return new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`); } catch (e) { return 0; }
    });
    return JSON.parse(JSON.stringify(shifts));
  } catch (error) {
    Logger.log('Error getting shifts: ' + error.toString());
    return [];
  }
}

function addShift(shiftData) {
  try {
    if (!shiftData.date || !shiftData.startTime || !shiftData.endTime) throw new Error('Missing required fields: date, startTime, or endTime');
    const sheet = getShiftsSheet();
    const hours = calculateHours(shiftData.date, shiftData.startTime, shiftData.endTime);
    const tipsPerHour = hours > 0 ? (shiftData.tips / hours) : 0;
    const rowData = [
      shiftData.id || generateId(),
      shiftData.date,
      shiftData.startTime,
      shiftData.endTime,
      parseFloat(hours.toFixed(2)),
      shiftData.location || '',
      parseFloat(shiftData.tips) || 0,
      parseFloat(tipsPerHour.toFixed(2)),
      shiftData.notes || '',
      new Date().toISOString()
    ];
    sheet.appendRow(rowData);
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 7).setNumberFormat('$#,##0.00');
    sheet.getRange(lastRow, 8).setNumberFormat('$#,##0.00');
    return { success: true, id: rowData[0] };
  } catch (error) {
    Logger.log('Error adding shift: ' + error.toString());
    throw new Error('Failed to add shift: ' + error.message);
  }
}

function updateShift(shiftData) {
  try {
    if (!shiftData.id) throw new Error('Shift ID is required for updates');
    const sheet = getShiftsSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(shiftData.id)) {
        const hours = calculateHours(shiftData.date, shiftData.startTime, shiftData.endTime);
        const tipsPerHour = hours > 0 ? (shiftData.tips / hours) : 0;
        const rowData = [
          shiftData.id,
          shiftData.date,
          shiftData.startTime,
          shiftData.endTime,
          parseFloat(hours.toFixed(2)),
          shiftData.location || '',
          parseFloat(shiftData.tips) || 0,
          parseFloat(tipsPerHour.toFixed(2)),
          shiftData.notes || '',
          data[i][9]
        ];
        sheet.getRange(i + 1, 1, 1, 10).setValues([rowData]);
        sheet.getRange(i + 1, 7).setNumberFormat('$#,##0.00');
        sheet.getRange(i + 1, 8).setNumberFormat('$#,##0.00');
        return { success: true };
      }
    }
    throw new Error('Shift not found with ID: ' + shiftData.id);
  } catch (error) {
    Logger.log('Error updating shift: ' + error.toString());
    throw new Error('Failed to update shift: ' + error.message);
  }
}

function deleteShift(shiftId) {
  try {
    if (!shiftId) throw new Error('Shift ID is required for deletion');
    const sheet = getShiftsSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(shiftId)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    throw new Error('Shift not found with ID: ' + shiftId);
  } catch (error) {
    Logger.log('Error deleting shift: ' + error.toString());
    throw new Error('Failed to delete shift: ' + error.message);
  }
}

function getShiftStats() {
  try {
    const shifts = getAllShifts();
    if (shifts.length === 0) return { totalShifts: 0, totalHours: 0, totalTips: 0, averageTipsPerHour: 0 };
    const totalTips = shifts.reduce((sum, shift) => sum + parseFloat(shift.tips || 0), 0);
    const totalHours = shifts.reduce((sum, shift) => sum + parseFloat(shift.hours || 0), 0);
    const averageTipsPerHour = totalHours > 0 ? (totalTips / totalHours) : 0;
    return {
      totalShifts: shifts.length,
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalTips: parseFloat(totalTips.toFixed(2)),
      averageTipsPerHour: parseFloat(averageTipsPerHour.toFixed(2))
    };
  } catch (error) {
    Logger.log('Error getting stats: ' + error.toString());
    throw new Error('Failed to get statistics: ' + error.message);
  }
}

function generateId() {
  return 'shift_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Function Catalog
 */
function getFunctionCatalog() {
  return [
    { name: 'doGet', description: 'Serves HTML pages: landing, employee, shift' },
    { name: 'include', description: 'Includes HTML partials into templates' },
    { name: 'getSystemInfo', description: 'Returns environment and spreadsheet info' },
    { name: 'getSheetUrl', description: 'Returns URL of shared spreadsheet' },
    { name: 'ensureAllSheets', description: 'Ensures CRM, Positions, Skills, Shifts sheets exist' },
    { name: 'getAllEmployees', description: 'Reads employee rows from CRM sheet' },
    { name: 'saveAllEmployees', description: 'Writes employee rows to CRM sheet' },
    { name: 'syncFromSheet', description: 'Fetches fresh employee data' },
    { name: 'getPositionsList', description: 'Returns positions with icons' },
    { name: 'savePositionsList', description: 'Saves positions with icons' },
    { name: 'getMeEmployeeId', description: 'Gets the "me" employee ID' },
    { name: 'setMeEmployeeId', description: 'Sets the "me" employee ID' },
    { name: 'clearMeEmployeeId', description: 'Clears the "me" employee ID' },
    { name: 'getSkillsSheet', description: 'Ensures/returns the employee skills sheet' },
    { name: 'getSkillsConfigSheet', description: 'Ensures/returns the skills config sheet' },
    { name: 'getSkillCategories', description: 'Lists skill categories, descriptions, weights' },
    { name: 'getEmployeeSkills', description: 'Gets per-employee skill ratings' },
    { name: 'saveEmployeeSkills', description: 'Saves per-employee skill ratings' },
    { name: 'getShiftsSheet', description: 'Ensures/returns Shifts sheet in shared spreadsheet' },
    { name: 'calculateHours', description: 'Calculates hours between start and end times' },
    { name: 'getAllShifts', description: 'Returns array of shifts' },
    { name: 'addShift', description: 'Appends a new shift' },
    { name: 'updateShift', description: 'Updates a shift by ID' },
    { name: 'deleteShift', description: 'Deletes a shift by ID' },
    { name: 'getShiftStats', description: 'Aggregates tips and hours' },
    { name: 'generateId', description: 'Generates unique shift IDs' },
    { name: 'uploadEmployeePhoto', description: 'Uploads employee photo to Drive' },
    { name: 'createBackup', description: 'Creates a JSON backup snapshot' },
    { name: 'getLastBackupInfo', description: 'Returns last backup summary' },
    { name: 'repairSheet', description: 'Repairs headers/validation on CRM sheet' },
    { name: 'exportBackup', description: 'Returns exportable JSON of key data' },
    { name: 'getNavigationUrl', description: 'Generates proper navigation URLs' },
    { name: 'getPageUrls', description: 'Returns all page URLs for navigation' },
    { name: 'getLocationsList', description: 'Returns locations list' },
    { name: 'saveLocationsList', description: 'Saves locations list' },
    { name: 'getBootstrapData', description: 'Returns cached bootstrap data (employees, positions, locations, urls, currentUser)' },
    { name: 'getShiftsPage', description: 'Returns paginated shifts list' }
  ];
}

// ===============================================
// NAVIGATION URL FUNCTIONS (Solution 2)
// ===============================================

/**
 * Generates a proper navigation URL for a target page
 * @param {string} targetPage - The page to navigate to ('landing', 'employee', 'shift')
 * @return {string} The full URL for the target page
 */
function getNavigationUrl(targetPage) {
  const scriptUrl = ScriptApp.getService().getUrl();
  console.log(`[NAV] Generating URL for page: ${targetPage}, base: ${scriptUrl}`);
  
  if (targetPage === 'landing' || !targetPage) {
    return scriptUrl;
  } else {
    return scriptUrl + '?page=' + targetPage;
  }
}

/**
 * Returns all navigation URLs for client-side caching
 * @return {Object} Object containing URLs for all pages
 */
function getPageUrls() {
  const baseUrl = ScriptApp.getService().getUrl();
  const urls = {
    landing: baseUrl,
    employee: baseUrl + '?page=employee',
    shift: baseUrl + '?page=shift',
    coworkers: baseUrl + '?page=coworkers',
    currentUrl: baseUrl
  };
  
  console.log('[NAV] Generated page URLs:', JSON.stringify(urls));
  return urls;
}

/**
 * =============================
 * Locations Management
 * =============================
 */

function getLocationsSheet() {
  const ss = getAppSpreadsheet();
  let sheet = ss.getSheetByName(LOCATIONS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOCATIONS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 1).setValues([['Location']]);
    const headerRange = sheet.getRange(1, 1, 1, 1);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#34495e');
    headerRange.setFontColor('white');
    
    // Add some default locations
    const defaultLocations = [
      ['Main Bar'],
      ['Patio Bar'],
      ['VIP Lounge'],
      ['Downstairs Bar'],
      ['Rooftop Bar']
    ];
    sheet.getRange(2, 1, defaultLocations.length, 1).setValues(defaultLocations);
  }
  return sheet;
}

function getLocationsList() {
  try {
    const sheet = getLocationsSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const locations = data
      .filter(row => row[0] && row[0].toString().trim())
      .map(row => row[0].toString().trim());
    
    return locations;
  } catch (error) {
    Logger.log('Error getting locations: ' + error.toString());
    return [];
  }
}

/**
 * Save locations list (one column, single sheet) similar to positions
 * @param {Array<string>} locations
 */
function saveLocationsList(locations) {
  try {
    if (!Array.isArray(locations)) {
      throw new Error('Locations must be an array of strings');
    }
    const sheet = getLocationsSheet();
    // Clear existing rows below header
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const clearRange = sheet.getRange(2, 1, lastRow - 1, 1);
      clearRange.clear();
    }
    // Normalize and filter
    const cleaned = locations
      .map(function(loc){ return (loc || '').toString().trim(); })
      .filter(function(loc){ return loc.length > 0; });
    if (cleaned.length > 0) {
      const values = cleaned.map(function(loc){ return [loc]; });
      sheet.getRange(2, 1, values.length, 1).setValues(values);
    }
    return { success: true, message: 'Locations saved', count: cleaned.length };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * =============================
 * Bootstrap + Pagination Endpoints
 * =============================
 */

/**
 * Returns consolidated bootstrap data with server-side caching
 * Includes: currentUser, minimal employees, positions, locations, pageUrls, dataVersion
 */
function getBootstrapData() {
  try {
    var scriptProps = PropertiesService.getScriptProperties();
    var version = scriptProps.getProperty('BOOTSTRAP_VERSION') || '1';
    var cache = CacheService.getScriptCache();
    var cacheKey = 'BOOTSTRAP_V' + version;
    var cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    var employeesResult = getAllEmployees();
    var positionsResult = getPositionsList();
    var locationsResult = getLocationsList();
    var pageUrls = getPageUrls();
    var me = getCurrentUser();

    // Project employees to minimal shape for autocompletes
    var minimalEmployees = [];
    if (employeesResult && employeesResult.success && Array.isArray(employeesResult.employees)) {
      minimalEmployees = employeesResult.employees.map(function(e) {
        return {
          empId: String(e.empId || ''),
          firstName: String(e.firstName || ''),
          lastName: String(e.lastName || ''),
          position: String(e.position || '')
        };
      });
    }

    var payload = {
      success: true,
      dataVersion: version,
      currentUser: me,
      employees: minimalEmployees,
      positions: (positionsResult && positionsResult.positions) ? positionsResult.positions : [],
      locations: Array.isArray(locationsResult) ? locationsResult : [],
      pageUrls: pageUrls
    };

    // Cache for 10 minutes
    try {
      cache.put(cacheKey, JSON.stringify(payload), 600);
    } catch (e) {
      // ignore cache failures
    }

    return payload;
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Returns a paginated list of shifts for list view
 * @param {Object} params - { limit: number, offset: number, fromDate?: string, toDate?: string }
 */
function getShiftsPage(params) {
  try {
    params = params || {};
    var limit = Math.max(1, Math.min(200, Number(params.limit) || 50));
    var offset = Math.max(0, Number(params.offset) || 0);
    var fromDate = params.fromDate ? String(params.fromDate) : null;
    var toDate = params.toDate ? String(params.toDate) : null;

    // For now reuse existing reader; consider indexing if this grows
    var all = getAllShifts();

    // Optional date filtering
    if (fromDate || toDate) {
      all = all.filter(function(s) {
        try {
          var d = new Date(s.date + 'T' + (s.startTime || '00:00'));
          if (fromDate && d < new Date(fromDate + 'T00:00')) return false;
          if (toDate && d > new Date(toDate + 'T23:59')) return false;
          return true;
        } catch (e) {
          return true;
        }
      });
    }

    var total = all.length;
    var pageItems = all.slice(offset, offset + limit).map(function(s) {
      return {
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        hours: s.hours,
        location: s.location,
        tips: s.tips,
        tipsPerHour: s.tipsPerHour
        // omit notes to reduce payload size
      };
    });

    return {
      success: true,
      total: total,
      items: pageItems,
      limit: limit,
      offset: offset,
      hasMore: offset + pageItems.length < total
    };
  } catch (error) {
    return { success: false, error: error.toString(), items: [], total: 0, limit: 0, offset: 0, hasMore: false };
  }
}

/**
 * =============================
 * Shift Coworkers Management
 * =============================
 */

function getCoworkersSheet() {
  const ss = getAppSpreadsheet();
  let sheet = ss.getSheetByName(COWORKERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(COWORKERS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 8).setValues([[
      'ID', 'Shift ID', 'Employee ID', 'Name', 'Position', 'Start Time', 'End Time', 'Location'
    ]]);
    const headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#34495e');
    headerRange.setFontColor('white');
  }
  return sheet;
}

function getCoworkersByShiftId(shiftId) {
  try {
    const sheet = getCoworkersSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    const coworkers = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (String(row[1]) === String(shiftId)) {
        coworkers.push({
          id: String(row[0] || ''),
          shiftId: String(row[1] || ''),
          employeeId: String(row[2] || ''),
          name: String(row[3] || ''),
          position: String(row[4] || ''),
          startTime: String(row[5] || ''),
          endTime: String(row[6] || ''),
          location: String(row[7] || '')
        });
      }
    }
    
    return coworkers;
  } catch (error) {
    Logger.log('Error getting coworkers: ' + error.toString());
    return [];
  }
}

function saveCoworkers(shiftId, coworkers) {
  try {
    const sheet = getCoworkersSheet();
    
    // First, delete existing coworkers for this shift
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][1]) === String(shiftId)) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // Then add the new coworkers
    for (const coworker of coworkers) {
      const rowData = [
        coworker.id || generateId(),
        shiftId,
        coworker.employeeId || '',
        coworker.name || '',
        coworker.position || '',
        coworker.startTime || '',
        coworker.endTime || '',
        coworker.location || ''
      ];
      sheet.appendRow(rowData);
    }
    
    return { success: true };
  } catch (error) {
    Logger.log('Error saving coworkers: ' + error.toString());
    throw new Error('Failed to save coworkers: ' + error.message);
  }
}

// Get the current user (me) from employees where "Is Me" is true
function getCurrentUser() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return null;
    
    const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const isMeIndex = HEADERS.indexOf('Is Me');
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row[isMeIndex] === true || row[isMeIndex] === 'TRUE' || row[isMeIndex] === 'Yes') {
        return {
          id: String(row[0] || ''),
          firstName: String(row[1] || ''),
          lastName: String(row[2] || ''),
          name: `${row[1] || ''} ${row[2] || ''}`.trim(),
          position: String(row[5] || ''),
          employeeId: String(row[0] || '')
        };
      }
    }
    
    return null;
  } catch (error) {
    Logger.log('Error getting current user: ' + error.toString());
    return null;
  }
}
