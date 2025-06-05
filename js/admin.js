// Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.currentTab = 'dashboard';
        this.users = [];
        this.streams = [];
        this.settings = {};
        this.tags = [];
        this.logos = [];
        this.currentLogoId = null;
        
        this.init();
    }

    init() {
        this.loadMockData();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.loadDashboard();
        this.loadUsers();
        this.loadArchive();
        this.loadSettings();
        this.loadLogos();
        this.setupUploadForm();
    }

    loadMockData() {
        // Load data from localStorage or initialize empty arrays
        this.users = JSON.parse(localStorage.getItem('streamArchive_users') || '[]');
        this.streams = JSON.parse(localStorage.getItem('streamArchive_streams') || '[]');
        
        // Load logos from localStorage or initialize with default logos
        this.logos = JSON.parse(localStorage.getItem('streamArchive_logos') || JSON.stringify([
            {
                id: 1,
                gameName: 'Minecraft',
                logoUrl: 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-96x96.png',
                aliases: ['MC', 'Minecraft Java', 'Minecraft Bedrock']
            },
            {
                id: 2,
                gameName: 'Fortnite',
                logoUrl: 'https://cdn2.unrealengine.com/Fortnite%2Ffn-game-icon-285x285-285x285-0b364143e0c9.png',
                aliases: ['Fortnite Battle Royale']
            },
            {
                id: 3,
                gameName: 'Valorant',
                logoUrl: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5c6a35b51b0e8c7e/5eb26f5e31bb7e28d2444b7e/V_LOGOMARK_1920x1080_Red.png',
                aliases: ['Valorant Riot']
            },
            {
                id: 4,
                gameName: 'League of Legends',
                logoUrl: 'https://universe-meeps.leagueoflegends.com/v1/assets/images/factions/demacia-crest.png',
                aliases: ['LoL', 'League']
            },
            {
                id: 5,
                gameName: 'World of Warcraft',
                logoUrl: 'https://bnetcmsus-a.akamaihd.net/cms/gallery/LKXYBFP8ZZ6D1509472919930.png',
                aliases: ['WoW', 'World of Warcraft Classic']
            },
            {
                id: 6,
                gameName: 'Overwatch',
                logoUrl: 'https://d15f34w2p8l1cc.cloudfront.net/overwatch/images/logos/overwatch-share-icon.jpg',
                aliases: ['Overwatch 2', 'OW', 'OW2']
            },
            {
                id: 7,
                gameName: 'Counter-Strike',
                logoUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
                aliases: ['CS', 'CS:GO', 'Counter-Strike 2', 'CS2']
            },
            {
                id: 8,
                gameName: 'Dota 2',
                logoUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
                aliases: ['Dota']
            },
            {
                id: 9,
                gameName: 'Apex Legends',
                logoUrl: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-legends-meta-image.jpg',
                aliases: ['Apex']
            }
        ]));
        
        // Default settings
        this.settings = JSON.parse(localStorage.getItem('streamArchive_settings') || JSON.stringify({
            siteName: 'Factor_KS Stream Archive',
            siteDescription: 'Dein Archiv für alle Factor_KS Streams mit synchronisiertem Chat und HLS-Video-Streaming.',
            maxFileSize: 500,
            autoHLS: true,
            hlsQualities: ['360p', '720p', '1080p'],
            allowComments: true,
            requireLogin: false,
            moderateComments: false
        }));
    }

    setupEventListeners() {
        // User search
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }

        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filterUsersByRole(e.target.value);
            });
        }

        // Archive search
        const archiveSearch = document.getElementById('archiveSearch');
        if (archiveSearch) {
            archiveSearch.addEventListener('input', (e) => {
                this.filterStreams(e.target.value);
            });
        }

        // Archive filters
        const archiveGameFilter = document.getElementById('archiveGameFilter');
        const archiveStatusFilter = document.getElementById('archiveStatusFilter');
        if (archiveGameFilter) {
            archiveGameFilter.addEventListener('change', () => this.filterStreams());
        }
        if (archiveStatusFilter) {
            archiveStatusFilter.addEventListener('change', () => this.filterStreams());
        }

        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showUserModal());
        }

        // Logo management events
        const addLogoBtn = document.getElementById('addLogoBtn');
        if (addLogoBtn) {
            addLogoBtn.addEventListener('click', () => this.showLogoModal());
        }

        const logoSearch = document.getElementById('logoSearch');
        if (logoSearch) {
            logoSearch.addEventListener('input', (e) => {
                this.filterLogos(e.target.value);
            });
        }

        // Modal events
        this.setupModalEvents();
        this.setupLogoModalEvents();

        // Settings events
        this.setupSettingsEvents();
    }

    setupTabNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        this.currentTab = tab;
    }

    loadDashboard() {
        // Update stats
        document.getElementById('totalStreams').textContent = this.streams.length;
        document.getElementById('totalViews').textContent = this.formatNumber(this.streams.reduce((sum, stream) => sum + stream.views, 0));
        document.getElementById('totalUsers').textContent = this.formatNumber(this.users.length * 450); // Mock multiplier
        document.getElementById('totalComments').textContent = this.formatNumber(this.streams.length * 80); // Mock multiplier

        // Load recent streams
        this.loadRecentStreams();
    }

    loadRecentStreams() {
        const container = document.getElementById('recentStreams');
        if (!container) return;

        const recentStreams = this.streams
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        container.innerHTML = recentStreams.map(stream => `
            <div class="recent-stream">
                <img src="${stream.thumbnail}" alt="${stream.title}" class="recent-stream-thumb">
                <div class="recent-stream-info">
                    <h4 class="recent-stream-title">${stream.title}</h4>
                    <p class="recent-stream-meta">${stream.game} • ${this.formatDate(stream.date)} • ${this.formatViews(stream.views)} Aufrufe</p>
                </div>
            </div>
        `).join('');
    }

    loadUsers() {
        this.renderUsers(this.users);
    }

    renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="table-user">
                        <img src="${user.avatar}" alt="${user.username}" class="table-user-avatar">
                        <div class="table-user-info">
                            <p class="table-user-name">${user.username}</p>
                            <p class="table-user-username">@${user.username}</p>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${this.getRoleDisplayName(user.role)}</span></td>
                <td>${this.formatDate(user.registered)}</td>
                <td><span class="status-badge ${user.active ? 'active' : 'inactive'}">${user.active ? 'Aktiv' : 'Inaktiv'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="adminPanel.editUser(${user.id})" title="Bearbeiten">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="adminPanel.deleteUser(${user.id})" title="Löschen">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterUsers(searchTerm = '') {
        const roleFilter = document.getElementById('roleFilter').value;
        
        let filteredUsers = this.users;
        
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }
        
        this.renderUsers(filteredUsers);
    }

    filterUsersByRole(role) {
        const searchTerm = document.getElementById('userSearch').value;
        this.filterUsers(searchTerm);
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.showUserModal(user);
        }
    }

    deleteUser(userId) {
        if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
            this.users = this.users.filter(u => u.id !== userId);
            this.loadUsers();
            this.showToast('Benutzer wurde gelöscht', 'success');
        }
    }

    showUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        
        if (user) {
            title.textContent = 'Benutzer bearbeiten';
            document.getElementById('userName').value = user.username;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userActive').checked = user.active;
        } else {
            title.textContent = 'Neuen Benutzer hinzufügen';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    setupModalEvents() {
        const modal = document.getElementById('userModal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelUser');
        const saveBtn = document.getElementById('saveUser');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        saveBtn.addEventListener('click', () => {
            this.saveUser();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    saveUser() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            role: formData.get('role'),
            active: formData.get('active') === 'on'
        };
        
        // Simple validation
        if (!userData.username || !userData.email) {
            this.showToast('Bitte füllen Sie alle Pflichtfelder aus', 'error');
            return;
        }
        
        // Mock save (in real app, this would be an API call)
        const existingUser = this.users.find(u => u.email === userData.email);
        if (existingUser) {
            // Update existing user
            Object.assign(existingUser, userData);
        } else {
            // Add new user
            userData.id = Math.max(...this.users.map(u => u.id)) + 1;
            userData.avatar = 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png';
            userData.registered = new Date().toISOString().split('T')[0];
            this.users.push(userData);
        }
        
        this.loadUsers();
        document.getElementById('userModal').classList.remove('active');
        this.showToast('Benutzer wurde gespeichert', 'success');
    }

    loadArchive() {
        // Populate game filter
        const gameFilter = document.getElementById('archiveGameFilter');
        if (gameFilter) {
            const games = [...new Set(this.streams.map(s => s.game))];
            gameFilter.innerHTML = '<option value="">Alle Spiele</option>' + 
                games.map(game => `<option value="${game}">${game}</option>`).join('');
        }
        
        this.renderStreams(this.streams);
    }

    renderStreams(streams) {
        const tbody = document.getElementById('archiveTableBody');
        if (!tbody) return;

        tbody.innerHTML = streams.map(stream => `
            <tr>
                <td>
                    <img src="${stream.thumbnail}" alt="${stream.title}" class="archive-thumbnail">
                </td>
                <td>
                    <strong>${stream.title}</strong>
                    <br>
                    <small class="text-secondary">${stream.description.substring(0, 50)}...</small>
                </td>
                <td>${stream.game}</td>
                <td>${this.formatDate(stream.date)}</td>
                <td>${this.formatDuration(stream.duration)}</td>
                <td>${this.formatViews(stream.views)}</td>
                <td><span class="status-badge ${stream.status}">${this.getStatusDisplayName(stream.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <a href="stream.html?id=${stream.id}" class="action-btn view" title="Ansehen">
                            <i class="fas fa-eye"></i>
                        </a>
                        <button class="action-btn edit" onclick="adminPanel.editStream(${stream.id})" title="Bearbeiten">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="adminPanel.deleteStream(${stream.id})" title="Löschen">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterStreams(searchTerm = '') {
        const gameFilter = document.getElementById('archiveGameFilter').value;
        const statusFilter = document.getElementById('archiveStatusFilter').value;
        
        let filteredStreams = this.streams;
        
        if (searchTerm) {
            filteredStreams = filteredStreams.filter(stream => 
                stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stream.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stream.game.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (gameFilter) {
            filteredStreams = filteredStreams.filter(stream => stream.game === gameFilter);
        }
        
        if (statusFilter) {
            filteredStreams = filteredStreams.filter(stream => stream.status === statusFilter);
        }
        
        this.renderStreams(filteredStreams);
    }

    editStream(streamId) {
        const stream = this.streams.find(s => s.id.toString() === streamId.toString());
        if (!stream) {
            this.showToast('Stream nicht gefunden', 'error');
            return;
        }
        
        this.openEditModal(stream);
    }
    
    openEditModal(stream) {
        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="editStreamModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Stream bearbeiten</h3>
                        <button class="modal-close" onclick="adminPanel.closeEditModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="editStreamForm">
                            <div class="form-group">
                                <label for="editTitle">Titel *</label>
                                <input type="text" id="editTitle" value="${stream.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="editDescription">Beschreibung</label>
                                <textarea id="editDescription" rows="3">${stream.description || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="editGame">Spiel/Kategorie</label>
                                <input type="text" id="editGame" value="${stream.game || ''}">
                            </div>
                            <div class="form-group">
                                <label for="editDate">Datum *</label>
                                <input type="date" id="editDate" value="${stream.date}" required>
                            </div>
                            <div class="form-group">
                                <label for="editDuration">Dauer (Sekunden)</label>
                                <input type="number" id="editDuration" value="${stream.duration}" min="1">
                            </div>
                            <div class="form-group">
                                <label for="editLink">Stream-Link *</label>
                                <input type="url" id="editLink" value="${stream.link}" required>
                            </div>
                            <div class="form-group">
                                <label for="editThumbnail">Thumbnail URL</label>
                                <input type="url" id="editThumbnail" value="${stream.thumbnail}">
                            </div>
                            <div class="form-group">
                                <label for="editStatus">Status</label>
                                <select id="editStatus">
                                    <option value="published" ${stream.status === 'published' ? 'selected' : ''}>Veröffentlicht</option>
                                    <option value="draft" ${stream.status === 'draft' ? 'selected' : ''}>Entwurf</option>
                                    <option value="private" ${stream.status === 'private' ? 'selected' : ''}>Privat</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="adminPanel.closeEditModal()">Abbrechen</button>
                        <button type="button" class="btn btn-primary" onclick="adminPanel.saveStreamEdit('${stream.id}')">Speichern</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = document.getElementById('editStreamModal');
        modal.style.display = 'flex';
        
        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    }
    
    closeEditModal() {
        const modal = document.getElementById('editStreamModal');
        if (modal) {
            modal.remove();
        }
    }
    
    saveStreamEdit(streamId) {
        const form = document.getElementById('editStreamForm');
        const formData = new FormData(form);
        
        // Validation
        const title = document.getElementById('editTitle').value.trim();
        const date = document.getElementById('editDate').value;
        const link = document.getElementById('editLink').value.trim();
        
        if (!title || !date || !link) {
            this.showToast('Bitte füllen Sie alle Pflichtfelder aus', 'error');
            return;
        }
        
        // Find and update stream
        const streamIndex = this.streams.findIndex(s => s.id.toString() === streamId.toString());
        if (streamIndex === -1) {
            this.showToast('Stream nicht gefunden', 'error');
            return;
        }
        
        // Update stream data
        this.streams[streamIndex] = {
            ...this.streams[streamIndex],
            title: title,
            description: document.getElementById('editDescription').value.trim(),
            game: document.getElementById('editGame').value.trim(),
            date: date,
            duration: parseInt(document.getElementById('editDuration').value) || this.streams[streamIndex].duration,
            link: link,
            thumbnail: document.getElementById('editThumbnail').value.trim() || this.streams[streamIndex].thumbnail,
            status: document.getElementById('editStatus').value
        };
        
        // Save to localStorage
        localStorage.setItem('streamArchive_streams', JSON.stringify(this.streams));
        
        // Refresh displays
        this.loadArchive();
        this.loadDashboard();
        
        // Close modal and show success
        this.closeEditModal();
        this.showToast('Stream wurde erfolgreich aktualisiert!', 'success');
    }

    deleteStream(streamId) {
        console.log('Attempting to delete stream with ID:', streamId, 'Type:', typeof streamId);
        console.log('Available stream IDs:', this.streams.map(s => ({ id: s.id, type: typeof s.id })));
        
        if (confirm('Möchten Sie diesen Stream wirklich löschen?')) {
            const initialCount = this.streams.length;
            
            // Convert both IDs to strings for comparison to handle type mismatches
            this.streams = this.streams.filter(s => s.id.toString() !== streamId.toString());
            
            const finalCount = this.streams.length;
            console.log('Streams before deletion:', initialCount, 'after deletion:', finalCount);
            
            if (initialCount === finalCount) {
                this.showToast('Stream konnte nicht gefunden werden', 'error');
                return;
            }
            
            // Save to localStorage
            localStorage.setItem('streamArchive_streams', JSON.stringify(this.streams));
            
            this.loadArchive();
            this.loadDashboard(); // Update stats
            this.showToast('Stream wurde erfolgreich gelöscht', 'success');
        }
    }

    setupUploadForm() {
        const form = document.getElementById('streamUploadForm');
        const tagsInput = document.getElementById('streamTags');
        const releaseType = document.getElementById('releaseType');
        const scheduleGroup = document.getElementById('scheduleGroup');
        const resetBtn = document.getElementById('resetForm');
        
        // Tags input
        if (tagsInput) {
            tagsInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }
        
        // Release type change
        if (releaseType) {
            releaseType.addEventListener('change', (e) => {
                if (e.target.value === 'scheduled') {
                    scheduleGroup.style.display = 'block';
                } else {
                    scheduleGroup.style.display = 'none';
                }
            });
        }
        
        // File upload handlers
        this.setupFileUploads();
        
        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStreamUpload();
            });
        }
        
        // Reset form
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                form.reset();
                this.tags = [];
                this.updateTagsList();
                this.resetFileUploads();
            });
        }
    }

    addTag(tag) {
        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updateTagsList();
        }
    }

    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.updateTagsList();
    }

    updateTagsList() {
        const tagsList = document.getElementById('tagsList');
        if (!tagsList) return;
        
        tagsList.innerHTML = this.tags.map(tag => `
            <span class="tag">
                ${tag}
                <button type="button" class="tag-remove" onclick="adminPanel.removeTag('${tag}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }

    setupFileUploads() {
        const fileInputs = ['chatFile', 'thumbnailFile', 'videoFile'];
        
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.handleFileSelect(e.target);
                });
            }
        });
    }

    handleFileSelect(input) {
        const file = input.files[0];
        const label = input.nextElementSibling;
        const upload = input.closest('.file-upload');
        
        if (file) {
            label.innerHTML = `<i class="fas fa-check"></i> ${file.name}`;
            upload.classList.add('has-file');
            
            // Simulate upload progress for video files
            if (input.id === 'videoFile') {
                this.simulateUploadProgress();
            }
        } else {
            this.resetFileUpload(input);
        }
    }

    resetFileUploads() {
        const fileInputs = ['chatFile', 'thumbnailFile', 'videoFile'];
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                this.resetFileUpload(input);
            }
        });
    }

    resetFileUpload(input) {
        const label = input.nextElementSibling;
        const upload = input.closest('.file-upload');
        const originalText = {
            'chatFile': '<i class="fas fa-upload"></i> Chat-Datei auswählen',
            'thumbnailFile': '<i class="fas fa-image"></i> Thumbnail auswählen',
            'videoFile': '<i class="fas fa-video"></i> Video-Datei auswählen'
        };
        
        label.innerHTML = originalText[input.id] || '<i class="fas fa-upload"></i> Datei auswählen';
        upload.classList.remove('has-file');
        input.value = '';
    }

    simulateUploadProgress() {
        const progressContainer = document.getElementById('videoUploadProgress');
        const progressFill = progressContainer.querySelector('.progress-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressContainer.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressFill.style.width = '0%';
                    progressText.textContent = '0%';
                }, 1000);
            }
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }, 200);
    }

    handleStreamUpload() {
        const formData = new FormData(document.getElementById('streamUploadForm'));
        
        // Basic validation
        const title = formData.get('title');
        const date = formData.get('date');
        const link = formData.get('link');
        const chatFile = formData.get('chatFile');
        
        if (!title || !date || !link || !chatFile.name) {
            this.showToast('Bitte füllen Sie alle Pflichtfelder aus', 'error');
            return;
        }
        
        // Process files
        this.showToast('Stream wird hochgeladen...', 'info');
        
        const thumbnailFile = formData.get('thumbnailFile');
        
        // Process thumbnail first if provided
        if (thumbnailFile && thumbnailFile.name) {
            this.processThumbnail(thumbnailFile, (thumbnailData) => {
                this.processStreamWithThumbnail(formData, chatFile, thumbnailData);
            });
        } else {
            this.processStreamWithThumbnail(formData, chatFile, 'https://via.placeholder.com/320x180');
        }
    }
    
    processThumbnail(thumbnailFile, callback) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(thumbnailFile.type)) {
            this.showToast('Bitte wählen Sie eine gültige Bilddatei (JPEG, PNG, GIF, WebP)', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (thumbnailFile.size > maxSize) {
            this.showToast('Das Thumbnail ist zu groß. Maximale Größe: 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Create image to resize if needed
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set target dimensions (16:9 aspect ratio)
                const targetWidth = 320;
                const targetHeight = 180;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Draw and resize image
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                // Convert to base64
                const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
                callback(thumbnailData);
            };
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            this.showToast('Fehler beim Lesen der Thumbnail-Datei', 'error');
        };
        
        reader.readAsDataURL(thumbnailFile);
    }
    
    processStreamWithThumbnail(formData, chatFile, thumbnailData) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const chatData = JSON.parse(e.target.result);
                console.log('Parsed chat data:', chatData);
                console.log('Chat comments count:', chatData.comments ? chatData.comments.length : 'No comments array');
                
                // Create new stream object with chat data
                const newStream = {
                    id: Date.now().toString(),
                    title: formData.get('title'),
                    description: formData.get('description') || '',
                    game: formData.get('game') || '',
                    date: formData.get('date'),
                    duration: parseInt(formData.get('duration')) || 3600,
                    views: 0,
                    streamer: {
                        name: 'Current User',
                        avatar: 'https://via.placeholder.com/40'
                    },
                    thumbnail: thumbnailData,
                    link: formData.get('link'),
                    tags: this.tags || [],
                    status: 'published',
                    chatData: chatData // Store the parsed chat data
                };
                
                this.streams.push(newStream);
                
                // Save to localStorage
                localStorage.setItem('streamArchive_streams', JSON.stringify(this.streams));
                
                this.loadArchive();
                this.loadDashboard();
                
                // Reset form
                document.getElementById('streamUploadForm').reset();
                this.tags = [];
                this.updateTagsList();
                this.resetFileUploads();
                
                this.showToast('Stream wurde erfolgreich hochgeladen!', 'success');
            } catch (error) {
                console.error('Error parsing chat file:', error);
                this.showToast('Fehler beim Verarbeiten der Chat-Datei. Bitte überprüfen Sie das JSON-Format.', 'error');
            }
        };
        
        reader.onerror = () => {
            this.showToast('Fehler beim Lesen der Chat-Datei', 'error');
        };
        
        reader.readAsText(chatFile);
    }

    loadSettings() {
        // Populate settings form
        document.getElementById('siteName').value = this.settings.siteName;
        document.getElementById('siteDescription').value = this.settings.siteDescription;
        document.getElementById('maxFileSize').value = this.settings.maxFileSize;
        document.getElementById('autoHLS').checked = this.settings.autoHLS;
        document.getElementById('allowComments').checked = this.settings.allowComments;
        document.getElementById('requireLogin').checked = this.settings.requireLogin;
        document.getElementById('moderateComments').checked = this.settings.moderateComments;
        
        // HLS qualities
        const qualityCheckboxes = document.querySelectorAll('input[name="hlsQuality"]');
        qualityCheckboxes.forEach(checkbox => {
            checkbox.checked = this.settings.hlsQualities.includes(checkbox.value);
        });
    }

    setupSettingsEvents() {
        const saveBtn = document.getElementById('saveSettings');
        const resetBtn = document.getElementById('resetSettings');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.loadSettings();
                this.showToast('Einstellungen wurden zurückgesetzt', 'info');
            });
        }
    }

    saveSettings() {
        // Collect settings from form
        const newSettings = {
            siteName: document.getElementById('siteName').value,
            siteDescription: document.getElementById('siteDescription').value,
            maxFileSize: parseInt(document.getElementById('maxFileSize').value),
            autoHLS: document.getElementById('autoHLS').checked,
            allowComments: document.getElementById('allowComments').checked,
            requireLogin: document.getElementById('requireLogin').checked,
            moderateComments: document.getElementById('moderateComments').checked,
            hlsQualities: Array.from(document.querySelectorAll('input[name="hlsQuality"]:checked')).map(cb => cb.value)
        };
        
        // Save to localStorage
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('streamArchive_settings', JSON.stringify(this.settings));
        
        this.showToast('Einstellungen wurden gespeichert', 'success');
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}h`;
    }

    formatViews(views) {
        return this.formatNumber(views);
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrator',
            'moderator': 'Moderator',
            'user': 'Benutzer'
        };
        return roleNames[role] || role;
    }

    getStatusDisplayName(status) {
        const statusNames = {
            'published': 'Veröffentlicht',
            'draft': 'Entwurf',
            'scheduled': 'Geplant'
        };
        return statusNames[status] || status;
    }

    // Logo Management Methods
    loadLogos() {
        this.renderLogos(this.logos);
    }

    renderLogos(logos) {
        const container = document.getElementById('logosGrid');
        if (!container) return;

        if (logos.length === 0) {
            container.innerHTML = `
                <div class="logo-empty-state">
                    <i class="fas fa-images"></i>
                    <h3>Keine Logos vorhanden</h3>
                    <p>Füge dein erstes Spiel-Logo hinzu, um loszulegen.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = logos.map(logo => `
            <div class="logo-card">
                <div class="logo-card-header">
                    <img src="${logo.logoUrl}" alt="${logo.gameName}" class="logo-card-image" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="logo-card-fallback" style="display: none; width: 48px; height: 48px; background: var(--primary-color); border-radius: 8px; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${logo.gameName.charAt(0).toUpperCase()}
                    </div>
                    <div class="logo-card-info">
                        <h3>${logo.gameName}</h3>
                    </div>
                </div>
                ${logo.aliases && logo.aliases.length > 0 ? `
                    <div class="logo-card-aliases">
                        <strong>Alternative Namen:</strong>
                        <div class="logo-aliases">
                            ${logo.aliases.map(alias => `<span class="logo-alias">${alias}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="logo-card-actions">
                    <button class="action-btn edit" onclick="adminPanel.editLogo(${logo.id})" title="Bearbeiten">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="adminPanel.deleteLogo(${logo.id})" title="Löschen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterLogos(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderLogos(this.logos);
            return;
        }

        const filtered = this.logos.filter(logo => {
            const searchLower = searchTerm.toLowerCase();
            return logo.gameName.toLowerCase().includes(searchLower) ||
                   logo.aliases.some(alias => alias.toLowerCase().includes(searchLower));
        });

        this.renderLogos(filtered);
    }

    showLogoModal(logo = null) {
        const modal = document.getElementById('logoModal');
        const title = document.getElementById('logoModalTitle');
        const form = document.getElementById('logoForm');
        
        // Initialize tabs - default to URL tab
        this.switchLogoTab('url');
        
        if (logo) {
            title.textContent = 'Logo bearbeiten';
            document.getElementById('logoGameName').value = logo.gameName;
            document.getElementById('logoUrl').value = logo.logoUrl;
            document.getElementById('logoAliases').value = logo.aliases.join(', ');
            this.currentLogoId = logo.id;
            this.updateLogoPreview(logo.logoUrl);
        } else {
            title.textContent = 'Logo hinzufügen';
            form.reset();
            this.currentLogoId = null;
            this.updateLogoPreview('');
        }
        
        modal.style.display = 'block';
    }

    hideLogoModal() {
        const modal = document.getElementById('logoModal');
        modal.style.display = 'none';
        this.currentLogoId = null;
    }

    setupLogoModalEvents() {
        const modal = document.getElementById('logoModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelLogo');
        const saveBtn = document.getElementById('saveLogo');
        const logoUrlInput = document.getElementById('logoUrl');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideLogoModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideLogoModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveLogo());
        }

        if (logoUrlInput) {
            logoUrlInput.addEventListener('input', (e) => {
                this.updateLogoPreview(e.target.value);
            });
        }

        // File upload handling
        const logoFileInput = document.getElementById('logoFile');
        if (logoFileInput) {
            logoFileInput.addEventListener('change', () => this.handleFileUpload());
        }

        // Tab switching
        const tabBtns = modal?.querySelectorAll('.tab-btn');
        if (tabBtns) {
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => this.switchLogoTab(btn.dataset.tab));
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideLogoModal();
                }
            });
        }
    }

    updateLogoPreview(url) {
        const preview = document.getElementById('logoPreview');
        const img = document.getElementById('logoPreviewImg');
        const placeholder = preview?.querySelector('.logo-preview-placeholder');

        if (!preview || !img || !placeholder) return;

        if (url && url.trim()) {
            img.src = url;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            preview.classList.add('has-image');
            
            img.onerror = () => {
                img.style.display = 'none';
                placeholder.style.display = 'block';
                placeholder.textContent = 'Fehler beim Laden des Bildes';
                preview.classList.remove('has-image');
            };
            
            img.onload = () => {
                preview.classList.add('has-image');
            };
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'block';
            placeholder.textContent = 'Logo-URL eingeben für Vorschau';
            preview.classList.remove('has-image');
        }
    }

    switchLogoTab(tab) {
        const modal = document.getElementById('logoModal');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');
        
        // Update tab buttons
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update tab contents
        tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tab);
        });
        
        // Clear preview when switching tabs
        this.updateLogoPreview('');
        
        // Clear file input when switching away from upload tab
        if (tab !== 'upload') {
            const fileInput = document.getElementById('logoFile');
            if (fileInput) fileInput.value = '';
        }
        
        // Clear URL input when switching away from URL tab
        if (tab !== 'url') {
            const urlInput = document.getElementById('logoUrl');
            if (urlInput) urlInput.value = '';
        }
    }

    handleFileUpload() {
        const fileInput = document.getElementById('logoFile');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Bitte wählen Sie eine gültige Bilddatei (JPG, PNG, GIF, WebP, SVG).');
            fileInput.value = '';
            return;
        }
        
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            alert('Die Datei ist zu groß. Maximale Größe: 5MB.');
            fileInput.value = '';
            return;
        }
        
        // Convert to base64 and preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            this.updateLogoPreview(base64);
        };
        reader.readAsDataURL(file);
    }

    saveLogo() {
        const form = document.getElementById('logoForm');
        const formData = new FormData(form);
        
        const gameName = formData.get('gameName')?.trim();
        const logoUrl = formData.get('logoUrl')?.trim();
        const aliases = formData.get('aliases');
        const logoFile = formData.get('logoFile');
        
        // Check which tab is active
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        
        if (!gameName) {
            alert('Bitte geben Sie einen Spielnamen ein.');
            return;
        }
        
        let finalLogoUrl = '';
        
        if (activeTab === 'url') {
            if (!logoUrl) {
                alert('Bitte geben Sie eine Logo-URL ein.');
                return;
            }
            finalLogoUrl = logoUrl;
        } else if (activeTab === 'upload') {
            if (!logoFile || logoFile.size === 0) {
                alert('Bitte wählen Sie eine Datei aus.');
                return;
            }
            
            // For file uploads, we use the base64 data that was set in the preview
            const previewImg = document.getElementById('logoPreviewImg');
            if (previewImg && previewImg.src && previewImg.src.startsWith('data:')) {
                finalLogoUrl = previewImg.src;
            } else {
                alert('Fehler beim Verarbeiten der Datei.');
                return;
            }
        } else {
            alert('Bitte wählen Sie eine Logo-Quelle aus.');
            return;
        }
        
        const logoData = {
            gameName,
            logoUrl: finalLogoUrl,
            aliases: aliases ? 
                aliases.split(',').map(alias => alias.trim()).filter(alias => alias) : []
        };

        // Check for duplicate game names (excluding current logo when editing)
        const existingLogo = this.logos.find(logo => 
            logo.gameName.toLowerCase() === logoData.gameName.toLowerCase() && 
            logo.id !== this.currentLogoId
        );
        
        if (existingLogo) {
            alert('Ein Logo für dieses Spiel existiert bereits.');
            return;
        }

        if (this.currentLogoId) {
            // Edit existing logo
            const logoIndex = this.logos.findIndex(logo => logo.id === this.currentLogoId);
            if (logoIndex !== -1) {
                this.logos[logoIndex] = { ...this.logos[logoIndex], ...logoData };
            }
        } else {
            // Add new logo
            const newId = Math.max(...this.logos.map(logo => logo.id), 0) + 1;
            this.logos.push({ id: newId, ...logoData });
        }

        // Save to localStorage
        localStorage.setItem('streamArchive_logos', JSON.stringify(this.logos));
        
        // Update UI
        this.loadLogos();
        this.hideLogoModal();
        
        // Update chat.js logo database
        this.updateChatLogoDatabase();
    }

    editLogo(logoId) {
        const logo = this.logos.find(l => l.id === logoId);
        if (logo) {
            this.showLogoModal(logo);
        }
    }

    deleteLogo(logoId) {
        const logo = this.logos.find(l => l.id === logoId);
        if (!logo) return;

        if (confirm(`Möchtest du das Logo für "${logo.gameName}" wirklich löschen?`)) {
            this.logos = this.logos.filter(l => l.id !== logoId);
            localStorage.setItem('streamArchive_logos', JSON.stringify(this.logos));
            this.loadLogos();
            this.updateChatLogoDatabase();
        }
    }

    updateChatLogoDatabase() {
        // This method updates the logo database used by chat.js
        // We'll store it in a format that chat.js can easily access
        const chatLogos = {};
        this.logos.forEach(logo => {
            const lowerName = logo.gameName.toLowerCase();
            chatLogos[lowerName] = logo.logoUrl;
            
            // Add aliases
            logo.aliases.forEach(alias => {
                chatLogos[alias.toLowerCase()] = logo.logoUrl;
            });
        });
        
        localStorage.setItem('streamArchive_chatLogos', JSON.stringify(chatLogos));
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                }
                .toast.show {
                    transform: translateX(0);
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-color);
                }
                .toast-success { border-left: 4px solid var(--success-color); }
                .toast-error { border-left: 4px solid var(--error-color); }
                .toast-info { border-left: 4px solid var(--primary-color); }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});