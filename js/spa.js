/**
 * Single Page Application (SPA) Manager
 * Handles automatic JS loading, consistent header/footer, and dynamic content loading
 */
console.log('[DEBUG] spa.js file loaded and executing');

class SPAManager {
    constructor() {
        console.log('SPAManager constructor called');
        
        // Define required scripts that should be loaded on every page
        this.requiredScripts = [
            'js/config.js',
            'js/cookies.js',
            'js/auth.js',
            'js/header.js',
            'js/footer.js'
        ];
        
        console.log('Required scripts defined:', this.requiredScripts);
        
        // Define routes and their required JS and CSS files
        this.routes = {
            '': { content: 'home.html', js: ['js/app.js', 'js/player.js', 'js/api.js'], css: ['css/player.css', 'css/chat.css'] },
            'home': { content: 'home.html', js: ['js/app.js', 'js/player.js'], css: ['css/player.css', 'css/chat.css'] },
            'streams': { content: 'streams.html', js: ['js/app.js', 'js/streams.js'], css: ['css/streams.css'] },
            'stream': { content: 'stream.html', js: ['js/app.js', 'js/player.js', 'js/stream.js', 'js/chat.js', 'js/comments.js'], css: ['css/player.css', 'css/chat.css', 'css/comments.css'] },
            'analytics': { content: 'analytics.html', js: ['js/app.js', 'js/analytics.js'], css: ['css/analytics.css'] },
            'api': { content: 'api.html', js: ['js/app.js', 'js/api.js'], css: ['css/api.css'] },
            'privacy': { content: 'privacy.html', js: ['js/app.js'], css: ['css/legal.css'] },
            'imprint': { content: 'imprint.html', js: ['js/app.js'], css: ['css/legal.css'] },
            'admin': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'dashboard' },
            // Admin sub-pages - all use the same admin.html content but with different tabs
            'dashboard': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'dashboard' },
            'users': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'users' },
            'upload': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'upload' },
            'archive': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'archive' },
            'logos': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'logos' },
            'data-management': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'data-management' },
            'settings': { content: 'admin.html', js: ['js/app.js', 'js/admin.js'], css: ['css/admin.css'], adminTab: 'settings' }
        };
        
        console.log('Routes defined:', this.routes);
        
        // Global JavaScript files that should be loaded on all pages
        this.globalJS = [];
        
        // Page-specific CSS files
        this.pageSpecificCSS = {};
        
        // Track loaded scripts and CSS to avoid duplicates
        this.loadedScripts = new Set();
        this.loadedCSS = new Set();
        
        console.log('SPAManager constructor completed, calling init()');
        this.init();
    }
    
    async init() {
        try {
            await this.loadRequiredScripts();
            await this.initializeLayout();
            await this.handlePageLoad();
            this.setupNavigation();
            
            // Handle browser back/forward
            window.addEventListener('popstate', () => this.handlePageLoad());
            
            // Handle hash changes
            window.addEventListener('hashchange', () => {
                if (!this.isNavigating) {
                    this.handlePageLoad();
                }
            });
        } catch (error) {
            console.error('SPAManager initialization error:', error);
            // Show error message to user
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = '<div class="error-message"><h2>Fehler beim Laden der Anwendung</h2><p>Die Anwendung konnte nicht korrekt geladen werden. Bitte laden Sie die Seite neu.</p></div>';
            }
        }
    }
    
    async loadRequiredScripts() {
        console.log('Starting to load required scripts:', this.requiredScripts);
        for (const script of this.requiredScripts) {
            try {
                await this.loadScript(script);
                console.log(`Completed loading: ${script}`);
            } catch (error) {
                console.error(`Error loading script ${script}:`, error);
            }
        }
        console.log('Finished loading all required scripts');
    }
    
    async loadScript(src) {
        // Check if script is already loaded in DOM
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            console.log(`Script already exists in DOM: ${src}`);
            return Promise.resolve();
        }
        
        // Also check instance cache for this session
        if (this.loadedScripts.has(src)) {
            console.log(`Script already in cache: ${src}`);
            return Promise.resolve();
        }
        
        console.log(`Loading script: ${src}`);
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`Successfully loaded script: ${src}`);
                if (src.includes('streams.js')) {
                    console.log('[DEBUG] streams.js loaded, StreamsManager available:', typeof window.StreamsManager);
                }
                if (src.includes('stream.js')) {
                    console.log('[DEBUG] stream.js loaded, StreamPage available:', typeof window.StreamPage);
                }
                this.loadedScripts.add(src);
                resolve();
            };
            script.onerror = () => {
                console.warn(`Failed to load script: ${src}`);
                resolve(); // Continue even if script fails to load
            };
            document.head.appendChild(script);
        });
    }
    
    async loadCSS(href) {
        if (this.loadedCSS.has(href)) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                this.loadedCSS.add(href);
                resolve();
            };
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            document.head.appendChild(link);
        });
    }
    
    async initializeLayout() {
        console.log('Initializing layout...');
        console.log('Current header instance:', this.header);
        console.log('Current footer instance:', this.footer);
        console.log('Existing header in DOM:', document.querySelector('.header') || document.querySelector('header'));
        console.log('Existing footer in DOM:', document.querySelector('.footer') || document.querySelector('footer'));
        console.log('Starting layout initialization');
        
        // Force load footer.js if it hasn't been loaded
        if (!this.loadedScripts.has('js/footer.js')) {
            console.log('Footer.js not loaded, attempting to load it now');
            await this.loadScript('js/footer.js');
        }
        
        // Wait for header and footer components to be available with timeout
        try {
            console.log('Waiting for HeaderComponent and FooterComponent classes');
            const success = await this.waitForClasses(['HeaderComponent', 'FooterComponent']);
            
            if (success) {
                console.log('Both components available, initializing...');
                // Initialize header and footer only if they don't exist
                if (window.HeaderComponent && !this.header) {
                    console.log('Initializing HeaderComponent');
                    try {
                        this.header = new HeaderComponent();
                        console.log('HeaderComponent initialized successfully');
                        // Wait for header to be loaded into DOM
                        await this.waitForElement('.header, header');
                    } catch (error) {
                        console.error('Error initializing HeaderComponent:', error);
                    }
                }
                
                if (window.FooterComponent && !this.footer) {
                    console.log('Initializing FooterComponent');
                    try {
                        this.footer = new FooterComponent();
                        console.log('FooterComponent initialized successfully');
                        // Wait for footer to be loaded into DOM
                        await this.waitForElement('.footer, footer');
                    } catch (error) {
                        console.error('Error initializing FooterComponent:', error);
                    }
                }
                // Log final state after initialization
                console.log('Layout initialization complete');
                console.log('Final header instance:', this.header);
                console.log('Final footer instance:', this.footer);
                console.log('Final header in DOM:', document.querySelector('.header') || document.querySelector('header'));
                console.log('Final footer in DOM:', document.querySelector('.footer') || document.querySelector('footer'));
            } else {
                console.warn('Header/Footer components not available, continuing without them');
                console.log('Available window objects:', Object.keys(window).filter(key => key.includes('Component')));
            }
        } catch (error) {
            console.warn('Layout initialization failed:', error);
        }
    }
    
    async waitForClasses(classNames, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const allAvailable = classNames.every(className => window[className]);
            if (allAvailable) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Don't throw error, just return false to allow graceful degradation
        console.warn(`Timeout waiting for classes: ${classNames.join(', ')}`);
        return false;
    }
    
    async waitForElement(selector, timeout = 3000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Element found: ${selector}`);
                return element;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.warn(`Timeout waiting for element: ${selector}`);
        return null;
    }
    
    getCurrentPageFromURL() {
        // Check for hash-based routing first
        const hash = window.location.hash.replace('#', '');
        console.log('Hash from URL:', hash);
        if (hash) {
            // Extract page name from hash (before any query parameters)
            const hashParts = hash.split('?');
            const pageName = hashParts[0];
            console.log('Extracted page name from hash:', pageName);
            return pageName;
        }
        
        // Check for query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        console.log('Page param from URL:', page);
        if (page) {
            return page;
        }
        
        // Default to home page
        console.log('Defaulting to home page');
        return 'home';
    }
    
    async handlePageLoad(targetPage = null) {
        const page = targetPage || this.getCurrentPageFromURL();
        console.log('handlePageLoad called for page:', page, 'current page:', this.currentPage);
        
        // Check if both current and target pages are admin-related
        const adminPages = ['admin', 'users', 'upload', 'archive', 'logos', 'data-management', 'settings'];
        const isCurrentAdmin = adminPages.includes(this.currentPage);
        const isTargetAdmin = adminPages.includes(page);
        
        if (this.currentPage === page) {
            console.log('Already on this page, skipping');
            return; // Already on this page
        }
        
        // If switching between admin tabs, just activate the tab without reloading
        if (isCurrentAdmin && isTargetAdmin) {
            console.log('Switching between admin tabs, activating tab without reload');
            this.currentPage = page;
            const route = this.routes[page];
            if (route && route.adminTab) {
                this.activateAdminTab(route.adminTab);
            }
            return;
        }
        
        // Load page-specific resources
        await this.loadPageResources(page);
        
        // Load page content
        await this.loadPageContent(page);
        
        // Update current page
        this.currentPage = page;
        
        // Update navigation active states
        if (this.header) {
            this.header.setActiveNavigation();
        }
        
        // Initialize page-specific functionality
        this.initializePageFunctionality(page);
    }
    
    async loadPageResources(page) {
        console.log(`Loading page resources for: ${page}`);
        
        // Load page-specific CSS from routes configuration
        const route = this.routes[page];
        console.log(`Route configuration for ${page}:`, route);
        
        if (route && route.css) {
            console.log(`CSS files to load for ${page}:`, route.css);
            for (const cssFile of route.css) {
                console.log(`Loading CSS file: ${cssFile}`);
                try {
                    await this.loadCSS(cssFile);
                    console.log(`Successfully loaded CSS file: ${cssFile}`);
                } catch (error) {
                    console.error(`Failed to load CSS file: ${cssFile}`, error);
                }
            }
        } else {
            console.log(`No CSS files configured for page: ${page}`);
        }
        
        // Load page-specific JS from routes configuration
        if (route && route.js) {
            console.log(`JS files to load for ${page}:`, route.js);
            for (const jsFile of route.js) {
                console.log(`Loading JS file: ${jsFile}`);
                try {
                    await this.loadScript(jsFile);
                    console.log(`Successfully loaded JS file: ${jsFile}`);
                } catch (error) {
                    console.error(`Failed to load JS file: ${jsFile}`, error);
                }
            }
        } else {
            console.log(`No JS files configured for page: ${page}`);
        }
        
        console.log(`Finished loading page resources for: ${page}`);
    }
    
    async loadPageContent(page) {
        // Determine content file based on routes or default naming
        let contentFile = 'content/home.html'; // default
        
        if (this.routes[page] && this.routes[page].content) {
            contentFile = `content/${this.routes[page].content}`;
        } else if (page && page !== 'home') {
            contentFile = `content/${page}.html`;
        }
        
        console.log('Loading content for page:', page, 'from file:', contentFile);
        
        try {
            const response = await fetch(contentFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = content;
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = '<div class="error-message"><h2>Seite nicht gefunden</h2><p>Die angeforderte Seite konnte nicht geladen werden.</p></div>';
            }
        }
    }
    
    initializePageFunctionality(page) {
        // Initialize page-specific functionality based on loaded scripts
        switch (page) {
            case 'home':
            case '':
                // Initialize HLS player for home page
                if (window.HLSPlayer && typeof window.initializeMainPlayer === 'function') {
                    console.log('Initializing HLS player for home page');
                    // Add small delay to ensure DOM is ready
                    setTimeout(() => {
                        window.initializeMainPlayer();
                    }, 100);
                }
                break;
            case 'stream':
                // Initialize StreamPage for individual stream page
                console.log('[DEBUG] Stream case reached, StreamPage available:', typeof window.StreamPage);
                
                // Wait for StreamPage class to be available first
                let streamPageRetries = 0;
                const maxStreamPageRetries = 50; // 5 seconds max
                
                const waitForStreamPage = () => {
                    if (window.StreamPage) {
                        console.log('[DEBUG] StreamPage class available, initializing for stream page');
                        // Wait for HLSPlayer to be available before initializing StreamPage
                        let playerRetries = 0;
                        const maxPlayerRetries = 50; // 5 seconds max
                        
                        const waitForPlayer = () => {
                            if (window.HLSPlayer) {
                                console.log('[DEBUG] HLSPlayer available, initializing StreamPage');
                                if (!window.streamPageInstance) {
                                    console.log('[DEBUG] Creating new StreamPage instance');
                                    window.streamPageInstance = new StreamPage();
                                } else {
                                    console.log('[DEBUG] StreamPage already exists, reinitializing');
                                    window.streamPageInstance.init();
                                }
                            } else {
                                playerRetries++;
                                if (playerRetries < maxPlayerRetries) {
                                    console.log(`[DEBUG] HLSPlayer not yet available, retrying in 100ms (${playerRetries}/${maxPlayerRetries})`);
                                    setTimeout(waitForPlayer, 100);
                                } else {
                                    console.error('[DEBUG] HLSPlayer failed to load after maximum retries');
                                }
                            }
                        };
                        // Add small delay to ensure DOM is ready, then wait for player
                        setTimeout(waitForPlayer, 100);
                    } else {
                        streamPageRetries++;
                        if (streamPageRetries < maxStreamPageRetries) {
                            console.log(`[DEBUG] StreamPage class not yet available, retrying in 100ms (${streamPageRetries}/${maxStreamPageRetries})`);
                            setTimeout(waitForStreamPage, 100);
                        } else {
                            console.error('[DEBUG] StreamPage class failed to load after maximum retries. Check if stream.js is loading properly.');
                        }
                    }
                };
                
                // Start waiting for StreamPage class
                waitForStreamPage();
                break;
            case 'streams':
                // Initialize StreamsManager for streams page
                console.log('[DEBUG] Streams case reached, StreamsManager available:', typeof window.StreamsManager);
                if (window.StreamsManager) {
                    console.log('[DEBUG] Initializing StreamsManager for streams page');
                    // Add small delay to ensure DOM is ready
                    setTimeout(() => {
                        console.log('[DEBUG] StreamsManager timeout reached, existing manager:', !!window.streamsManager);
                        if (!window.streamsManager) {
                            console.log('[DEBUG] Creating new StreamsManager instance');
                            window.streamsManager = new StreamsManager();
                        } else {
                            console.log('[DEBUG] StreamsManager already exists, reinitializing...');
                            // Reinitialize the existing manager to refresh the streams
                            window.streamsManager.init();
                        }
                    }, 100);
                } else {
                    console.error('[DEBUG] StreamsManager class not available!');
                }
                break;
            case 'analytics':
                if (window.AnalyticsManager) {
                    new AnalyticsManager();
                }
                break;
            case 'admin':
            case 'users':
            case 'upload':
            case 'archive':
            case 'logos':
            case 'data-management':
            case 'settings':
                console.log('---- SPA: Admin case reached, AdminManager available:', !!window.AdminManager);
                if (window.AdminManager) {
                    // Only create new AdminManager if one doesn't exist
                    if (!window.adminManagerInstance) {
                        console.log('---- SPA: Creating new AdminManager instance');
                        const adminManager = new AdminManager();
                        window.adminManagerInstance = adminManager;
                        // Also assign to adminPanel for onclick compatibility
                        window.adminPanel = adminManager;
                    } else {
                        console.log('---- SPA: AdminManager instance already exists');
                    }
                    // If it's an admin sub-page, activate the specific tab
                    const route = this.routes[page];
                    console.log('---- SPA: Route found:', route);
                    if (route && route.adminTab) {
                        console.log('---- SPA: Admin tab to activate:', route.adminTab);
                        // If admin panel already exists, activate tab immediately
                        if (window.adminManagerInstance) {
                            console.log('---- SPA: Activating tab immediately');
                            this.activateAdminTab(route.adminTab);
                        } else {
                            console.log('---- SPA: Waiting for admin panel to initialize');
                            // Wait for admin panel to initialize, then activate the tab
                            setTimeout(() => {
                                console.log('---- SPA: Timeout reached, activating tab');
                                this.activateAdminTab(route.adminTab);
                            }, 200);
                        }
                    }
                } else {
                    console.error('---- SPA: AdminManager class not available!');
                }
                break;
            case 'api':
                if (window.APIManager) {
                    new APIManager();
                }
                break;
        }
        
        // Always initialize the main app if available (only once)
        console.log('DEBUG - StreamArchiveApp available:', !!window.StreamArchiveApp);
        console.log('DEBUG - appInstance exists:', !!window.appInstance);
        if (window.StreamArchiveApp && !window.appInstance) {
            console.log('Initializing StreamArchiveApp');
            window.appInstance = new StreamArchiveApp();
        } else {
            console.log('StreamArchiveApp not initialized - StreamArchiveApp:', !!window.StreamArchiveApp, 'appInstance:', !!window.appInstance);
        }
    }

    activateAdminTab(tabId) {
        console.log('---- SPA: Activating admin tab:', tabId);
        
        // Remove active class from all menu items and tab contents
        const menuItems = document.querySelectorAll('.menu-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        console.log('---- SPA: Found menu items:', menuItems.length, 'tab contents:', tabContents.length);
        
        menuItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to the correct menu item and tab content
        const menuItem = document.querySelector(`[data-tab="${tabId}"]`);
        const tabContent = document.getElementById(tabId);
        
        console.log('---- SPA: Target elements found:', {
            menuItem: !!menuItem,
            tabContent: !!tabContent
        });
        
        if (menuItem) {
            menuItem.classList.add('active');
        }
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Trigger the admin panel's tab loading logic
        console.log('---- SPA: adminManagerInstance exists:', !!window.adminManagerInstance);
        if (window.adminManagerInstance) {
            console.log('---- SPA: Current tab:', window.adminManagerInstance.currentTab, 'Target tab:', tabId);
        }
        
        if (window.adminManagerInstance) {
            window.adminManagerInstance.currentTab = tabId;
            
            // Load tab-specific data
            switch(tabId) {
                case 'dashboard':
                    console.log('---- SPA: Checking if loadDashboard function exists:', typeof window.adminManagerInstance.loadDashboard);
                    if (typeof window.adminManagerInstance.loadDashboard === 'function') {
                        console.log('---- SPA: Calling loadDashboard()');
                        window.adminManagerInstance.loadDashboard();
                    } else {
                        console.log('---- SPA: loadDashboard function not found!');
                    }
                    break;
                case 'users':
                    if (typeof window.adminManagerInstance.loadUsers === 'function') {
                        window.adminManagerInstance.loadUsers();
                    }
                    break;
                case 'archive':
                    if (typeof window.adminManagerInstance.loadArchive === 'function') {
                        window.adminManagerInstance.loadArchive();
                    }
                    break;
                case 'upload':
                    if (typeof window.adminManagerInstance.loadUpload === 'function') {
                        window.adminManagerInstance.loadUpload();
                    }
                    break;
                case 'logos':
                    if (typeof window.adminManagerInstance.loadLogos === 'function') {
                        window.adminManagerInstance.loadLogos();
                    }
                    break;
                case 'data-management':
                    if (typeof window.adminManagerInstance.loadDataManagement === 'function') {
                        window.adminManagerInstance.loadDataManagement();
                    }
                    break;
                case 'settings':
                    if (typeof window.adminManagerInstance.loadSettings === 'function') {
                        window.adminManagerInstance.loadSettings();
                    }
                    break;
            }
        }
    }
    
    setupNavigation() {
        // Intercept navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            console.log('Navigation click intercepted:', href);
            
            // Only handle internal navigation
            if (href.startsWith('http') || href.startsWith('//')) {
                return;
            }
            
            // Check if it's a page navigation
            if (href.endsWith('.html') || href === 'index.html' || href === '/' || href.startsWith('#') || href.includes('?page=')) {
                e.preventDefault();
                
                let page;
                if (href.startsWith('#')) {
                    page = href.substring(1);
                } else if (href.includes('?page=')) {
                    // Extract page from query parameter
                    const url = new URL(href, window.location.origin);
                    page = url.searchParams.get('page') || 'home';
                } else {
                    page = href.replace('.html', '') || 'home';
                    // Treat app.html as home page
                    if (page === 'app') {
                        page = 'home';
                    }
                }
                console.log('Navigating to page:', page);
                this.navigateToPage(page);
            }
        });
    }
    
    async navigateToPage(page) {
        // Temporarily disable hashchange listener to prevent double calls
        this.isNavigating = true;
        
        // Update URL without page reload using query parameter
        let newUrl;
        if (page === 'home' || page === '') {
            newUrl = window.location.pathname;
        } else {
            newUrl = `${window.location.pathname}?page=${page}`;
        }
        window.history.pushState({ page }, '', newUrl);
        
        // Load the page
        await this.handlePageLoad(page);
        
        // Re-enable hashchange listener after a short delay
        setTimeout(() => {
            this.isNavigating = false;
        }, 100);
    }
    
    // Public method to programmatically navigate
    static navigateTo(page) {
        if (window.spaManager) {
            window.spaManager.navigateToPage(page);
        } else {
            window.location.href = `${page}.html`;
        }
    }
}

// Auto-initialize when DOM is ready (only if not already initialized)
if (!window.spaManager) {
    console.log('SPA Manager initialization check - readyState:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('Document still loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded fired, creating SPA Manager');
            if (!window.spaManager) {
                window.spaManager = new SPAManager();
                console.log('SPA Manager created:', window.spaManager);
            }
        });
    } else {
        console.log('Document already loaded, creating SPA Manager immediately');
        window.spaManager = new SPAManager();
        console.log('SPA Manager created:', window.spaManager);
    }
} else {
    console.log('SPA Manager already exists:', window.spaManager);
}