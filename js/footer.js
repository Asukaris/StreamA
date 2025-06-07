/**
 * Footer Component
 */
class FooterComponent {
    constructor() {
        console.log('FooterComponent constructor called');
        this.init();
    }

    async init() {
        await this.loadFooter();
        this.initEventListeners();
    }

    async loadFooter() {
        // Check if footer already exists
        if (document.querySelector('.footer') || document.querySelector('footer')) {
            console.log('Footer already exists, skipping load');
            return;
        }
        
        try {
            const response = await fetch('components/footer.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const footerHTML = await response.text();
            
            // Find the footer placeholder or append to body
            let footerContainer = document.querySelector('footer');
            if (footerContainer) {
                footerContainer.outerHTML = footerHTML;
            } else {
                // If no footer exists, append to body
                document.body.insertAdjacentHTML('beforeend', footerHTML);
            }
        } catch (error) {
            console.error('Error loading footer:', error);
            // Create a minimal footer fallback
            const fallbackFooter = '<footer class="footer"><div class="container"><p>&copy; 2024 Stream Archiv. Alle Rechte vorbehalten.</p></div></footer>';
            document.body.insertAdjacentHTML('beforeend', fallbackFooter);
        }
    }

    initEventListeners() {
        // Cookie deletion functionality
        const deleteCookiesBtn = document.getElementById('deleteCookies');
        if (deleteCookiesBtn) {
            deleteCookiesBtn.addEventListener('click', () => {
                this.deleteCookies();
            });
        }
    }

    deleteCookies() {
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Show confirmation
        alert('Alle Cookies und lokalen Daten wurden gelöscht!');
        
        // Reload page to reflect changes
        window.location.reload();
    }
}

// Make FooterComponent globally accessible
window.FooterComponent = FooterComponent;