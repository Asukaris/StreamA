// Cookie Management Utility
class CookieManager {
    constructor() {
        this.prefix = 'streamapp_';
    }

    // Set a cookie
    setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${this.prefix}${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    }

    // Get a cookie
    getCookie(name) {
        const nameEQ = `${this.prefix}${name}=`;
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    // Delete a cookie
    deleteCookie(name) {
        document.cookie = `${this.prefix}${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }

    // Check if a cookie exists
    hasCookie(name) {
        return this.getCookie(name) !== null;
    }

    // Set preference (alias for setCookie)
    setPreference(name, value, days = 30) {
        this.setCookie(name, value, days);
    }

    // Get preference (alias for getCookie)
    getPreference(name, defaultValue = null) {
        const value = this.getCookie(name);
        return value !== null ? value : defaultValue;
    }

    // Delete preference (alias for deleteCookie)
    deletePreference(name) {
        this.deleteCookie(name);
    }
}

// Create global instance
window.cookieManager = new CookieManager();