// Configuration for different environments
const CONFIG = {
    // Automatically detect the base path of the project
    getBasePath: function() {
        const pathname = window.location.pathname;
        // Extract the base path from the current URL
        // If we're at /projekt3/streams.html, base path is /projekt3/
        // If we're at /test/admin.html, base path is /test/
        const pathParts = pathname.split('/');
        // Remove the last part (filename) and empty parts
        const baseParts = pathParts.slice(0, -1).filter(part => part !== '');
        return baseParts.length > 0 ? '/' + baseParts.join('/') + '/' : '/';
    },
    
    // Automatically detect the API base URL based on current domain
    getApiBase: function() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        // For local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return this.getBasePath() + 'api';
        }
        
        // For production servers - use relative path with base path
        return this.getBasePath() + 'api';
    },
    
    // Alternative: Manual configuration for specific domains
    API_ENDPOINTS: {
        'localhost': '/api',
        '127.0.0.1': '/api',
        'factorks.de': '/api',
        // Add more domains as needed
    }
};

// Set the apiBase property for easy access
CONFIG.apiBase = CONFIG.getApiBase();

// Export for use in other files
window.CONFIG = CONFIG;