// Individual Stream Page JavaScript
class StreamPage {
    constructor() {
        this.streamId = null;
        this.streamData = null;
        this.player = null;
        this.chatSync = null;
        
        this.init();
    }
    
    init() {
        this.getStreamIdFromUrl();
        this.loadStreamData();
        this.setupEventListeners();
    }
    
    getStreamIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.streamId = urlParams.get('id');
        
        if (!this.streamId) {
            // Redirect to streams page if no ID provided
            window.location.href = 'streams.html';
            return;
        }
    }
    
    loadStreamData() {
        // Load streams from localStorage
        const storedStreams = localStorage.getItem('streamArchive_streams');
        const streams = storedStreams ? JSON.parse(storedStreams) : [];
        

        // Find the stream by ID (handle both string and number comparisons)
        this.streamData = streams.find(stream => {
            const streamIdStr = String(stream.id);
            const searchIdStr = String(this.streamId);
            return streamIdStr === searchIdStr;
        });
        
        if (!this.streamData) {
            console.error('Stream not found! Available IDs:', streams.map(s => s.id));
            this.showStreamNotFound();
            return;
        }
        

        
        this.populateStreamInfo();
        this.initializePlayer();
        this.loadChatData();
    }
    
    showStreamNotFound() {
        // Show error message when stream is not found
        const container = document.querySelector('.stream-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>Stream nicht gefunden</h2>
                    <p>Der angeforderte Stream konnte nicht gefunden werden.</p>
                    <a href="streams.html" class="btn btn-primary">Zurück zu den Streams</a>
                </div>
            `;
        }
    }
    
    populateStreamInfo() {
        if (!this.streamData) return;
        
        // Update page title
        document.title = `${this.streamData.title} - Factor_KS`;
        
        // Update stream info
        const titleElement = document.getElementById('streamTitle');
        const gameElement = document.getElementById('streamGame');
        const dateElement = document.getElementById('streamDate');
        const durationElement = document.getElementById('streamDuration');
        const viewsElement = document.getElementById('streamViews');
        const tagsElement = document.getElementById('streamTags');
        const descriptionElement = document.getElementById('streamDescriptionText');
        
        if (titleElement) titleElement.textContent = this.streamData.title;
        if (gameElement) gameElement.textContent = this.streamData.game;
        if (dateElement) dateElement.textContent = this.formatDate(this.streamData.date);
        if (durationElement) durationElement.textContent = this.formatDuration(this.streamData.duration);
        if (viewsElement) viewsElement.textContent = this.formatViews(this.streamData.views);
        if (descriptionElement) descriptionElement.textContent = this.streamData.description;
        
        // Update tags
        if (tagsElement && this.streamData.tags) {
            tagsElement.innerHTML = this.streamData.tags
                .map(tag => `<span class="stream-tag">${tag}</span>`)
                .join('');
        }
    }
    
    initializePlayer() {
        if (!this.streamData || !this.streamData.link) return;
        
        // Prevent multiple initialization attempts
        if (this.initializingPlayer) return;
        this.initializingPlayer = true;
        
        // Clean the video URL by removing extra spaces and backticks
        const cleanUrl = this.streamData.link.trim().replace(/`/g, '');
        
        if (!cleanUrl) {
            console.error('No valid video URL found after cleaning');
            this.initializingPlayer = false;
            return;
        }
        
        // Wait for player.js to be loaded
        if (window.HLSPlayer) {
            this.videoElement = document.getElementById('hlsPlayer');
            if (!this.videoElement) {
                this.initializingPlayer = false;
                return;
            }
            
            // Set the source directly on the video element for HTML visibility
            this.videoElement.src = cleanUrl;

            
            this.player = new HLSPlayer(this.videoElement, {
                streamId: this.streamId,
                autoplay: false
            });
            
            // Load the stream with cleaned URL
    
            this.player.loadStream(cleanUrl, this.streamData.chatData?.video?.chapters || []);
            
            // Connect chat sync to player
            if (this.chatSync) {
                this.player.chatSync = this.chatSync;
            }
            
            this.initializingPlayer = false;
        } else {
            // Initialize retry counter if not exists
            if (!this.playerRetryCount) this.playerRetryCount = 0;
            
            if (this.playerRetryCount < 50) { // Max 5 seconds of retries
                this.playerRetryCount++;
                setTimeout(() => {
                    this.initializingPlayer = false;
                    this.initializePlayer();
                }, 100);
            } else {
                console.error('HLSPlayer not available after maximum retries');
                this.initializingPlayer = false;
            }
        }
    }
    
    loadChatData() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) {
            console.error('Chat container not found!');
            return;
        }
        
        // Initialize chat sync
        if (window.ChatSync) {
            this.chatSync = new ChatSync(chatContainer, {
                maxMessages: 500,
                showTimestamps: true,
                enableEmotes: true,
                autoScroll: true
            });
            
            // Load chat data if available
            if (this.streamData.chatData) {
                this.chatSync.loadChatData(this.streamData.chatData);
            } else {
                this.chatSync.showEmpty();
            }
            
            // Connect to player if available
            if (this.player) {
                this.player.chatSync = this.chatSync;
            }
        } else {
            console.error('ChatSync class not available!');
        }
    }
    
    setupEventListeners() {
        // Favorite button
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareStream();
            });
        }
        
        // Chat sync toggle
        const chatSyncToggle = document.getElementById('chatSyncToggle');
        if (chatSyncToggle) {
            chatSyncToggle.addEventListener('click', () => {
                this.toggleChatSync();
            });
        }
        
        // Chat settings
        const chatSettingsBtn = document.getElementById('chatSettingsBtn');
        if (chatSettingsBtn) {
            chatSettingsBtn.addEventListener('click', () => {
                this.showChatSettings();
            });
        }
    }
    
    toggleFavorite() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (!favoriteBtn) return;
        
        const icon = favoriteBtn.querySelector('i');
        const text = favoriteBtn.querySelector('span') || favoriteBtn;
        
        const isFavorited = icon.classList.contains('fas');
        
        if (isFavorited) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            text.textContent = 'Favorit';
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            text.textContent = 'Favorisiert';
        }
        
        // Save to localStorage
        const favorites = JSON.parse(localStorage.getItem('streamFavorites') || '[]');
        if (isFavorited) {
            const index = favorites.indexOf(this.streamId);
            if (index > -1) {
                favorites.splice(index, 1);
            }
        } else {
            if (!favorites.includes(this.streamId)) {
                favorites.push(this.streamId);
            }
        }
        localStorage.setItem('streamFavorites', JSON.stringify(favorites));
        
        this.showToast(isFavorited ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
    }
    
    shareStream() {
        if (!this.streamData) return;
        
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: this.streamData.title,
                text: this.streamData.description,
                url: url
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Link in Zwischenablage kopiert!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showToast('Link in Zwischenablage kopiert!');
            });
        }
    }
    
    toggleChatSync() {
        if (!this.chatSync) return;
        
        const syncToggle = document.getElementById('chatSyncToggle');
        const syncIndicator = document.getElementById('chatSyncIndicator');
        
        // Toggle auto-scroll (which effectively toggles sync)
        const currentAutoScroll = this.chatSync.options.autoScroll;
        this.chatSync.setAutoScroll(!currentAutoScroll);
        
        // Update UI
        if (syncToggle) {
            const icon = syncToggle.querySelector('i');
            if (currentAutoScroll) {
                icon.classList.remove('fa-sync');
                icon.classList.add('fa-pause');
                syncToggle.title = 'Chat-Synchronisation aktivieren';
            } else {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-sync');
                syncToggle.title = 'Chat-Synchronisation pausieren';
            }
        }
        
        if (syncIndicator) {
            const text = syncIndicator.querySelector('span');
            if (text) {
                text.textContent = currentAutoScroll ? 'Chat pausiert' : 'Chat synchronisiert';
            }
            syncIndicator.style.opacity = currentAutoScroll ? '0.6' : '1';
        }
    }
    
    showChatSettings() {
        // Simple settings modal (in a real app, this would be more sophisticated)
        const settings = {
            showTimestamps: this.chatSync?.options.showTimestamps ?? true,
            enableEmotes: this.chatSync?.options.enableEmotes ?? true,
            maxMessages: this.chatSync?.options.maxMessages ?? 500
        };
        
        const newShowTimestamps = confirm('Zeitstempel anzeigen? (OK = Ja, Abbrechen = Nein)');
        const newEnableEmotes = confirm('Emotes aktivieren? (OK = Ja, Abbrechen = Nein)');
        
        if (this.chatSync) {
            this.chatSync.options.showTimestamps = newShowTimestamps;
            this.chatSync.options.enableEmotes = newEnableEmotes;
            
            // Reload chat to apply settings
            if (this.streamData.chatData) {
                this.chatSync.loadChatData(this.streamData.chatData);
            }
        }
        
        this.showToast('Chat-Einstellungen aktualisiert');
    }
    
    showStreamNotFound() {
        const main = document.querySelector('.main .container');
        if (main) {
            main.innerHTML = `
                <div class="stream-not-found">
                    <i class="fas fa-video-slash"></i>
                    <h2>Stream nicht gefunden</h2>
                    <p>Der angeforderte Stream konnte nicht gefunden werden.</p>
                    <a href="streams.html" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i>
                        Zurück zu den Streams
                    </a>
                </div>
            `;
        }
        
        // Add CSS for not found page
        const style = document.createElement('style');
        style.textContent = `
            .stream-not-found {
                text-align: center;
                padding: 4rem 2rem;
                color: var(--text-secondary);
            }
            .stream-not-found i {
                font-size: 4rem;
                margin-bottom: 1rem;
                color: var(--text-tertiary);
            }
            .stream-not-found h2 {
                color: var(--text-primary);
                margin-bottom: 1rem;
            }
            .stream-not-found p {
                margin-bottom: 2rem;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
            }
        `;
        document.head.appendChild(style);
    }
    
    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--accent-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInUp 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatViews(views) {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        } else {
            return views.toString();
        }
    }
    
    // Public API
    getStreamData() {
        return this.streamData;
    }
    
    getPlayer() {
        return this.player;
    }
    
    getChatSync() {
        return this.chatSync;
    }
}

// Initialize stream page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.streamPage = new StreamPage();
    
    // Load favorites state
    const favorites = JSON.parse(localStorage.getItem('streamFavorites') || '[]');
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    if (favoriteBtn && window.streamPage.streamId && favorites.includes(window.streamPage.streamId)) {
        const icon = favoriteBtn.querySelector('i');
        const text = favoriteBtn.querySelector('span') || favoriteBtn;
        
        icon.classList.remove('far');
        icon.classList.add('fas');
        text.textContent = 'Favorisiert';
    }
});