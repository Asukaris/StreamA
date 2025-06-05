// Streams Page JavaScript
class StreamsManager {
    constructor() {
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
        
        this.init();
    }
    
    init() {
        this.loadMockStreams();
        this.setupEventListeners();
        this.renderStreams();
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
    
    loadMockStreams() {
        // Load streams from localStorage or initialize empty array
        this.streams = JSON.parse(localStorage.getItem('streamArchive_streams') || '[]');
        this.filteredStreams = [...this.streams];
    }
    
    applyFilters() {
        this.filteredStreams = this.streams.filter(stream => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesSearch = 
                    stream.title.toLowerCase().includes(searchTerm) ||
                    stream.description.toLowerCase().includes(searchTerm) ||
                    stream.game.toLowerCase().includes(searchTerm) ||
                    stream.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                
                if (!matchesSearch) return false;
            }
            
            // Game filter
            if (this.filters.game && stream.game !== this.filters.game) {
                return false;
            }
            
            // Date filters
            if (this.filters.dateFrom) {
                const streamDate = new Date(stream.createdAt).toISOString().split('T')[0];
                if (streamDate < this.filters.dateFrom) return false;
            }
            
            if (this.filters.dateTo) {
                const streamDate = new Date(stream.createdAt).toISOString().split('T')[0];
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
                const hasMatchingTag = this.filters.tags.some(tag => 
                    stream.tags.includes(tag)
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
                this.filteredStreams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                this.filteredStreams.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'duration':
                this.filteredStreams.sort((a, b) => b.duration - a.duration);
                break;
            case 'views':
                this.filteredStreams.sort((a, b) => b.viewCount - a.viewCount);
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
        const grid = document.getElementById('streamsGrid');
        const pagination = document.getElementById('pagination');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.streamsPerPage;
        const endIndex = startIndex + this.streamsPerPage;
        const paginatedStreams = this.filteredStreams.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.filteredStreams.length / this.streamsPerPage);
        
        // Show/hide empty state
        if (this.filteredStreams.length === 0) {
            grid.style.display = 'none';
            pagination.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        } else {
            grid.style.display = 'grid';
            pagination.style.display = 'flex';
            emptyState.style.display = 'none';
        }
        
        // Render stream cards
        grid.innerHTML = paginatedStreams.map(stream => this.createStreamCard(stream)).join('');
        
        // Update pagination
        this.updatePagination(totalPages);
        
        // Add click listeners to stream cards
        this.addStreamCardListeners();
    }
    
    createStreamCard(stream) {
        const duration = this.formatDuration(stream.duration);
        const date = this.formatDate(stream.createdAt);
        const progressPercent = Math.round(stream.progress * 100);
        
        return `
            <div class="stream-card" data-stream-id="${stream.id}">
                <div class="stream-thumbnail">
                    <img src="${stream.thumbnail}" alt="${stream.title}" loading="lazy">
                    <div class="stream-duration">${duration}</div>
                </div>
                
                <div class="stream-info">
                    <h3 class="stream-title">${stream.title}</h3>
                    <div class="stream-game">${stream.game}</div>
                    
                    <div class="stream-meta">
                        <div class="stream-date">
                            <i class="fas fa-calendar"></i>
                            ${date}
                        </div>
                        <div class="stream-views">
                            <i class="fas fa-eye"></i>
                            ${stream.viewCount}
                        </div>
                    </div>
                    
                    <div class="stream-tags">
                        ${stream.tags.map(tag => `<span class="stream-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="stream-description">
                        ${stream.description}
                    </div>
                    
                    <div class="stream-actions">
                        <div class="stream-progress" title="${progressPercent}% angesehen">
                            <div class="stream-progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                        <button class="stream-action-btn" title="Zu Favoriten hinzufügen">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="stream-action-btn" title="Teilen">
                            <i class="fas fa-share"></i>
                        </button>
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
        // Navigate to individual stream page
        window.location.href = `stream.html?id=${streamId}`;
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
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize streams manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.streamsManager = new StreamsManager();
});