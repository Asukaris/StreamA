class FooterComponent {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadFooter();
        this.initEventListeners();
    }

    async loadFooter() {
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

// Initialize footer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FooterComponent();
});