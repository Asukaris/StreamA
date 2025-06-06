// Configuration for different environments
const CONFIG = {
    // Automatically detect the API base URL based on current domain
    getApiBase: function() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        // For local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return '/api';
        }
        
        // For production servers - use relative path
        return '/api';
    },
    
    // Alternative: Manual configuration for specific domains
    API_ENDPOINTS: {
        'localhost': '/api',
        '127.0.0.1': '/api',
        'factorks.de': '/api',
        // Add more domains as needed
    }
};

// Export for use in other files
window.CONFIG = CONFIG;