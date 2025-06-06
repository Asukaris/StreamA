// Authentication Manager
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already authenticated
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const authToken = this.getAuthToken();
        if (authToken) {
            this.isAuthenticated = true;
            this.currentUser = this.getUserData();
            this.updateUI();
        }
    }

    login(username, password) {
        // Basic login simulation - in real app, this would call an API
        if (username && password) {
            const userData = {
                username: username,
                loginTime: new Date().toISOString()
            };
            
            this.setAuthToken('demo_token_' + Date.now());
            this.setUserData(userData);
            this.isAuthenticated = true;
            this.currentUser = userData;
            this.updateUI();
            return true;
        }
        return false;
    }

    logout() {
        this.clearAuthToken();
        this.clearUserData();
        this.isAuthenticated = false;
        this.currentUser = null;
        this.updateUI();
    }

    getAuthToken() {
        return window.cookieManager ? 
            window.cookieManager.getCookie('authToken') : 
            localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        if (window.cookieManager) {
            window.cookieManager.setCookie('authToken', token);
        } else {
            localStorage.setItem('authToken', token);
        }
    }

    clearAuthToken() {
        if (window.cookieManager) {
            window.cookieManager.deleteCookie('authToken');
        } else {
            localStorage.removeItem('authToken');
        }
    }

    getUserData() {
        const data = window.cookieManager ? 
            window.cookieManager.getCookie('userData') : 
            localStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    }

    setUserData(userData) {
        const dataString = JSON.stringify(userData);
        if (window.cookieManager) {
            window.cookieManager.setCookie('userData', dataString);
        } else {
            localStorage.setItem('userData', dataString);
        }
    }

    clearUserData() {
        if (window.cookieManager) {
            window.cookieManager.deleteCookie('userData');
        } else {
            localStorage.removeItem('userData');
        }
    }

    updateUI() {
        // Update UI elements based on authentication status
        const loginElements = document.querySelectorAll('.login-required');
        const logoutElements = document.querySelectorAll('.logout-required');
        
        loginElements.forEach(el => {
            el.style.display = this.isAuthenticated ? 'block' : 'none';
        });
        
        logoutElements.forEach(el => {
            el.style.display = this.isAuthenticated ? 'none' : 'block';
        });
        
        // Update user info display
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(el => {
            if (this.currentUser) {
                el.textContent = this.currentUser.username;
            }
        });
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});