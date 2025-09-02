// Solution 2: Server-side navigation using Google Apps Script
// Add this to your Code.gs file

// Add this function to generate proper navigation URLs
function getNavigationUrl(targetPage) {
  const scriptUrl = ScriptApp.getService().getUrl();
  if (targetPage === 'landing') {
    return scriptUrl;
  } else {
    return scriptUrl + '?page=' + targetPage;
  }
}

// Add this function to be called from client-side
function getPageUrls() {
  return {
    landing: getNavigationUrl('landing'),
    employee: getNavigationUrl('employee'),
    shift: getNavigationUrl('shift'),
    currentUrl: ScriptApp.getService().getUrl()
  };
}

// Client-side navigation function to add to your HTML files
// This replaces the navigateToPage function
/*
<script>
    // Cache the URLs when page loads
    let pageUrls = null;
    
    // Load URLs on page initialization
    google.script.run.withSuccessHandler(function(urls) {
        pageUrls = urls;
        console.log('[NAVIGATION] URLs loaded:', urls);
    }).getPageUrls();
    
    function navigateToPage(page) {
        console.log('[NAVIGATION] 🧭 Navigating to page:', page);
        
        // If URLs are cached, use them
        if (pageUrls && pageUrls[page]) {
            console.log('[NAVIGATION] 🎯 Using cached URL:', pageUrls[page]);
            window.top.location.href = pageUrls[page];
            return;
        }
        
        // Otherwise, get URLs from server
        google.script.run.withSuccessHandler(function(urls) {
            console.log('[NAVIGATION] 📡 Got URLs from server:', urls);
            if (urls && urls[page]) {
                window.top.location.href = urls[page];
            } else {
                console.error('[NAVIGATION] ❌ Invalid page:', page);
            }
        }).withFailureHandler(function(error) {
            console.error('[NAVIGATION] ❌ Failed to get URLs:', error);
            // Fallback to client-side navigation
            window.location.href = '?page=' + page;
        }).getPageUrls();
    }
</script>
*/