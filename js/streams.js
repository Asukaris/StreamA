// StreamsManager class for handling the streams page functionality
console.log('[STREAMS] streams.js file loaded and executing');

class StreamsManager {
    constructor() {
        console.log('[STREAMS] StreamsManager constructor called');
        this.streams = [];
        this.filteredStreams = [];
        this.currentPage = 1;
        this.streamsPerPage = 12;
        this.filters = {
            search: '',
            game: '',
            sort: 'newest',
            dateFrom: '',
            dateTo: '',
            duration: '',
            tags: []
        };
        
        console.log('[STREAMS] Starting initialization');
        this.init();
    }
    
    async init() {
        console.log('[STREAMS] Init method called');
        await this.loadMockStreams();
        this.setupEventListeners();
        this.renderStreams();
        console.log('[STREAMS] Initialization completed');
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('streamSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        // Filter selects
        const gameFilter = document.getElementById('gameFilter');
        if (gameFilter) {
            gameFilter.addEventListener('change', (e) => {
                this.filters.game = e.target.value;
                this.applyFilters();
            });
        }
        
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }
        
        // Advanced filters toggle
        const filterToggle = document.getElementById('filterToggle');
        const advancedFilters = document.getElementById('advancedFilters');
        if (filterToggle && advancedFilters) {
            filterToggle.addEventListener('click', () => {
                const isVisible = advancedFilters.style.display !== 'none';
                advancedFilters.style.display = isVisible ? 'none' : 'grid';
                filterToggle.innerHTML = isVisible ? 
                    '<i class="fas fa-filter"></i> Filter' : 
                    '<i class="fas fa-filter"></i> Filter ausblenden';
            });
        }
        
        // Advanced filter inputs
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const durationFilter = document.getElementById('durationFilter');
        
        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
                this.applyFilters();
            });
        }
        
        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
                this.applyFilters();
            });
        }
        
        if (durationFilter) {
            durationFilter.addEventListener('change', (e) => {
                this.filters.duration = e.target.value;
                this.applyFilters();
            });
        }
        
        // Tag filters
        const tagCheckboxes = document.querySelectorAll('.tag-filter input[type="checkbox"]');
        tagCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.filters.tags.push(e.target.value);
                } else {
                    this.filters.tags = this.filters.tags.filter(tag => tag !== e.target.value);
                }
                this.applyFilters();
            });
        });
        
        // Filter actions
        const applyFilters = document.getElementById('applyFilters');
        const clearFilters = document.getElementById('clearFilters');
        
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderStreams();
                    this.scrollToTop();
                }
            });
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredStreams.length / this.streamsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderStreams();
                    this.scrollToTop();
                }
            });
        }
        
        // Clear search button
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }
    
    async loadMockStreams() {
        try {
            console.log('[STREAMS] Starting to load streams from API');
            // Load streams from API
            const response = await fetch(`${CONFIG.getApiBase()}/streams`);
            console.log('[STREAMS] API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('[STREAMS] API response data:', data);
                this.streams = data.data?.streams || [];
                console.log('[STREAMS] Loaded streams count:', this.streams.length);
                console.log('[STREAMS] First stream data:', this.streams[0]);
            } else {
                console.error('[STREAMS] Failed to load streams:', response.statusText);
                this.streams = [];
            }
        } catch (error) {
            console.error('[STREAMS] Error loading streams:', error);
            console.log('[STREAMS] Using mock data as fallback');
            // Use mock data as fallback
            this.streams = [
                {
                    id: 1,
                    title: "Test Stream 1",
                    description: "Ein Test-Stream für die Entwicklung",
                    game: "Test Game",
                    duration: 3600,
                    created_at: "2024-01-15T10:00:00Z",
                    thumbnail: "https://via.placeholder.com/320x180",
                    tags: ["test", "development"]
                },
                {
                    id: 2,
                    title: "Test Stream 2",
                    description: "Noch ein Test-Stream",
                    game: "Another Game",
                    duration: 7200,
                    created_at: "2024-01-16T14:30:00Z",
                    thumbnail: "https://via.placeholder.com/320x180",
                    tags: ["test", "gaming"]
                }
            ];
            console.log('[STREAMS] Mock data loaded, streams count:', this.streams.length);
        }
        
        this.filteredStreams = [...this.streams];
        console.log('[STREAMS] Filtered streams count:', this.filteredStreams.length);
    }
    
    applyFilters() {
        this.filteredStreams = this.streams.filter(stream => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const tags = Array.isArray(stream.tags) ? stream.tags : (stream.tags ? stream.tags.split(',') : []);
                const matchesSearch = 
                    (stream.title || '').toLowerCase().includes(searchTerm) ||
                    (stream.description || '').toLowerCase().includes(searchTerm) ||
                    (stream.game || '').toLowerCase().includes(searchTerm) ||
                    tags.some(tag => tag.toLowerCase().includes(searchTerm));
                
                if (!matchesSearch) return false;
            }
            
            // Game filter
            if (this.filters.game && stream.game !== this.filters.game) {
                return false;
            }
            
            // Date filters
            if (this.filters.dateFrom) {
                const streamDate = new Date(stream.created_at || stream.createdAt).toISOString().split('T')[0];
                if (streamDate < this.filters.dateFrom) return false;
            }
            
            if (this.filters.dateTo) {
                const streamDate = new Date(stream.created_at || stream.createdAt).toISOString().split('T')[0];
                if (streamDate > this.filters.dateTo) return false;
            }
            
            // Duration filter
            if (this.filters.duration) {
                const hours = stream.duration / 3600;
                switch (this.filters.duration) {
                    case 'short':
                        if (hours >= 1) return false;
                        break;
                    case 'medium':
                        if (hours < 1 || hours > 3) return false;
                        break;
                    case 'long':
                        if (hours <= 3) return false;
                        break;
                }
            }
            
            // Tags filter
            if (this.filters.tags.length > 0) {
                const tags = Array.isArray(stream.tags) ? stream.tags : (stream.tags ? stream.tags.split(',') : []);
                const hasMatchingTag = this.filters.tags.some(tag => 
                    tags.includes(tag)
                );
                if (!hasMatchingTag) return false;
            }
            
            return true;
        });
        
        // Apply sorting
        this.sortStreams();
        
        // Reset to first page
        this.currentPage = 1;
        
        // Render results
        this.renderStreams();
    }
    
    sortStreams() {
        switch (this.filters.sort) {
            case 'newest':
                this.filteredStreams.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
                break;
            case 'oldest':
                this.filteredStreams.sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt));
                break;
            case 'duration':
                this.filteredStreams.sort((a, b) => (b.duration || 0) - (a.duration || 0));
                break;
            case 'views':
                this.filteredStreams.sort((a, b) => (b.view_count || b.viewCount || 0) - (a.view_count || a.viewCount || 0));
                break;
        }
    }
    
    clearFilters() {
        // Reset all filters
        this.filters = {
            search: '',
            game: '',
            sort: 'newest',
            dateFrom: '',
            dateTo: '',
            duration: '',
            tags: []
        };
        
        // Reset form inputs
        const searchInput = document.getElementById('streamSearch');
        const gameFilter = document.getElementById('gameFilter');
        const sortFilter = document.getElementById('sortFilter');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const durationFilter = document.getElementById('durationFilter');
        const tagCheckboxes = document.querySelectorAll('.tag-filter input[type="checkbox"]');
        
        if (searchInput) searchInput.value = '';
        if (gameFilter) gameFilter.value = '';
        if (sortFilter) sortFilter.value = 'newest';
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (durationFilter) durationFilter.value = '';
        
        tagCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Apply filters (which will show all streams)
        this.applyFilters();
    }
    
    renderStreams() {
        console.log('[STREAMS] Starting renderStreams function');
        const grid = document.getElementById('streamsGrid');
        const pagination = document.getElementById('pagination');
        const emptyState = document.getElementById('emptyState');
        
        console.log('[STREAMS] DOM elements found:', {
            grid: !!grid,
            pagination: !!pagination,
            emptyState: !!emptyState
        });
        
        if (!grid) {
            console.error('[STREAMS] streamsGrid element not found!');
            return;
        }
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.streamsPerPage;
        const endIndex = startIndex + this.streamsPerPage;
        const paginatedStreams = this.filteredStreams.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.filteredStreams.length / this.streamsPerPage);
        
        console.log('[STREAMS] Pagination info:', {
            filteredStreamsCount: this.filteredStreams.length,
            currentPage: this.currentPage,
            streamsPerPage: this.streamsPerPage,
            paginatedStreamsCount: paginatedStreams.length,
            totalPages: totalPages
        });
        
        // Show/hide empty state
        if (this.filteredStreams.length === 0) {
            console.log('[STREAMS] No streams to display, showing empty state');
            grid.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            console.log('[STREAMS] Displaying streams grid');
            grid.style.display = 'grid';
            if (pagination) pagination.style.display = 'flex';
            if (emptyState) emptyState.style.display = 'none';
        }
        
        // Render stream cards
        console.log('[STREAMS] Creating stream cards for', paginatedStreams.length, 'streams');
        const cardsHTML = paginatedStreams.map(stream => this.createStreamCard(stream)).join('');
        console.log('[STREAMS] Generated HTML length:', cardsHTML.length);
        grid.innerHTML = cardsHTML;
        console.log('[STREAMS] Grid innerHTML updated');
        
        // Update pagination
        this.updatePagination(totalPages);
        
        // Add click listeners to stream cards
        this.addStreamCardListeners();
        console.log('[STREAMS] renderStreams function completed');
    }
    
    createStreamCard(stream) {
        const duration = this.formatDuration(stream.duration || 0);
        const date = this.formatDate(stream.created_at || stream.createdAt);
        const progressPercent = Math.round((stream.progress || 0) * 100);
        
        // Use thumbnail_url from database with base path or fallback to placeholder
        const basePath = window.CONFIG ? window.CONFIG.getBasePath() : '/';
        const thumbnailUrl = stream.thumbnail_url ? `${basePath}${stream.thumbnail_url}` : `${basePath}css/placeholder-thumbnail.svg`;
        
        return `
            <div class="stream-card" data-stream-id="${stream.id}">
                <div class="stream-thumbnail">
                    <img src="${thumbnailUrl}" alt="${stream.title}" loading="lazy" onerror="this.src='${basePath}css/placeholder-thumbnail.svg'">
                    <div class="stream-duration">
                        <i class="fas fa-clock"></i>
                        ${duration}
                    </div>
                    ${stream.is_live ? '<div class="stream-live-badge"><i class="fas fa-circle"></i> LIVE</div>' : ''}
                </div>
                
                <div class="stream-info">
                    <div class="stream-header">
                        <h3 class="stream-title">${stream.title}</h3>
                    </div>
                    
                    <div class="stream-description">
                        ${stream.description || 'Keine Beschreibung verfügbar'}
                    </div>
                    
                    <div class="stream-footer">
                        <div class="stream-meta">
                            <div class="stream-date">
                                <i class="fas fa-calendar-alt"></i>
                                ${date}
                            </div>
                            <div class="stream-views">
                                <i class="fas fa-eye"></i>
                                ${this.formatViews(stream.viewer_count || 0)}
                            </div>
                        </div>
                        
                        <div class="stream-actions">
                            <button class="stream-btn primary play-btn" title="Stream ansehen">
                                <i class="fas fa-play"></i>
                                Ansehen
                            </button>
                            <button class="stream-btn favorite-btn" title="Zu Favoriten hinzufügen">
                                <i class="far fa-heart"></i>
                            </button>
                            <button class="stream-btn share-btn" title="Teilen">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                        
                        ${progressPercent > 0 ? `
                            <div class="stream-progress">
                                <div class="stream-progress-bar">
                                    <div class="stream-progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <div class="stream-progress-text">${progressPercent}% angesehen</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    updatePagination(totalPages) {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
        }
        
        if (pageInfo) {
            pageInfo.textContent = `Seite ${this.currentPage} von ${totalPages}`;
        }
    }
    
    addStreamCardListeners() {
        const streamCards = document.querySelectorAll('.stream-card');
        streamCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.stream-action-btn')) {
                    return;
                }
                
                const streamId = card.dataset.streamId;
                this.openStream(streamId);
            });
        });
        
        // Add listeners for action buttons
        const favoriteButtons = document.querySelectorAll('.stream-action-btn[title*="Favoriten"]');
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn);
            });
        });
        
        const shareButtons = document.querySelectorAll('.stream-action-btn[title*="Teilen"]');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const streamCard = btn.closest('.stream-card');
                const streamId = streamCard.dataset.streamId;
                this.shareStream(streamId);
            });
        });
    }
    
    openStream(streamId) {
        // Navigate to individual stream page using SPA navigation
        if (window.SPAManager) {
            // Use SPA navigation with hash-based routing
            window.location.hash = `stream?id=${streamId}`;
        } else {
            // Fallback to direct navigation
            window.location.href = `stream.html?id=${streamId}`;
        }
    }
    
    toggleFavorite(button) {
        const icon = button.querySelector('i');
        const isFavorited = icon.classList.contains('fas');
        
        if (isFavorited) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.title = 'Zu Favoriten hinzufügen';
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.title = 'Aus Favoriten entfernen';
        }
        
        // Here you would typically save to localStorage or send to server
        console.log('Favorite toggled for stream');
    }
    
    shareStream(streamId) {
        const stream = this.streams.find(s => s.id === streamId);
        if (!stream) return;
        
        const url = `${window.location.origin}/stream.html?id=${streamId}`;
        
        if (navigator.share) {
            navigator.share({
                title: stream.title,
                text: stream.description,
                url: url
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                // Show toast notification
                this.showToast('Link in Zwischenablage kopiert!');
            });
        }
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
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    formatDuration(milliseconds) {
        // Convert milliseconds to seconds
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
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
            month: 'short',
            day: 'numeric'
        });
    }
    
    formatViews(views) {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views.toString();
    }
}

// Make StreamsManager available globally
window.StreamsManager = StreamsManager;
console.log('[STREAMS] StreamsManager class assigned to window object');

// Initialize streams manager when DOM is loaded (for direct page access)
// SPA navigation will initialize via spa.js initializePageFunctionality
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized by SPA
    if (!window.streamsManager) {
        window.streamsManager = new StreamsManager();
    }
});