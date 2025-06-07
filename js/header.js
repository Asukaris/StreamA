// Header Component Loader
class HeaderComponent {
    constructor() {
        console.log('HeaderComponent constructor called');
        this.currentPage = this.getCurrentPage();
        this.loadHeader();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    }

    async loadHeader() {
        // Check if header already exists
        if (document.querySelector('.header') || document.querySelector('header')) {
            console.log('Header already exists, skipping load');
            return;
        }
        
        try {
            const response = await fetch('components/header.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const headerHTML = await response.text();
            
            // Insert header at the beginning of body (after cookie consent)
            const cookieConsent = document.getElementById('cookieConsent') || 
                                document.getElementById('cookieToast') || 
                                document.querySelector('.cookie-toast') ||
                                document.querySelector('.cookie-consent');
            if (cookieConsent) {
                cookieConsent.insertAdjacentHTML('afterend', headerHTML);
            } else {
                document.body.insertAdjacentHTML('afterbegin', headerHTML);
            }
            
            this.setActiveNavigation();
            this.initMobileMenu();
            this.initThemeToggle();
            
        } catch (error) {
            console.error('Error loading header:', error);
            // Create a minimal header fallback
            const fallbackHeader = '<header class="header"><nav class="navbar"><div class="nav-container"><div class="nav-logo"><a href="#">Stream Archiv</a></div></div></nav></header>';
            document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
        }
    }

    setActiveNavigation() {
        // Set active class for desktop navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            const linkPage = href.replace('.html', '').replace('index', '');
            
            if ((this.currentPage === 'index' && href === 'index.html') ||
                (this.currentPage !== 'index' && href.includes(this.currentPage))) {
                link.classList.add('active');
            }
        });

        // Set active class for mobile navigation
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            const linkPage = href.replace('.html', '').replace('index', '');
            
            if ((this.currentPage === 'index' && href === 'index.html') ||
                (this.currentPage !== 'index' && href.includes(this.currentPage))) {
                link.classList.add('active');
            }
        });
    }

    initMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.remove('active');
                    mobileToggle.classList.remove('active');
                }
            });
        }
    }

    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Get current theme from cookieManager or default to light
        const currentTheme = cookieManager.getPreference('theme') || 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            this.updateThemeIcon(currentTheme);

            // Add click event listener
            themeToggle.addEventListener('click', () => {
                const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                cookieManager.setPreference('theme', newTheme);
                this.updateThemeIcon(newTheme);
            });
        }
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    themeToggle.title = 'Helles Design';
                } else {
                    icon.className = 'fas fa-moon';
                    themeToggle.title = 'Dunkles Design';
                }
            }
        }
    }
}

// Make HeaderComponent globally accessible
window.HeaderComponent = HeaderComponent;