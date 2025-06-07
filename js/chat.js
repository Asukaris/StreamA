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
        this.chapters = [];
        this.currentChapter = null;
        this.currentChapterDisplay = null;
        
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
        this.currentChapterDisplay = document.getElementById('currentChapterDisplay');
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
            this.chapters = data.video.chapters;
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
        
        // Update current chapter display
        this.updateCurrentChapter(currentTime);
        
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
    
    updateCurrentChapter(currentTime) {
        if (!this.chapters || this.chapters.length === 0 || !this.currentChapterDisplay) {
            return;
        }
        
        // Find the current chapter based on timestamp (in seconds)
        let newCurrentChapter = null;
        for (let i = this.chapters.length - 1; i >= 0; i--) {
            const chapter = this.chapters[i];
            const chapterStartTime = chapter.startMilliseconds / 1000;
            if (currentTime >= chapterStartTime) {
                newCurrentChapter = chapter;
                break;
            }
        }
        
        // Only update if chapter has changed
        if (newCurrentChapter !== this.currentChapter) {
            this.currentChapter = newCurrentChapter;
            
            if (this.currentChapter) {
                // Show and update the current chapter display
                const titleElement = document.getElementById('currentChapterTitle');
                const gameElement = document.getElementById('currentChapterGame');
                
                if (titleElement) {
                    titleElement.textContent = this.currentChapter.description || this.currentChapter.gameDisplayName || 'Aktuelles Kapitel';
                }
                
                if (gameElement) {
                    gameElement.textContent = this.currentChapter.subDescription || '';
                    gameElement.style.display = this.currentChapter.subDescription ? 'block' : 'none';
                }
                
                // Load game logo
                this.loadGameLogo(this.currentChapter.gameDisplayName || this.currentChapter.description);
                
                this.currentChapterDisplay.style.display = 'block';
            } else {
                // Hide the current chapter display if no chapter is active
                this.currentChapterDisplay.style.display = 'none';
            }
        }
     }
     
     async loadGameLogo(gameName) {
         if (!gameName) return;
         
         const logoElement = document.getElementById('currentChapterLogo');
         const fallbackIcon = document.getElementById('currentChapterFallbackIcon');
         
         if (!logoElement || !fallbackIcon) return;
         
         // Reset to fallback state
         logoElement.style.display = 'none';
         fallbackIcon.style.display = 'block';
         
         try {
             // Try multiple sources for game logos
             const logoUrl = await this.findGameLogo(gameName);
             
             if (logoUrl) {
                 // Test if image loads successfully
                 const img = new Image();
                 img.onload = () => {
                     logoElement.src = logoUrl;
                     logoElement.style.display = 'block';
                     fallbackIcon.style.display = 'none';
                 };
                 img.onerror = () => {
                     // Keep fallback icon if image fails to load
                     console.log('Failed to load game logo for:', gameName);
                 };
                 img.src = logoUrl;
             }
         } catch (error) {
             console.log('Error loading game logo:', error);
         }
     }
     
     async findGameLogo(gameName) {
         // Clean game name for better search results
         const cleanName = gameName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
         
         // Try different logo sources
         const logoSources = [
             // Steam API (unofficial)
             () => this.getSteamLogo(cleanName),
             // IGDB API (requires API key, fallback to generic search)
             () => this.getGenericGameLogo(cleanName),
             // Fallback to a game logo database
             () => this.getFallbackLogo(cleanName)
         ];
         
         for (const source of logoSources) {
             try {
                 const logoUrl = await source();
                 if (logoUrl) return logoUrl;
             } catch (error) {
                 console.log('Logo source failed:', error);
             }
         }
         
         return null;
     }
     
     async getSteamLogo(gameName) {
        // Initialize chatLogos outside try-catch to ensure it's always available
        let chatLogos = {};
        
        try {
            // Load logo database from API
            const apiBase = window.CONFIG?.apiBase || '/api';
            const response = await fetch(`${apiBase}/logos`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    // Convert API data to lookup object
                    data.data.forEach(logo => {
                        const gameName = (logo.game_name || logo.gameName || '').toLowerCase();
                        const logoUrl = logo.logo_url || logo.logoUrl;
                        if (gameName && logoUrl) {
                            chatLogos[gameName] = logoUrl;
                            
                            // Also add aliases
                            if (logo.aliases && Array.isArray(logo.aliases)) {
                                logo.aliases.forEach(alias => {
                                    if (alias && alias.trim()) {
                                        chatLogos[alias.toLowerCase().trim()] = logoUrl;
                                    }
                                });
                            }
                        }
                    });
                }
            } else {
                console.warn('Failed to load logos from API, using fallback');
            }
        } catch (error) {
            console.warn('Error loading logos from API:', error);
        }
        
        // Fallback to default logos if API fails or is empty
        const defaultGames = {
            'minecraft': 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-96x96.png',
            'fortnite': 'https://cdn2.unrealengine.com/Fortnite%2Ffn-game-icon-285x285-285x285-0b364143e0c9.png',
            'valorant': 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5c6a35b51b0e8c7e/5eb26f5e31bb7e28d2444b7e/V_LOGOMARK_1920x1080_Red.png',
            'league of legends': 'https://universe-meeps.leagueoflegends.com/v1/assets/images/factions/demacia-crest.png',
            'world of warcraft': 'https://bnetcmsus-a.akamaihd.net/cms/gallery/LKXYBFP8ZZ6D1509472919930.png',
            'overwatch': 'https://d15f34w2p8l1cc.cloudfront.net/overwatch/images/logos/overwatch-share-icon.jpg',
            'counter-strike': 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
            'dota 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
            'apex legends': 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-legends-meta-image.jpg'
        };
        
        // Combine API logos with default logos (API logos take priority)
        const allLogos = { ...defaultGames, ...chatLogos };
        
        const lowerName = gameName.toLowerCase().trim();
        
        console.log('Looking for logo for game:', gameName);
        console.log('Normalized name:', lowerName);
        console.log('Available logos:', Object.keys(allLogos));
        
        // First try exact match
        if (allLogos[lowerName]) {
            console.log('Found exact match:', lowerName);
            return allLogos[lowerName];
        }
        
        // Try case-insensitive exact match
        for (const [game, logo] of Object.entries(allLogos)) {
            if (game.toLowerCase() === lowerName) {
                console.log('Found case-insensitive exact match:', game);
                return logo;
            }
        }
        
        // Then try partial matches
        for (const [game, logo] of Object.entries(allLogos)) {
            const lowerGame = game.toLowerCase();
            if (lowerName.includes(lowerGame) || lowerGame.includes(lowerName)) {
                console.log('Found partial match:', game, 'for', lowerName);
                return logo;
            }
        }
        
        console.log('No logo found for:', lowerName);
        return null;
    }
     
     async getGenericGameLogo(gameName) {
         // This would typically use a proper game database API
         // For demonstration, we'll return null and let it fall back
         return null;
     }
     
     async getFallbackLogo(gameName) {
         // Generate a simple text-based logo as ultimate fallback
         // This creates a data URL with the first letter of the game
         const firstLetter = gameName.charAt(0).toUpperCase();
         const canvas = document.createElement('canvas');
         canvas.width = 40;
         canvas.height = 40;
         const ctx = canvas.getContext('2d');
         
         // Create gradient background
         const gradient = ctx.createLinearGradient(0, 0, 40, 40);
         gradient.addColorStop(0, '#667eea');
         gradient.addColorStop(1, '#764ba2');
         
         ctx.fillStyle = gradient;
         ctx.fillRect(0, 0, 40, 40);
         
         // Add text
         ctx.fillStyle = 'white';
         ctx.font = 'bold 20px Arial';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(firstLetter, 20, 20);
         
         return canvas.toDataURL();
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