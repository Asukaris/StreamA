// HLS Video Player with Chapter Support
class HLSPlayer {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.hls = null;
        this.currentQuality = 'auto';
        this.chapters = [];
        this.currentChapter = null;
        this.isPlaying = false;
        this.streamId = options.streamId || null;
        this.chatSync = options.chatSync || null;
        
        this.init();
    }
    
    init() {
        this.setupHLS();
        this.setupEventListeners();
        this.setupCustomControls();
        this.loadProgress();
    }
    
    setupHLS() {
        if (Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
            });
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                this.onManifestParsed(data);
            });
            
            this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                this.onLevelSwitched(data);
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                this.onError(data);
            });
            
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            this.video.addEventListener('loadedmetadata', () => {
                this.onManifestParsed();
            });
        } else {
            this.showError('HLS wird von diesem Browser nicht unterstützt.');
        }
    }
    
    loadStream(url, chapters = []) {
        this.chapters = chapters;
        this.showLoading();
        
        if (this.hls) {
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
        } else {
            this.video.src = url;
        }
    }
    
    setupEventListeners() {
        // Video events
        this.video.addEventListener('loadstart', () => this.showLoading());
        this.video.addEventListener('canplay', () => this.hideLoading());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('ended', () => this.onEnded());
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.onPause());
        
        // Quality selector will be handled in setupCustomControlsEvents
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seek(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seek(10);
                    break;
                case 'KeyF':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
            }
        });
    }
    
    setupCustomControls() {
        // Create custom controls overlay if needed
        const playerContainer = this.video.parentElement;
        
        // Create custom controls bar
        this.createCustomControlsBar(playerContainer);
        
        // Chapter timeline
        if (this.chapters.length > 0) {
            this.createChapterNavigation(playerContainer);
        }
    }
    
    createCustomControlsBar(container) {
        // Remove existing custom controls if any
        const existingControls = container.querySelector('.custom-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const controlsBar = document.createElement('div');
        controlsBar.className = 'custom-controls';
        
        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-bar" id="progressBar">
                <div class="progress-filled" id="progressFilled"></div>
                <div class="progress-handle" id="progressHandle"></div>
            </div>
        `;
        
        // Controls row
        const controlsRow = document.createElement('div');
        controlsRow.className = 'controls-row';
        
        // Play/Pause button
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'play-pause-btn';
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Time display
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        timeDisplay.textContent = '00:00 / 00:00';
        
        // Quality selector
        const qualityContainer = document.createElement('div');
        qualityContainer.className = 'quality-control';
        qualityContainer.innerHTML = `
            <select id="qualitySelect" class="quality-select">
                <option value="-1">Auto</option>
            </select>
        `;
        
        // Volume control
        const volumeControl = document.createElement('div');
        volumeControl.className = 'volume-control';
        volumeControl.innerHTML = `
            <button class="volume-btn" id="volumeBtn">
                <i class="fas fa-volume-up"></i>
            </button>
            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100">
        `;
        
        // Fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Assemble controls
        controlsRow.appendChild(playPauseBtn);
        controlsRow.appendChild(timeDisplay);
        controlsRow.appendChild(qualityContainer);
        controlsRow.appendChild(volumeControl);
        controlsRow.appendChild(fullscreenBtn);
        
        controlsBar.appendChild(progressContainer);
        controlsBar.appendChild(controlsRow);
        
        container.appendChild(controlsBar);
        
        // Setup event listeners for new controls
        this.setupCustomControlsEvents();
    }
    
    setupCustomControlsEvents() {
        // Progress bar interaction
        const progressBar = document.getElementById('progressBar');
        const progressHandle = document.getElementById('progressHandle');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const time = percent * this.video.duration;
                this.video.currentTime = time;
            });
            
            // Show handle on hover
            progressBar.addEventListener('mouseenter', () => {
                if (progressHandle) {
                    progressHandle.style.opacity = '1';
                }
            });
            
            progressBar.addEventListener('mouseleave', () => {
                if (progressHandle) {
                    progressHandle.style.opacity = '0';
                }
            });
            
            // Show time preview on mouse move
            progressBar.addEventListener('mousemove', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const time = percent * this.video.duration;
                
                if (time >= 0 && time <= this.video.duration) {
                    this.showTimePreview(e.clientX, time);
                }
            });
            
            progressBar.addEventListener('mouseleave', () => {
                this.hideTimePreview();
            });
        }
        
        // Volume controls
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.video.volume = e.target.value / 100;
                this.updateVolumeIcon();
            });
        }
        
        // Quality selector
        const qualitySelect = document.getElementById('qualitySelect');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                this.setQuality(e.target.value);
            });
        }
        
        // Update play/pause button on video state change
        this.video.addEventListener('play', () => {
            const btn = document.querySelector('.play-pause-btn i');
            if (btn) btn.className = 'fas fa-pause';
        });
        
        this.video.addEventListener('pause', () => {
            const btn = document.querySelector('.play-pause-btn i');
            if (btn) btn.className = 'fas fa-play';
        });
    }
    
    updateVolumeIcon() {
        const volumeBtn = document.getElementById('volumeBtn');
        if (!volumeBtn) return;
        
        const icon = volumeBtn.querySelector('i');
        if (this.video.muted || this.video.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.video.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    showTimePreview(mouseX, time) {
        let timePreview = document.getElementById('timePreview');
        if (!timePreview) {
            timePreview = document.createElement('div');
            timePreview.id = 'timePreview';
            timePreview.className = 'time-preview';
            document.body.appendChild(timePreview);
        }
        
        timePreview.textContent = this.formatTime(time);
        timePreview.style.left = `${mouseX - 25}px`;
        timePreview.style.display = 'block';
        
        // Position above the progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const rect = progressBar.getBoundingClientRect();
            timePreview.style.top = `${rect.top - 35}px`;
        }
    }
    
    hideTimePreview() {
        const timePreview = document.getElementById('timePreview');
        if (timePreview) {
            timePreview.style.display = 'none';
        }
    }
    
    createChapterNavigation(container) {
        const chapterNav = document.createElement('div');
        chapterNav.className = 'chapter-navigation';
        
        const timeline = document.createElement('div');
        timeline.className = 'chapter-timeline';
        
        const progress = document.createElement('div');
        progress.className = 'chapter-progress';
        timeline.appendChild(progress);
        
        const markers = document.createElement('div');
        markers.className = 'chapter-markers';
        
        // Add chapter markers
        this.chapters.forEach((chapter, index) => {
            const marker = document.createElement('div');
            marker.className = 'chapter-marker';
            marker.style.left = `${(chapter.startMilliseconds / this.video.duration / 1000) * 100}%`;
            marker.title = chapter.description;
            markers.appendChild(marker);
        });
        
        timeline.appendChild(markers);
        
        const info = document.createElement('div');
        info.className = 'chapter-info';
        info.innerHTML = `
            <span class="current-chapter">Kapitel wird geladen...</span>
            <span class="chapter-time">00:00</span>
        `;
        
        chapterNav.appendChild(timeline);
        chapterNav.appendChild(info);
        container.appendChild(chapterNav);
        
        // Timeline click handler
        timeline.addEventListener('click', (e) => {
            const rect = timeline.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * this.video.duration;
            this.video.currentTime = time;
        });
    }
    
    onManifestParsed(data) {
        this.hideLoading();
        this.populateQualitySelector(data);
    }
    
    populateQualitySelector(data) {
        const qualitySelect = document.getElementById('qualitySelect');
        if (!qualitySelect || !this.hls) return;
        
        // Clear existing options except auto
        qualitySelect.innerHTML = '<option value="-1">Auto</option>';
        
        // Add quality levels
        this.hls.levels.forEach((level, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${level.height}p`;
            qualitySelect.appendChild(option);
        });
    }
    
    setQuality(levelIndex) {
        if (!this.hls) return;
        
        const level = parseInt(levelIndex);
        this.hls.currentLevel = level;
        this.currentQuality = level === -1 ? 'auto' : `${this.hls.levels[level].height}p`;
    }
    
    onLevelSwitched(data) {
        console.log(`Quality switched to: ${this.hls.levels[data.level].height}p`);
    }
    
    onTimeUpdate() {
        const currentTime = this.video.currentTime;
        
        // Update chapter navigation
        this.updateChapterDisplay(currentTime);
        
        // Update progress bar
        this.updateProgressBar(currentTime);
        
        // Update custom controls
        this.updateCustomControls(currentTime);
        
        // Save progress
        this.saveProgress(currentTime);
        
        // Sync chat if available
        if (this.chatSync) {
            this.chatSync.syncToTime(currentTime);
        }
    }
    
    updateCustomControls(currentTime) {
        // Update progress bar
        const progressFilled = document.getElementById('progressFilled');
        const progressHandle = document.getElementById('progressHandle');
        if (progressFilled && this.video.duration) {
            const percent = (currentTime / this.video.duration) * 100;
            progressFilled.style.width = `${percent}%`;
            
            // Update progress handle position
            if (progressHandle) {
                progressHandle.style.left = `${percent}%`;
            }
        }
        
        // Update time display
        const timeDisplay = document.querySelector('.time-display');
        if (timeDisplay && this.video.duration) {
            const current = this.formatTime(currentTime);
            const total = this.formatTime(this.video.duration);
            timeDisplay.textContent = `${current} / ${total}`;
        }
    }
    
    updateChapterDisplay(currentTime) {
        if (this.chapters.length === 0) return;
        
        const currentTimeMs = currentTime * 1000;
        const chapter = this.chapters.find((ch, index) => {
            const nextChapter = this.chapters[index + 1];
            return currentTimeMs >= ch.startMilliseconds && 
                   (!nextChapter || currentTimeMs < nextChapter.startMilliseconds);
        });
        
        if (chapter && chapter !== this.currentChapter) {
            this.currentChapter = chapter;
            this.displayChapterInfo(chapter);
        }
        
        // Update chapter progress
        const progress = document.querySelector('.chapter-progress');
        if (progress) {
            const percent = (currentTime / this.video.duration) * 100;
            progress.style.width = `${percent}%`;
        }
        
        // Update time display
        const timeDisplay = document.querySelector('.chapter-time');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(currentTime);
        }
    }
    
    displayChapterInfo(chapter) {
        const chapterDisplay = document.querySelector('.current-chapter');
        if (chapterDisplay) {
            chapterDisplay.textContent = chapter.description || chapter.gameDisplayName || 'Unbekanntes Kapitel';
        }
        
        // Show chapter change notification
        this.showChapterNotification(chapter);
    }
    
    showChapterNotification(chapter) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'chapter-notification';
        notification.innerHTML = `
            <div class="chapter-notification-content">
                <h4>Neues Kapitel</h4>
                <p>${chapter.description || chapter.gameDisplayName}</p>
            </div>
        `;
        
        notification.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        this.video.parentElement.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    updateProgressBar(currentTime) {
        const progressBar = document.querySelector('.progress-filled');
        if (progressBar) {
            const percent = (currentTime / this.video.duration) * 100;
            progressBar.style.width = `${percent}%`;
        }
    }
    
    onPlay() {
        this.isPlaying = true;
    }
    
    onPause() {
        this.isPlaying = false;
    }
    
    onEnded() {
        this.isPlaying = false;
        // Mark stream as completed
        if (this.streamId) {
            localStorage.setItem(`stream_completed_${this.streamId}`, 'true');
        }
    }
    
    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }
    
    seek(seconds) {
        this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
    }
    
    toggleFullscreen() {
        const container = this.video.parentElement;
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('Fullscreen failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    toggleMute() {
        this.video.muted = !this.video.muted;
        this.updateVolumeIcon();
        
        // Update volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.video.muted ? 0 : this.video.volume * 100;
        }
    }
    
    saveProgress(currentTime) {
        if (this.streamId && currentTime > 5) { // Only save after 5 seconds
            localStorage.setItem(`stream_progress_${this.streamId}`, Math.floor(currentTime).toString());
        }
    }
    
    loadProgress() {
        if (this.streamId) {
            const savedProgress = localStorage.getItem(`stream_progress_${this.streamId}`);
            if (savedProgress) {
                const time = parseInt(savedProgress);
                // Set time when video is ready
                this.video.addEventListener('canplay', () => {
                    if (time > 10) { // Only restore if more than 10 seconds
                        this.video.currentTime = time;
                    }
                }, { once: true });
            }
        }
    }
    
    showLoading() {
        let loading = this.video.parentElement.querySelector('.player-loading');
        if (!loading) {
            loading = document.createElement('div');
            loading.className = 'player-loading';
            loading.innerHTML = `
                <div class="loading-spinner"></div>
                <div>Video wird geladen...</div>
            `;
            this.video.parentElement.appendChild(loading);
        }
        loading.style.display = 'block';
    }
    
    hideLoading() {
        const loading = this.video.parentElement.querySelector('.player-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.className = 'player-error';
        error.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Fehler beim Laden des Videos</h3>
            <p>${message}</p>
        `;
        this.video.parentElement.appendChild(error);
    }
    
    onError(data) {
        console.error('HLS Error:', data);
        
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    this.showError('Netzwerkfehler beim Laden des Videos.');
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    this.showError('Medienfehler beim Abspielen des Videos.');
                    break;
                default:
                    this.showError('Unbekannter Fehler beim Laden des Videos.');
                    break;
            }
        }
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    destroy() {
        if (this.hls) {
            this.hls.destroy();
        }
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('mainPlayer');
    if (videoElement) {
        // Mock chapter data based on the provided JSON structure
        const chapters = [
            {
                id: "",
                startMilliseconds: 0,
                lengthMilliseconds: 21000,
                type: "GAME_CHANGE",
                description: "JDM: Japanese Drift Master",
                subDescription: "",
                thumbnailUrl: null,
                gameId: "85288604",
                gameDisplayName: "JDM: Japanese Drift Master",
                gameBoxArtUrl: "https://static-cdn.jtvnw.net/ttv-boxart/85288604_IGDB-40x53.jpg"
            }
        ];
        
        window.hlsPlayer = new HLSPlayer(videoElement, {
            streamId: 5,
            chatSync: window.chatSync // Will be set by chat.js
        });
        
        // Load the stream
        window.hlsPlayer.loadStream('https://vid.asukaris.live/streams/_0005/master.m3u8', chapters);
    }
});

// Add CSS for chapter notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Expose HLSPlayer to global scope
window.HLSPlayer = HLSPlayer;