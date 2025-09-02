// Solution 3: Abandon iframe approach - Direct page serving with proper redirects
// This completely replaces the doGet function in Code.gs

function doGet(e) {
  const timestamp = new Date().toISOString();
  console.log(`[DOGET] 🚀 ${timestamp} - Page request received`);
  console.log(`[DOGET] 📊 Request parameters:`, e?.parameter || 'None');
  
  try {
    const pageParam = e && e.parameter ? (e.parameter.page || e.parameter.view) : null;
    const page = pageParam ? String(pageParam) : 'landing';
    console.log(`[DOGET] 📄 Serving page: ${page}`);
    
    // Validate page parameter
    const validPages = ['landing', 'employee', 'shift'];
    if (!validPages.includes(page)) {
      console.log(`[DOGET] ⚠️ Invalid page '${page}', redirecting to landing`);
      // Return a proper redirect response
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Redirecting...</title>
            <script>
              window.location.replace('${ScriptApp.getService().getUrl()}');
            </script>
          </head>
          <body>
            <p>Redirecting to dashboard...</p>
          </body>
        </html>
      `).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Get the base URL for navigation
    const baseUrl = ScriptApp.getService().getUrl();
    
    // Create template and inject navigation URLs
    const template = HtmlService.createTemplateFromFile(page);
    
    // Inject navigation URLs into the template
    template.navigationUrls = {
      landing: baseUrl,
      employee: baseUrl + '?page=employee',
      shift: baseUrl + '?page=shift',
      current: baseUrl + (page === 'landing' ? '' : '?page=' + page)
    };
    
    let pageTitle = 'Bar Operations';
    if (page === 'employee') pageTitle = 'Bar Employee CRM';
    if (page === 'shift') pageTitle = 'Bartending Shift Tracker';
    
    const htmlOutput = template.evaluate()
      .setTitle(pageTitle)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    console.log(`[DOGET] ✅ Successfully created HTML output for: ${page}`);
    return htmlOutput;
    
  } catch (error) {
    console.error(`[DOGET] ❌ Error serving HTML:`, error);
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>🚫 CRM System Error</h2>
          <p>There was an error loading the Bar Employee CRM.</p>
          <p><strong>Error:</strong> ${error.toString()}</p>
          <p><a href="${ScriptApp.getService().getUrl()}">Return to Dashboard</a></p>
        </body>
      </html>
    `);
  }
}

// Simplified navigation function for HTML files when using Solution 3
/*
<script>
    // This replaces the navigateToPage function in your HTML files
    // The navigationUrls object is injected by the server
    
    function navigateToPage(page) {
        console.log('[NAVIGATION] 🧭 Navigating to page:', page);
        
        // Use server-injected URLs (available via template variables)
        const urls = <?!= JSON.stringify(navigationUrls) ?>;
        
        if (urls && urls[page]) {
            console.log('[NAVIGATION] 🎯 Navigating to:', urls[page]);
            window.location.href = urls[page];
        } else {
            console.error('[NAVIGATION] ❌ Invalid page:', page);
            // Fallback
            window.location.href = '?page=' + page;
        }
    }
</script>
*/