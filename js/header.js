// Header Component Loader
class HeaderComponent {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.loadHeader();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    }

    async loadHeader() {
        try {
            const response = await fetch('components/header.html');
            const headerHTML = await response.text();
            
            // Insert header at the beginning of body (after cookie consent)
            const cookieConsent = document.getElementById('cookieConsent') || document.querySelector('.cookie-toast');
            if (cookieConsent) {
                cookieConsent.insertAdjacentHTML('afterend', headerHTML);
            } else {
                document.body.insertAdjacentHTML('afterbegin', headerHTML);
            }
            
            this.setActiveNavigation();
            this.initMobileMenu();
            
        } catch (error) {
            console.error('Error loading header:', error);
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
}

// Initialize header when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeaderComponent();
});