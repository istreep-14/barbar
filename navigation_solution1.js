// Solution 1: Enhanced iframe navigation (keeps iframe, fixes navigation)
// Replace the navigateToPage function in all HTML files with this version

function navigateToPage(page) {
    console.log('[NAVIGATION] 🧭 Navigating to page:', page);
    console.log('[NAVIGATION] 📍 Current URL:', window.location.href);
    
    try {
        // For Google Apps Script iframe environment
        if (window.location.href.includes('googleusercontent.com')) {
            console.log('[NAVIGATION] 🔍 Detected Google Apps Script iframe environment');
            
            // Method 1: Use URL API for proper parameter handling
            const currentUrl = new URL(window.location.href);
            
            // Clear existing parameters and set new page
            currentUrl.searchParams.delete('page');
            currentUrl.searchParams.delete('view');
            
            if (page !== 'landing') {
                currentUrl.searchParams.set('page', page);
            }
            
            const newUrl = currentUrl.toString();
            console.log('[NAVIGATION] 🎯 New URL:', newUrl);
            
            // Try different navigation approaches
            // Method A: Direct assignment (most reliable for iframes)
            window.location.assign(newUrl);
            
            // If that doesn't work after 100ms, try href
            setTimeout(() => {
                if (!window.location.href.includes('page=' + page) && page !== 'landing') {
                    console.log('[NAVIGATION] 🔄 Trying window.location.href');
                    window.location.href = newUrl;
                }
            }, 100);
            
        } else {
            // Standard navigation for non-iframe access
            console.log('[NAVIGATION] 📍 Standard navigation mode');
            const baseUrl = window.location.href.split('?')[0];
            const newUrl = page === 'landing' ? baseUrl : baseUrl + '?page=' + page;
            window.location.href = newUrl;
        }
        
    } catch (error) {
        console.error('[NAVIGATION] ❌ Navigation error:', error);
        // Ultimate fallback: reload with new parameters
        console.log('[NAVIGATION] 🔄 Using fallback navigation');
        if (page === 'landing') {
            window.location.search = '';
        } else {
            window.location.search = '?page=' + page;
        }
    }
}