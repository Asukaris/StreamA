// Main Application JavaScript
class StreamArchiveApp {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.streams = [];
        this.apiBase = window.CONFIG ? window.CONFIG.getApiBase() : '/api';
        
        this.init();
    }
    
    init() {
        // Wait for header to load before initializing event listeners
        this.waitForHeader().then(() => {
            this.initEventListeners();
        });
        this.loadStreams();
        this.checkAuthStatus();
    }
    
    async waitForHeader() {
        // Wait for header elements to be available
        return new Promise((resolve) => {
            const checkHeader = () => {
                if (document.getElementById('loginBtn')) {
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            };
            checkHeader();
        });
    }
    
    // Theme Management is now handled by HeaderComponent
    
    // Event Listeners
    initEventListeners() {
        // Login button
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.handleLogin();
        });
        
        // Mobile login button
        document.getElementById('mobileLoginBtn')?.addEventListener('click', () => {
            this.handleLogin();
        });
        
        // Admin button
        document.getElementById('adminBtn')?.addEventListener('click', () => {
            window.location.href = 'admin/index.html';
        });
        
        // Delete cookies button
        document.getElementById('deleteCookies')?.addEventListener('click', () => {
            this.deleteCookies();
        });
        
        // Stream cards click events
        document.addEventListener('click', (e) => {
            const streamCard = e.target.closest('.stream-card');
            if (streamCard) {
                const streamId = streamCard.dataset.streamId;
                this.openStream(streamId);
            }
        });
    }
    

    
    // Authentication
    async handleLogin() {
        if (this.isLoggedIn) {
            this.logout();
        } else {
            // Show login modal or redirect to login page
            this.showLoginModal();
        }
    }
    
    showLoginModal() {
        // Create a simple login modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Anmelden</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="email">E-Mail:</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Passwort:</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit">Anmelden</button>
                    <p><a href="#" id="showRegister">Noch kein Konto? Registrieren</a></p>
                </form>
                <form id="registerForm" style="display: none;">
                    <div class="form-group">
                        <label for="regUsername">Benutzername:</label>
                        <input type="text" id="regUsername" required>
                    </div>
                    <div class="form-group">
                        <label for="regEmail">E-Mail:</label>
                        <input type="email" id="regEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="regPassword">Passwort:</label>
                        <input type="password" id="regPassword" required>
                    </div>
                    <button type="submit">Registrieren</button>
                    <p><a href="#" id="showLogin">Bereits ein Konto? Anmelden</a></p>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners for modal
        modal.querySelector('.close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        modal.querySelector('#showRegister').onclick = (e) => {
            e.preventDefault();
            modal.querySelector('#loginForm').style.display = 'none';
            modal.querySelector('#registerForm').style.display = 'block';
        };
        
        modal.querySelector('#showLogin').onclick = (e) => {
            e.preventDefault();
            modal.querySelector('#loginForm').style.display = 'block';
            modal.querySelector('#registerForm').style.display = 'none';
        };
        
        modal.querySelector('#loginForm').onsubmit = (e) => {
            e.preventDefault();
            this.login(
                modal.querySelector('#email').value,
                modal.querySelector('#password').value
            ).then(() => modal.remove());
        };
        
        modal.querySelector('#registerForm').onsubmit = (e) => {
            e.preventDefault();
            this.register(
                modal.querySelector('#regUsername').value,
                modal.querySelector('#regEmail').value,
                modal.querySelector('#regPassword').value
            ).then(() => modal.remove());
        };
    }
    
    async checkAuthStatus() {
        const token = cookieManager.getPreference('session_token');
        if (token) {
            try {
                const response = await fetch(`${this.apiBase}/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.data;
                    this.isLoggedIn = true;
                    this.updateLoginUI();
                } else {
                    cookieManager.deletePreference('session_token');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                cookieManager.deletePreference('session_token');
            }
        }
    }
    
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                cookieManager.setPreference('session_token', data.data.session_token);
                this.currentUser = data.data.user;
                this.isLoggedIn = true;
                this.updateLoginUI();
                alert('Erfolgreich angemeldet!');
            } else {
                alert('Anmeldung fehlgeschlagen: ' + data.error);
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
    }
    
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiBase}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server Error Response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                alert('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
            } else {
                alert('Registrierung fehlgeschlagen: ' + data.error);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
    }
    
    async logout() {
        const token = cookieManager.getPreference('session_token');
        if (token) {
            try {
                await fetch(`${this.apiBase}/users/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Logout request failed:', error);
            }
        }
        
        cookieManager.deletePreference('session_token');
        this.isLoggedIn = false;
        this.currentUser = null;
        this.updateLoginUI();
    }
    
    updateLoginUI() {
        const loginBtn = document.getElementById('loginBtn');
        const adminBtn = document.getElementById('adminBtn');
        
        if (this.isLoggedIn && this.currentUser) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i> ${this.currentUser.username}
            `;
            
            // Show admin button for authorized users
            if (this.isAdmin()) {
                adminBtn.classList.remove('hidden');
            }
        } else {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Anmelden';
            adminBtn.classList.add('hidden');
        }
    }
    
    isAdmin() {
        // Check if current user has admin privileges
        const adminUsers = ['factor_ks', 'admin']; // Add admin usernames here
        return this.currentUser && adminUsers.includes(this.currentUser.username.toLowerCase());
    }
    
    // Stream Management
    async loadStreams() {
        try {
            const response = await fetch(`${this.apiBase}/streams?limit=10`);
            const data = await response.json();
            
            if (data.success) {
                this.streams = data.data.streams || [];
            } else {
                console.error('Failed to load streams:', data.error);
                this.streams = [];
            }
            
            this.renderRecentStreams();
        } catch (error) {
            console.error('Failed to load streams:', error);
            this.streams = [];
            this.renderRecentStreams();
        }
    }
    
    renderRecentStreams() {
        const grid = document.getElementById('recentStreamsGrid');
        if (!grid) return;
        
        if (this.streams.length === 0) {
            grid.innerHTML = '<p class="no-streams">Keine Streams verfügbar.</p>';
            return;
        }
        
        const recentStreams = this.streams.slice(0, 4); // Show first 4 streams
        
        grid.innerHTML = recentStreams.map(stream => {
            const progress = this.getStreamProgress(stream.id);
            const duration = stream.duration || 0;
            const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
            const thumbnailUrl = stream.thumbnail_url || 'https://via.placeholder.com/285x380';
            const category = stream.category || 'Unbekannt';
            const createdDate = stream.created_at ? new Date(stream.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            
            return `
                <div class="stream-card" data-stream-id="${stream.id}">
                    <div class="stream-thumbnail">
                        <img src="${thumbnailUrl}" alt="${stream.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/285x380'">
                        ${duration > 0 ? `<div class="stream-duration">${this.formatDuration(duration)}</div>` : ''}
                        ${progress > 0 && duration > 0 ? `<div class="stream-progress" style="width: ${progressPercent}%"></div>` : ''}
                    </div>
                    <div class="stream-card-content">
                        <h3>${stream.title}</h3>
                        <div class="stream-card-meta">
                            <span>#${stream.id}</span>
                            <span>${this.formatDate(createdDate)}</span>
                        </div>
                        <p class="stream-game">${category}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openStream(streamId) {
        window.location.href = `stream.html?id=${streamId}`;
    }
    
    // Utility Functions
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    getStreamProgress(streamId) {
        const progress = cookieManager.getPreference(`stream_progress_${streamId}`);
        return progress ? parseInt(progress) : 0;
    }
    
    setStreamProgress(streamId, seconds) {
        cookieManager.setPreference(`stream_progress_${streamId}`, seconds.toString());
    }
    
    deleteCookies() {
        // Clear all preferences
        const allCookies = document.cookie.split(';');
        allCookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.startsWith('stream_progress_') || name === 'theme' || name === 'session_token') {
                cookieManager.deletePreference(name);
            }
        });
        
        // Reset to defaults
        this.isLoggedIn = false;
        this.currentUser = null;
        this.updateLoginUI();
        
        // Trigger theme reset if HeaderComponent exists
        if (window.headerComponent) {
            window.headerComponent.setTheme('light');
        }
        
        alert('Alle Cookies und gespeicherten Daten wurden gelöscht.');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.streamApp = new StreamArchiveApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamArchiveApp;
}