// Main Application JavaScript
class StreamArchiveApp {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.isLoggedIn = false;
        this.currentUser = null;
        this.streams = [];
        
        this.init();
    }
    
    init() {
        this.initTheme();
        this.initEventListeners();
        this.loadStreams();
        this.checkAuthStatus();
    }
    
    // Theme Management
    initTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon();
    }
    
    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Helles Design';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Dunkles Design';
        }
    }
    
    // Event Listeners
    initEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Login button
        document.getElementById('loginBtn')?.addEventListener('click', () => {
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
            // Redirect to Twitch OAuth
            const clientId = 'YOUR_TWITCH_CLIENT_ID'; // Replace with actual client ID
            const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
            const scope = encodeURIComponent('user:read:email');
            
            const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
            window.location.href = authUrl;
        }
    }
    
    async checkAuthStatus() {
        const token = localStorage.getItem('twitch_token');
        if (token) {
            try {
                const response = await fetch('https://api.twitch.tv/helix/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Client-Id': 'YOUR_TWITCH_CLIENT_ID'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.data[0];
                    this.isLoggedIn = true;
                    this.updateLoginUI();
                } else {
                    localStorage.removeItem('twitch_token');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('twitch_token');
            }
        }
    }
    
    logout() {
        localStorage.removeItem('twitch_token');
        this.isLoggedIn = false;
        this.currentUser = null;
        this.updateLoginUI();
    }
    
    updateLoginUI() {
        const loginBtn = document.getElementById('loginBtn');
        const adminBtn = document.getElementById('adminBtn');
        
        if (this.isLoggedIn && this.currentUser) {
            loginBtn.innerHTML = `
                <img src="${this.currentUser.profile_image_url}" alt="${this.currentUser.display_name}" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;">
                ${this.currentUser.display_name}
            `;
            
            // Show admin button for authorized users
            if (this.isAdmin()) {
                adminBtn.classList.remove('hidden');
            }
        } else {
            loginBtn.innerHTML = '<i class="fab fa-twitch"></i> Anmelden';
            adminBtn.classList.add('hidden');
        }
    }
    
    isAdmin() {
        // Check if current user has admin privileges
        const adminUsers = ['factor_ks']; // Add admin usernames here
        return this.currentUser && adminUsers.includes(this.currentUser.login.toLowerCase());
    }
    
    // Stream Management
    async loadStreams() {
        try {
            // Mock data for now - replace with actual API call
            this.streams = [
                {
                    id: 5,
                    title: 'Pferdestärke lets GO',
                    description: 'Ein kurzer Test-Stream mit JDM: Japanese Drift Master',
                    date: '2025-06-04',
                    duration: 21,
                    game: 'JDM: Japanese Drift Master',
                    thumbnail: 'https://static-cdn.jtvnw.net/ttv-boxart/85288604_IGDB-285x380.jpg',
                    url: 'https://vid.asukaris.live/streams/_0005/master.m3u8',
                    chatData: null // Will be loaded separately
                },
                {
                    id: 4,
                    title: 'Previous Stream',
                    description: 'Another great stream',
                    date: '2025-06-03',
                    duration: 3600,
                    game: 'Some Game',
                    thumbnail: 'https://via.placeholder.com/285x380',
                    url: 'https://vid.asukaris.live/streams/_0004/master.m3u8',
                    chatData: null
                },
                {
                    id: 3,
                    title: 'Older Stream',
                    description: 'Yet another stream',
                    date: '2025-06-02',
                    duration: 7200,
                    game: 'Another Game',
                    thumbnail: 'https://via.placeholder.com/285x380',
                    url: 'https://vid.asukaris.live/streams/_0003/master.m3u8',
                    chatData: null
                },
                {
                    id: 2,
                    title: 'Even Older Stream',
                    description: 'Stream description here',
                    date: '2025-06-01',
                    duration: 5400,
                    game: 'Cool Game',
                    thumbnail: 'https://via.placeholder.com/285x380',
                    url: 'https://vid.asukaris.live/streams/_0002/master.m3u8',
                    chatData: null
                }
            ];
            
            this.renderRecentStreams();
        } catch (error) {
            console.error('Failed to load streams:', error);
        }
    }
    
    renderRecentStreams() {
        const grid = document.getElementById('recentStreamsGrid');
        if (!grid) return;
        
        const recentStreams = this.streams.slice(1, 5); // Skip the latest stream, show next 4
        
        grid.innerHTML = recentStreams.map(stream => {
            const progress = this.getStreamProgress(stream.id);
            const progressPercent = (progress / stream.duration) * 100;
            
            return `
                <div class="stream-card" data-stream-id="${stream.id}">
                    <div class="stream-thumbnail">
                        <img src="${stream.thumbnail}" alt="${stream.title}" loading="lazy">
                        <div class="stream-duration">${this.formatDuration(stream.duration)}</div>
                        ${progress > 0 ? `<div class="stream-progress" style="width: ${progressPercent}%"></div>` : ''}
                    </div>
                    <div class="stream-card-content">
                        <h3>${stream.title}</h3>
                        <div class="stream-card-meta">
                            <span>#${stream.id}</span>
                            <span>${this.formatDate(stream.date)}</span>
                        </div>
                        <p class="stream-game">${stream.game}</p>
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
        const progress = localStorage.getItem(`stream_progress_${streamId}`);
        return progress ? parseInt(progress) : 0;
    }
    
    setStreamProgress(streamId, seconds) {
        localStorage.setItem(`stream_progress_${streamId}`, seconds.toString());
    }
    
    deleteCookies() {
        // Clear all stream progress
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('stream_progress_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Clear theme preference
        localStorage.removeItem('theme');
        
        // Clear auth token
        localStorage.removeItem('twitch_token');
        
        // Reset to defaults
        this.currentTheme = 'light';
        this.initTheme();
        this.isLoggedIn = false;
        this.currentUser = null;
        this.updateLoginUI();
        
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