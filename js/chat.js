// Twitch Chat Replay System
class ChatSync {
    constructor(chatContainer, options = {}) {
        this.container = chatContainer;
        this.messages = [];
        this.currentTime = 0;
        this.displayedMessages = [];
        this.emoteCache = new Map();
        this.badgeCache = new Map();
        this.isLoading = false;
        
        this.options = {
            maxMessages: options.maxMessages || 500,
            showTimestamps: options.showTimestamps !== false,
            enableEmotes: options.enableEmotes !== false,
            autoScroll: options.autoScroll !== false,
            ...options
        };
        
        this.init();
    }
    
    init() {
        this.setupContainer();
        this.loadEmoteData();
        this.loadBadgeData();
    }
    
    setupContainer() {
        if (!this.container) return;
        
        this.messagesContainer = this.container.querySelector('.chat-messages') || this.container;
        this.showLoading();
    }
    
    async loadChatData(chatData) {
        this.showLoading();
        
        try {
            let data;
            if (typeof chatData === 'string') {
                // If it's a URL, fetch the data
                const response = await fetch(chatData);
                data = await response.json();
            } else {
                // If it's already an object, use it directly
                data = chatData;
            }
            
            this.processChatData(data);
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load chat data:', error);
            this.showError('Chat-Daten konnten nicht geladen werden.');
        }
    }
    
    processChatData(data) {

        this.messages = [];
        
        // Process video chapters as chat markers
        if (data.video && data.video.chapters) {
            data.video.chapters.forEach(chapter => {
                this.messages.push({
                    type: 'chapter',
                    timestamp: chapter.startMilliseconds / 1000,
                    chapter: chapter
                });
            });
        }
        
        // Process chat comments
        if (data.comments && Array.isArray(data.comments)) {
            data.comments.forEach(comment => {
                this.messages.push({
                    type: 'message',
                    timestamp: comment.content_offset_seconds,
                    comment: comment
                });
            });
        }
        
        // Sort messages by timestamp
        this.messages.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    syncToTime(currentTime) {
        this.currentTime = currentTime;
        
        // Find messages that should be displayed at current time (both in seconds)
        const messagesToShow = this.messages.filter(msg => 
            msg.timestamp <= currentTime
        );
        
        // If we've gone backwards in time, clear and rebuild
        if (messagesToShow.length < this.displayedMessages.length) {
            this.displayedMessages = [];
            this.clearMessages();
        }
        
        // Add new messages
        const newMessages = messagesToShow.slice(this.displayedMessages.length);
        newMessages.forEach(msg => {
            this.addMessage(msg);
            this.displayedMessages.push(msg);
        });
        
        // Limit displayed messages
        if (this.displayedMessages.length > this.options.maxMessages) {
            const excess = this.displayedMessages.length - this.options.maxMessages;
            this.displayedMessages.splice(0, excess);
            this.removeOldMessages(excess);
        }
        
        // Auto-scroll to bottom
        if (this.options.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    addMessage(messageData) {
        const messageElement = this.createMessageElement(messageData);
        if (messageElement) {
            this.messagesContainer.appendChild(messageElement);
        }
    }
    
    createMessageElement(messageData) {
        if (messageData.type === 'chapter') {
            return this.createChapterMarker(messageData.chapter);
        } else if (messageData.type === 'message') {
            return this.createChatMessage(messageData.comment);
        }
        return null;
    }
    
    createChapterMarker(chapter) {
        const element = document.createElement('div');
        element.className = 'chat-chapter-marker';
        element.innerHTML = `
            <div class="chat-chapter-title">${chapter.description || chapter.gameDisplayName}</div>
            ${chapter.subDescription ? `<div class="chat-chapter-game">${chapter.subDescription}</div>` : ''}
        `;
        return element;
    }
    
    createChatMessage(comment) {
        const element = document.createElement('div');
        element.className = 'chat-message';
        
        // Add special classes based on user badges
        const badges = comment.message?.user_badges || [];
        if (badges.some(badge => badge._id === 'broadcaster')) {
            element.classList.add('broadcaster');
        } else if (badges.some(badge => badge._id === 'moderator')) {
            element.classList.add('moderator');
        } else if (badges.some(badge => badge._id.includes('subscriber'))) {
            element.classList.add('subscriber');
        }
        
        // Create timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'chat-timestamp';
        if (this.options.showTimestamps) {
            const time = new Date(comment.created_at);
            timestamp.textContent = time.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Create user section
        const userSection = document.createElement('div');
        userSection.className = 'chat-user';
        
        // Add badges
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'chat-badges';
        
        if (badges && badges.length > 0) {
            badges.forEach(badge => {
                const badgeImg = document.createElement('img');
                badgeImg.className = 'chat-badge';
                badgeImg.src = this.getBadgeUrl(badge._id, badge.version);
                badgeImg.alt = badge._id;
                badgeImg.title = this.getBadgeTitle(badge._id);
                badgesContainer.appendChild(badgeImg);
            });
        }
        
        // Add username
        const username = document.createElement('span');
        username.className = 'chat-username';
        username.textContent = comment.commenter?.display_name || comment.commenter?.name || 'Unknown';
        
        // Set user color if available
        if (comment.message?.user_color) {
            username.style.color = comment.message.user_color;
        }
        
        userSection.appendChild(badgesContainer);
        userSection.appendChild(username);
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'chat-message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'chat-text';
        
        // Process message fragments (text and emotes)
        if (comment.message?.fragments) {
            messageText.innerHTML = this.processMessageFragments(comment.message.fragments);
        } else {
            messageText.textContent = comment.message?.body || '';
        }
        
        messageContent.appendChild(messageText);
        
        // Assemble the complete message
        if (this.options.showTimestamps) {
            element.appendChild(timestamp);
        }
        element.appendChild(userSection);
        element.appendChild(messageContent);
        
        return element;
    }
    
    processMessageFragments(fragments) {
        return fragments.map(fragment => {
            if (fragment.emoticon) {
                // This is an emote
                return this.createEmoteHtml(fragment.emoticon, fragment.text);
            } else {
                // This is regular text
                return this.escapeHtml(fragment.text);
            }
        }).join('');
    }
    
    createEmoteHtml(emoticon, text) {
        if (!this.options.enableEmotes) {
            return this.escapeHtml(text);
        }
        
        // For now, return text since we don't have emote URLs in the provided format
        // In a real implementation, you would fetch emote URLs from Twitch API
        return `<span class="chat-emote-text" title="${this.escapeHtml(text)}">${this.escapeHtml(text)}</span>`;
    }
    
    getBadgeUrl(badgeId, version) {
        // Return placeholder badge URLs
        // In a real implementation, fetch from Twitch API
        const badgeMap = {
            'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1',
            'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1',
            'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1',
            'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1'
        };
        
        return badgeMap[badgeId] || 'https://static-cdn.jtvnw.net/badges/v1/default/1';
    }
    
    getBadgeTitle(badgeId) {
        const titleMap = {
            'broadcaster': 'Broadcaster',
            'moderator': 'Moderator',
            'subscriber': 'Subscriber',
            'vip': 'VIP',
            'raging-wolf-helm': 'Raging Wolf Helm'
        };
        
        return titleMap[badgeId] || badgeId;
    }
    
    async loadEmoteData() {
        // In a real implementation, load emote data from:
        // - Twitch API for Twitch emotes
        // - BetterTTV API for BTTV emotes
        // - FrankerFaceZ API for FFZ emotes

    }
    
    async loadBadgeData() {
        // In a real implementation, load badge data from Twitch API

    }
    
    clearMessages() {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
    }
    
    removeOldMessages(count) {
        const messages = this.messagesContainer.children;
        for (let i = 0; i < count && messages.length > 0; i++) {
            messages[0].remove();
        }
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    showLoading() {
        if (!this.messagesContainer) return;
        
        this.messagesContainer.innerHTML = `
            <div class="chat-loading">
                Chat wird geladen...
            </div>
        `;
    }
    
    hideLoading() {
        const loading = this.messagesContainer?.querySelector('.chat-loading');
        if (loading) {
            loading.remove();
        }
    }
    
    showError(message) {
        if (!this.messagesContainer) return;
        
        this.messagesContainer.innerHTML = `
            <div class="chat-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Chat-Fehler</h4>
                <p>${message}</p>
            </div>
        `;
    }
    
    showEmpty() {
        if (!this.messagesContainer) return;
        
        this.messagesContainer.innerHTML = `
            <div class="chat-empty">
                <i class="fas fa-comments"></i>
                <h4>Kein Chat verfügbar</h4>
                <p>Für diesen Stream sind keine Chat-Daten vorhanden.</p>
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Public API methods
    setAutoScroll(enabled) {
        this.options.autoScroll = enabled;
    }
    
    setMaxMessages(max) {
        this.options.maxMessages = max;
    }
    
    getCurrentMessageCount() {
        return this.displayedMessages.length;
    }
    
    jumpToTime(time) {
        this.syncToTime(time);
    }
}

// Make ChatSync available globally
window.ChatSync = ChatSync;