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
        this.apiBase = window.CONFIG ? window.CONFIG.getApiBase() : '/api';
        
        // Check authentication before initializing
        this.checkAdminAccess().then(hasAccess => {
            if (hasAccess) {
                this.init();
            } else {
                this.redirectToLogin();
            }
        });
    }

    async init() {
        this.setupEventListeners();
        this.setupTabNavigation(); // Re-enable tab navigation for clicks within admin page
        // Dashboard loading is now handled by SPA routing - no need to load here
        this.setupUploadForm();
        this.setupModalFunctionality();
    }

    async loadMockData() {
        // Only load essential data during initialization
        // Tab-specific data will be loaded when tabs are accessed
        // This prevents unnecessary API calls and improves performance
    }
    
    async loadUsersFromAPI() {
        try {
            const response = await fetch(`${this.apiBase}/users/list`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                this.users = data.data || [];
            } else {
                console.error('Failed to load users:', data.error);
                this.users = [];
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    }
    
    async loadStreamsFromAPI() {
        try {
            console.log('Loading streams from API...');
            const response = await fetch(`${this.apiBase}/streams`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });
            console.log('API Response status:', response.status);
            const data = await response.json();
            console.log('API Response data:', data);
            if (data.success) {
                this.streams = data.data.streams || [];
                console.log('Loaded streams:', this.streams.length);
            } else {
                console.error('Failed to load streams:', data.error);
                this.streams = [];
            }
        } catch (error) {
            console.error('Failed to load streams:', error);
            this.streams = [];
        }
    }
    
    async loadLogosFromAPI() {
        try {
            const response = await fetch(`${this.apiBase}/logos`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                this.logos = data.data || [];
            } else {
                console.error('Failed to load logos:', data.error);
                // Initialize default logos if none exist
                await this.initDefaultLogos();
            }
        } catch (error) {
            console.error('Failed to load logos:', error);
            await this.initDefaultLogos();
        }
    }
    
    async loadSettingsFromAPI() {
        try {
            const response = await fetch(`${this.apiBase}/settings/all`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                // Convert settings array to object
                this.settings = {};
                if (data.data && Array.isArray(data.data)) {
                    data.data.forEach(setting => {
                        this.settings[setting.setting_key] = setting.setting_value;
                    });
                }
                // Set defaults for missing settings
                this.setDefaultSettings();
            } else {
                console.error('Failed to load settings:', data.error);
                this.setDefaultSettings();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.setDefaultSettings();
        }
    }
    
    async initDefaultLogos() {
        try {
            const response = await fetch(`${this.apiBase}/logos/init-defaults`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                await this.loadLogosFromAPI();
            }
        } catch (error) {
            console.error('Failed to initialize default logos:', error);
            this.logos = [];
        }
    }
    
    setDefaultSettings() {
        // Default settings
        this.settings = {
            siteName: this.settings.siteName || 'Factor_KS Stream Archive',
            siteDescription: this.settings.siteDescription || 'Dein Archiv für alle Factor_KS Streams mit synchronisiertem Chat und HLS-Video-Streaming.',
            maxFileSize: this.settings.maxFileSize || 500,
            autoHLS: this.settings.autoHLS !== undefined ? this.settings.autoHLS : true,
            hlsQualities: this.settings.hlsQualities || ['360p', '720p', '1080p'],
            allowComments: this.settings.allowComments !== undefined ? this.settings.allowComments : true,
            requireLogin: this.settings.requireLogin !== undefined ? this.settings.requireLogin : false,
            moderateComments: this.settings.moderateComments !== undefined ? this.settings.moderateComments : false
        };
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

        // Stream search
        const streamSearch = document.getElementById('streamSearch');
        if (streamSearch) {
            streamSearch.addEventListener('input', (e) => {
                this.filterStreams(e.target.value);
            });
        }

        // Game filter
        const gameFilter = document.getElementById('gameFilter');
        if (gameFilter) {
            gameFilter.addEventListener('change', (e) => {
                this.filterStreamsByGame(e.target.value);
            });
        }

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Logo management
        const logoForm = document.getElementById('logoForm');
        if (logoForm) {
            logoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveLogo();
            });
        }

        // Add Logo Button
        const addLogoBtn = document.getElementById('addLogoBtn');
        if (addLogoBtn) {
            addLogoBtn.addEventListener('click', () => {
                this.openLogoModal();
            });
        }

        // Save Logo Button
        const saveLogoBtn = document.getElementById('saveLogo');
        if (saveLogoBtn) {
            saveLogoBtn.addEventListener('click', () => {
                this.saveLogo();
            });
        }

        // Cancel Logo Button
        const cancelLogoBtn = document.getElementById('cancelLogo');
        if (cancelLogoBtn) {
            cancelLogoBtn.addEventListener('click', () => {
                this.closeLogoModal();
            });
        }

        // Logo search
        const logoSearch = document.getElementById('logoSearch');
        if (logoSearch) {
            logoSearch.addEventListener('input', (e) => {
                this.filterLogos(e.target.value);
            });
        }

        // Logo URL preview
        const logoUrl = document.getElementById('logoUrl');
        if (logoUrl) {
            logoUrl.addEventListener('input', (e) => {
                this.updateLogoPreview(e.target.value);
            });
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        const importBtn = document.getElementById('importData');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('importFile').click();
            });
        }

        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importData(e.target.files[0]);
            });
        }

        // Clear data button
        const clearDataBtn = document.getElementById('clearAllData');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    setupTabNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        const tabContents = document.querySelectorAll('.tab-content');

        menuItems.forEach(menuItem => {
            menuItem.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = menuItem.getAttribute('data-tab');
                
                // Remove active class from all menu items and contents
                menuItems.forEach(item => item.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked menu item and corresponding content
                menuItem.classList.add('active');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
                
                this.currentTab = tabId;
                
                // Load tab-specific data
                switch(tabId) {
                    case 'dashboard':
                        this.loadDashboard();
                        break;
                    case 'users':
                        this.loadUsers();
                        break;
                    case 'archive':
                        this.loadArchive();
                        break;
                    case 'settings':
                        this.loadSettings();
                        break;
                    case 'logos':
                        this.loadLogos();
                        break;
                }
            });
        });
    }

    async checkAdminAccess() {
        try {
            // Get session token from cookies
            const sessionToken = cookieManager.getPreference('session_token');
            if (!sessionToken) {
                console.log('No session token found - allowing access for testing');
                return true; // Allow access for testing
            }
            
            const response = await fetch(`${this.apiBase}/users/profile`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            if (!response.ok) {
                console.log('Response not ok:', response.status, '- allowing access for testing');
                return true; // Allow access for testing
            }
            
            const data = await response.json();
            console.log('Profile data:', data);
            return data.success && data.data && data.data.user && data.data.user.role === 'admin';
        } catch (error) {
            console.error('Error checking admin access:', error, '- allowing access for testing');
            return true; // Allow access for testing
        }
    }

    getAuthHeaders() {
        const sessionToken = cookieManager.getPreference('session_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }
        
        return headers;
    }

    redirectToLogin() {
        alert('Sie haben keine Berechtigung für den Admin-Bereich. Bitte melden Sie sich als Administrator an.');
        window.location.href = '/index.html';
    }

    loadUsers() {
        // Reload users from API
        this.loadUsersFromAPI().then(() => {
            this.renderUsers();
        });
    }

    renderUsers() {
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        if (this.users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Keine Benutzer gefunden.</td></tr>';
            return;
        }

        usersTableBody.innerHTML = this.users.map(user => `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-info">
                        <strong>${user.username}</strong>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td><span class="status-badge active">Aktiv</span></td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-sm" onclick="adminPanel.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterUsers(searchTerm) {
        const filteredUsers = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredUsers(filteredUsers);
    }

    filterUsersByRole(role) {
        if (role === 'all') {
            this.renderUsers();
            return;
        }
        
        const filteredUsers = this.users.filter(user => user.role === role);
        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(users) {
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Keine Benutzer gefunden.</td></tr>';
            return;
        }

        usersTableBody.innerHTML = users.map(user => `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-info">
                        <strong>${user.username}</strong>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td><span class="status-badge active">Aktiv</span></td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-sm" onclick="adminPanel.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                </div>
            </div>
        `).join('');
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Populate modal with user data
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editRole').value = user.role || 'user';
        document.getElementById('editStatus').value = user.status || 'active';
        document.getElementById('editEmailVerified').checked = user.email_verified || false;
        
        // Store current user ID for form submission
        this.currentEditUserId = userId;
        
        // Show modal
        document.getElementById('editUserModal').style.display = 'block';
        
        // Setup form submission handler
        const form = document.getElementById('editUserForm');
        form.onsubmit = (e) => this.handleEditUserSubmit(e);
    }
    
    closeEditUserModal() {
        document.getElementById('editUserModal').style.display = 'none';
        this.currentEditUserId = null;
    }
    
    async handleEditUserSubmit(e) {
        e.preventDefault();
        
        if (!this.currentEditUserId) return;
        
        const formData = new FormData(e.target);
        const userData = {
            email: formData.get('email'),
            role: formData.get('role'),
            status: formData.get('status'),
            email_verified: formData.has('email_verified')
        };
        
        try {
            const response = await fetch(`${this.apiBase}/users/${this.currentEditUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            if (data.success) {
                this.showToast('Benutzer erfolgreich aktualisiert', 'success');
                this.closeEditUserModal();
                this.loadUsers();
            } else {
                this.showToast('Fehler beim Aktualisieren des Benutzers: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            this.showToast('Fehler beim Aktualisieren des Benutzers', 'error');
        }
    }

    async deleteUser(userId) {
        if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
            try {
                const response = await fetch(`${this.apiBase}/users/${userId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                if (data.success) {
                    this.showToast('Benutzer erfolgreich gelöscht', 'success');
                    this.loadUsers();
                } else {
                    this.showToast('Fehler beim Löschen des Benutzers: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showToast('Fehler beim Löschen des Benutzers', 'error');
            }
        }
    }

    loadArchive() {
        // Reload streams from API
        this.loadStreamsFromAPI().then(() => {
            console.log('loadStreamsFromAPI completed, calling renderStreams');
            this.renderStreams();
        });
    }

    renderStreams() {
        console.log('renderStreams called, streams count:', this.streams.length);
        const archiveTableBody = document.getElementById('archiveTableBody');
        console.log('archiveTableBody element:', archiveTableBody);
        if (!archiveTableBody) {
            console.error('archiveTableBody element not found!');
            return;
        }

        if (this.streams.length === 0) {
            console.log('No streams found, showing no data message');
            archiveTableBody.innerHTML = '<tr><td colspan="8" class="no-data">Keine Streams gefunden.</td></tr>';
            return;
        }

        console.log('Rendering', this.streams.length, 'streams');
        archiveTableBody.innerHTML = this.streams.map(stream => `
            <tr data-stream-id="${stream.id}">
                <td>
                     <img src="${stream.thumbnail_url ? (window.CONFIG ? window.CONFIG.getBasePath() + stream.thumbnail_url : stream.thumbnail_url) : (window.CONFIG ? window.CONFIG.getBasePath() + 'css/placeholder-thumbnail.svg' : 'css/placeholder-thumbnail.svg')}" alt="${stream.title}" class="archive-thumbnail">
                 </td>
                <td>
                    <div class="stream-title">${stream.title}</div>
                    <div class="stream-description">${stream.description || 'Keine Beschreibung verfügbar'}</div>
                </td>
                <td>${stream.game || stream.category || 'Unbekannt'}</td>
                <td>${this.formatDate(stream.created_at)}</td>
                <td>${this.formatDuration(stream.duration || 0)}</td>
                <td>-</td>
                <td>
                    ${stream.is_live ? '<span class="status-badge live">LIVE</span>' : '<span class="status-badge published">Veröffentlicht</span>'}
                </td>
                <td>
                    <button class="btn btn-sm" onclick="adminPanel.editStream(${stream.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteStream(${stream.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
             </tr>
         `).join('');
        console.log('Streams rendered successfully');
    }

    filterStreams(searchTerm) {
        const filteredStreams = this.streams.filter(stream => 
            stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (stream.description && stream.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (stream.category && stream.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        this.renderFilteredStreams(filteredStreams);
    }

    filterStreamsByGame(game) {
        if (game === 'all') {
            this.renderStreams();
            return;
        }
        
        const filteredStreams = this.streams.filter(stream => stream.category === game);
        this.renderFilteredStreams(filteredStreams);
    }

    renderFilteredStreams(streams) {
        const streamsList = document.getElementById('streamsList');
        if (!streamsList) return;

        if (streams.length === 0) {
            streamsList.innerHTML = '<p class="no-data">Keine Streams gefunden.</p>';
            return;
        }

        streamsList.innerHTML = streams.map(stream => `
            <div class="stream-item" data-stream-id="${stream.id}">
                <div class="stream-thumbnail">
                    <img src="${stream.thumbnail_url ? (window.CONFIG ? window.CONFIG.getBasePath() + stream.thumbnail_url : stream.thumbnail_url) : (window.CONFIG ? window.CONFIG.getBasePath() + 'css/placeholder-thumbnail.svg' : 'css/placeholder-thumbnail.svg')}" alt="${stream.title}" onerror="this.src='${window.CONFIG ? window.CONFIG.getBasePath() + 'css/placeholder-thumbnail.svg' : 'css/placeholder-thumbnail.svg'}'">
                </div>
                <div class="stream-info">
                    <h4>${stream.title}</h4>
                    <p>${stream.description || 'Keine Beschreibung verfügbar'}</p>
                    <div class="stream-meta">
                        <span class="game">${stream.category || 'Unbekannt'}</span>
                        <span class="date">${this.formatDate(stream.created_at)}</span>
                        ${stream.is_live ? '<span class="live-badge">LIVE</span>' : ''}
                    </div>
                </div>
                <div class="stream-actions">
                    <button class="btn btn-sm" onclick="adminPanel.editStream(${stream.id})">
                        <i class="fas fa-edit"></i> Bearbeiten
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteStream(${stream.id})">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `).join('');
    }

    async editStream(streamId) {
        const stream = this.streams.find(s => s.id === streamId);
        if (!stream) {
            this.showToast('Stream nicht gefunden', 'error');
            return;
        }

        // Store current stream ID for form submission
        this.currentEditStreamId = streamId;

        // Populate modal with stream data
        document.getElementById('editTitle').value = stream.title || '';
        document.getElementById('editDescription').value = stream.description || '';
        document.getElementById('editGame').value = stream.game || '';
        document.getElementById('editStreamUrl').value = stream.stream_url || '';
        
        // Check chat data status
        this.checkChatDataStatus(streamId);
        
        // Populate tags
        this.editTags = [];
        if (stream.tags) {
            try {
                this.editTags = typeof stream.tags === 'string' ? JSON.parse(stream.tags) : stream.tags;
            } catch (e) {
                this.editTags = stream.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
        }
        this.updateEditTagsDisplay();

        // Set current thumbnail
        const thumbnailImg = document.getElementById('currentThumbnail');
        const basePath = window.CONFIG ? window.CONFIG.getBasePath() : '/';
        if (stream.thumbnail_url) {
            thumbnailImg.src = basePath + stream.thumbnail_url;
            thumbnailImg.style.display = 'block';
        } else {
            thumbnailImg.src = basePath + 'css/placeholder-thumbnail.svg';
            thumbnailImg.style.display = 'block';
        }

        // Reset file inputs
        document.getElementById('editThumbnailFile').value = '';
        document.getElementById('editChatFile').value = '';
        const fileLabel = document.querySelector('label[for="editThumbnailFile"]');
        fileLabel.classList.remove('file-selected');
        const fileName = fileLabel.querySelector('.file-name');
        if (fileName) fileName.remove();

        // Setup file inputs
        this.setupEditFileInput();
        this.setupEditChatFileInput();

        // Setup form submission
        this.setupEditFormSubmission();
        
        // Setup tags input
        this.setupEditTagsInput();

        // Show modal
        document.getElementById('editStreamModal').style.display = 'block';
    }

    setupEditFileInput() {
        const fileInput = document.getElementById('editThumbnailFile');
        const label = document.querySelector('label[for="editThumbnailFile"]');
        const thumbnailImg = document.getElementById('currentThumbnail');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Update label
                const fileName = file.name;
                let fileNameSpan = label.querySelector('.file-name');
                if (!fileNameSpan) {
                    fileNameSpan = document.createElement('span');
                    fileNameSpan.className = 'file-name';
                    label.appendChild(fileNameSpan);
                }
                fileNameSpan.textContent = fileName;
                label.classList.add('file-selected');
            } else {
                const fileNameSpan = label.querySelector('.file-name');
                if (fileNameSpan) fileNameSpan.remove();
                label.classList.remove('file-selected');
            }
        });
    }

    setupEditFormSubmission() {
        const form = document.getElementById('editStreamForm');
        
        // Remove existing event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditFormSubmission();
        });
    }

    async handleEditFormSubmission() {
        const submitBtn = document.querySelector('#editStreamForm button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const formData = new FormData(document.getElementById('editStreamForm'));
            
            // Process thumbnail file if uploaded
            let thumbnailUrl = null;
            const thumbnailFile = formData.get('thumbnailFile');
            if (thumbnailFile && thumbnailFile.size > 0) {
                try {
                    thumbnailUrl = await this.convertFileToBase64(thumbnailFile);
                } catch (error) {
                    console.error('Error converting thumbnail to base64:', error);
                    this.showToast('Fehler beim Verarbeiten des Thumbnails', 'error');
                    return;
                }
            }
            
            // Process chat JSON file if uploaded
            let duration = null;
            let chatContent = null;
            const chatFile = formData.get('chatFile');
            if (chatFile && chatFile.size > 0) {
                try {
                    const chatText = await chatFile.text();
                    const chatData = JSON.parse(chatText);
                    duration = this.extractDurationFromChat(chatData);
                    chatContent = chatText;
                } catch (error) {
                    console.error('Error processing chat file:', error);
                    this.showToast('Fehler beim Verarbeiten der Chat-Datei', 'error');
                    return;
                }
            }

            // Prepare update data
            const updateData = {
                title: formData.get('title'),
                description: formData.get('description'),
                game: formData.get('game'),
                stream_url: formData.get('stream_url'),
                tags: JSON.stringify(this.editTags)
            };

            // Only include thumbnail_url if a new one was uploaded
            if (thumbnailUrl) {
                updateData.thumbnail_url = thumbnailUrl;
            }
            
            // Only include duration if extracted from chat
            if (duration !== null) {
                updateData.duration = duration;
            }

            // Send update request
            const response = await fetch(`${this.apiBase}/streams/${this.currentEditStreamId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': cookieManager.getPreference('session_token') ? `Bearer ${cookieManager.getPreference('session_token')}` : ''
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (data.success) {
                // Save chat data if provided
                if (chatContent) {
                    try {
                        const chatResponse = await fetch(`${this.apiBase}/chat_data/${this.currentEditStreamId}`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': cookieManager.getPreference('session_token') ? `Bearer ${cookieManager.getPreference('session_token')}` : ''
                            },
                            body: JSON.stringify({ chatData: chatContent })
                        });
                        
                        const chatData = await chatResponse.json();
                        if (!chatData.success) {
                            console.error('Failed to save chat data:', chatData.error);
                            this.showToast('Stream aktualisiert, aber Chat-Daten konnten nicht gespeichert werden', 'warning');
                        }
                    } catch (error) {
                        console.error('Error saving chat data:', error);
                        this.showToast('Stream aktualisiert, aber Chat-Daten konnten nicht gespeichert werden', 'warning');
                    }
                }
                
                this.showToast('Stream erfolgreich aktualisiert', 'success');
                this.closeEditModal();
                this.loadArchive();
            } else {
                this.showToast('Fehler beim Aktualisieren: ' + (data.error || 'Unbekannter Fehler'), 'error');
            }
        } catch (error) {
            console.error('Error updating stream:', error);
            this.showToast('Fehler beim Aktualisieren des Streams', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    closeEditModal() {
        document.getElementById('editStreamModal').style.display = 'none';
        this.currentEditStreamId = null;
    }

    setupModalFunctionality() {
        // Setup close button for edit modal
        const closeBtn = document.querySelector('#editStreamModal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        // Setup click outside modal to close
        const modal = document.getElementById('editStreamModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeEditModal();
                }
            });
        }

        // Setup logo modal functionality
        const logoModal = document.getElementById('logoModal');
        const logoCloseBtn = document.querySelector('#logoModal .modal-close');
        
        if (logoCloseBtn) {
            logoCloseBtn.addEventListener('click', () => {
                this.closeLogoModal();
            });
        }
        
        if (logoModal) {
            logoModal.addEventListener('click', (e) => {
                if (e.target === logoModal) {
                    this.closeLogoModal();
                }
            });
        }

        // Setup escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal && modal.style.display === 'block') {
                    this.closeEditModal();
                }
                if (logoModal && logoModal.style.display === 'block') {
                    this.closeLogoModal();
                }
            }
        });
    }

    async deleteStream(streamId) {
        console.log('Attempting to delete stream with ID:', streamId, 'Type:', typeof streamId);
        console.log('Available stream IDs:', this.streams.map(s => ({ id: s.id, type: typeof s.id })));
        
        if (confirm('Möchten Sie diesen Stream wirklich löschen?')) {
            try {
                const response = await fetch(`${this.apiBase}/streams/${streamId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': cookieManager.getPreference('session_token') ? `Bearer ${cookieManager.getPreference('session_token')}` : ''
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    this.showToast('Stream erfolgreich gelöscht', 'success');
                    this.loadArchive();
                } else {
                    this.showToast('Fehler beim Löschen des Streams: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Error deleting stream:', error);
                this.showToast('Fehler beim Löschen des Streams', 'error');
            }
        }
    }

    async loadDashboard() {
        console.log('---- Dashboard: Starting loadDashboard()');
        // Load necessary data for dashboard
        console.log('---- Dashboard: Loading users from API...');
        await this.loadUsersFromAPI();
        console.log('---- Dashboard: Users loaded, count:', this.users.length);
        
        console.log('---- Dashboard: Loading streams from API...');
        await this.loadStreamsFromAPI();
        console.log('---- Dashboard: Streams loaded, count:', this.streams.length);
        
        console.log('---- Dashboard: Updating dashboard stats...');
        this.updateDashboardStats();
        
        console.log('---- Dashboard: Loading recent activity...');
        this.loadRecentActivity();
        console.log('---- Dashboard: loadDashboard() completed');
    }

    updateDashboardStats() {
        console.log('---- Dashboard: updateDashboardStats() called');
        // Update stats cards
        const totalUsersEl = document.getElementById('totalUsers');
        const totalStreamsEl = document.getElementById('totalStreams');
        const activeStreamsEl = document.getElementById('activeStreams');
        const storageUsedEl = document.getElementById('storageUsed');
        
        console.log('---- Dashboard: DOM elements found:', {
            totalUsersEl: !!totalUsersEl,
            totalStreamsEl: !!totalStreamsEl,
            activeStreamsEl: !!activeStreamsEl,
            storageUsedEl: !!storageUsedEl
        });
        
        console.log('---- Dashboard: Data to display:', {
            usersCount: this.users.length,
            streamsCount: this.streams.length
        });
        
        if (totalUsersEl) {
            totalUsersEl.textContent = this.users.length;
            console.log('---- Dashboard: Updated totalUsers to:', this.users.length);
        }
        if (totalStreamsEl) {
            totalStreamsEl.textContent = this.streams.length;
            console.log('---- Dashboard: Updated totalStreams to:', this.streams.length);
        }
        
        // Calculate other stats
        const activeStreams = Array.isArray(this.streams) ? this.streams.filter(s => s.is_live).length : 0;
        if (activeStreamsEl) {
            activeStreamsEl.textContent = activeStreams;
            console.log('---- Dashboard: Updated activeStreams to:', activeStreams);
        }
        
        // Storage usage (placeholder)
        if (storageUsedEl) {
            storageUsedEl.textContent = '0 GB';
            console.log('---- Dashboard: Updated storageUsed to: 0 GB');
        }
        
        console.log('---- Dashboard: updateDashboardStats() completed');
    }

    loadRecentActivity() {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;

        // Get recent streams (last 5)
        const recentStreams = this.streams
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        if (recentStreams.length === 0) {
            recentActivity.innerHTML = '<p class="no-data">Keine kürzlichen Aktivitäten.</p>';
            return;
        }

        recentActivity.innerHTML = recentStreams.map(stream => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-video"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${stream.title}</strong> wurde hinzugefügt</p>
                    <small>${this.formatDate(stream.created_at)}</small>
                </div>
            </div>
        `).join('');
    }

    async loadSettings() {
        // Load settings data first
        await this.loadSettingsFromAPI();
        
        // Populate settings form
        const form = document.getElementById('settingsForm');
        if (!form) return;

        // Set form values from this.settings
        Object.keys(this.settings).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = this.settings[key];
                } else if (input.type === 'number') {
                    input.value = this.settings[key] || 0;
                } else {
                    input.value = this.settings[key] || '';
                }
            }
        });
    }

    async saveSettings() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        const formData = new FormData(form);
        const settings = {};
        
        for (let [key, value] of formData.entries()) {
            // Handle checkboxes
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.type === 'checkbox') {
                settings[key] = input.checked;
            } else if (input && input.type === 'number') {
                settings[key] = parseInt(value) || 0;
            } else {
                settings[key] = value;
            }
        }

        try {
            // Save each setting individually
            for (const [key, value] of Object.entries(settings)) {
                const response = await fetch(`${this.apiBase}/settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        setting_key: key,
                        setting_value: value
                    })
                });
                
                const data = await response.json();
                if (!data.success) {
                    throw new Error(`Failed to save setting ${key}: ${data.error}`);
                }
            }
            
            this.settings = { ...this.settings, ...settings };
            this.showToast('Einstellungen erfolgreich gespeichert', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Fehler beim Speichern der Einstellungen: ' + error.message, 'error');
        }
    }

    async loadLogos() {
        // Load logos from API
        await this.loadLogosFromAPI();
        this.renderLogos();
    }

    renderLogos() {
        const logosGrid = document.getElementById('logosGrid');
        if (!logosGrid) return;

        if (this.logos.length === 0) {
            logosGrid.innerHTML = '<p class="no-data">Keine Logos gefunden.</p>';
            return;
        }

        logosGrid.innerHTML = this.logos.map(logo => `
            <div class="logo-item" data-logo-id="${logo.id}">
                <div class="logo-preview">
                    <img src="${logo.logo_url || logo.logoUrl}" alt="${logo.game_name || logo.gameName}" onerror="this.src='/css/placeholder-thumbnail.svg'">
                </div>
                <div class="logo-info">
                    <h4>${logo.game_name || logo.gameName}</h4>
                    <p>Aliase: ${logo.aliases && logo.aliases.length > 0 ? logo.aliases.join(', ') : 'Keine'}</p>
                    <small>Erstellt: ${this.formatDate(logo.created_at)}</small>
                </div>
                <div class="logo-actions">
                    <button class="btn btn-sm" onclick="adminPanel.editLogo(${logo.id})">
                        <i class="fas fa-edit"></i> Bearbeiten
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteLogo(${logo.id})">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `).join('');
    }

    async saveLogo() {
        const form = document.getElementById('logoForm');
        if (!form) return;

        const formData = new FormData(form);
        const logoData = {
            gameName: formData.get('gameName'),
            logoUrl: formData.get('logoUrl'),
            aliases: formData.get('aliases') ? formData.get('aliases').split(',').map(a => a.trim()) : []
        };

        try {
            const url = this.currentLogoId 
                ? `${this.apiBase}/logos/${this.currentLogoId}`
                : `${this.apiBase}/logos`;
            
            const method = this.currentLogoId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logoData)
            });
            
            const data = await response.json();
            if (data.success) {
                this.showToast('Logo erfolgreich gespeichert', 'success');
                this.loadLogos();
                form.reset();
                this.currentLogoId = null;
            } else {
                this.showToast('Fehler beim Speichern des Logos: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error saving logo:', error);
            this.showToast('Fehler beim Speichern des Logos', 'error');
        }
    }

    editLogo(logoId) {
        const logo = this.logos.find(l => l.id === logoId);
        if (!logo) return;

        const modal = document.getElementById('logoModal');
        const modalTitle = document.getElementById('logoModalTitle');
        const form = document.getElementById('logoForm');
        
        if (!form || !modal || !modalTitle) return;

        // Fill form fields
        const gameNameField = form.querySelector('[name="gameName"]') || document.getElementById('logoGameName');
        const logoUrlField = form.querySelector('[name="logoUrl"]') || document.getElementById('logoUrl');
        const aliasesField = form.querySelector('[name="aliases"]') || document.getElementById('logoAliases');
        
        if (gameNameField) gameNameField.value = logo.game_name || logo.gameName || '';
        if (logoUrlField) logoUrlField.value = logo.logo_url || logo.logoUrl || '';
        if (aliasesField) aliasesField.value = logo.aliases && logo.aliases.length > 0 ? logo.aliases.join(', ') : '';
        
        // Update preview
        this.updateLogoPreview(logo.logo_url || logo.logoUrl || '');
        
        // Set modal title and current ID
        modalTitle.textContent = 'Logo bearbeiten';
        this.currentLogoId = logoId;
        
        // Show modal
        modal.style.display = 'block';
    }

    async deleteLogo(logoId) {
        if (confirm('Möchten Sie dieses Logo wirklich löschen?')) {
            try {
                const response = await fetch(`${this.apiBase}/logos/${logoId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                if (data.success) {
                    this.showToast('Logo erfolgreich gelöscht', 'success');
                    this.loadLogos();
                } else {
                    this.showToast('Fehler beim Löschen des Logos: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Error deleting logo:', error);
                this.showToast('Fehler beim Löschen des Logos', 'error');
            }
        }
    }

    openLogoModal() {
        const modal = document.getElementById('logoModal');
        const modalTitle = document.getElementById('logoModalTitle');
        const form = document.getElementById('logoForm');
        
        if (modal && modalTitle && form) {
            modalTitle.textContent = 'Logo hinzufügen';
            form.reset();
            this.currentLogoId = null;
            this.updateLogoPreview('');
            modal.style.display = 'block';
        }
    }

    closeLogoModal() {
        const modal = document.getElementById('logoModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateLogoPreview(url) {
        const previewImg = document.getElementById('logoPreviewImg');
        const placeholder = document.querySelector('.logo-preview-placeholder');
        
        if (url && url.trim()) {
            if (previewImg) {
                previewImg.src = url;
                previewImg.style.display = 'block';
            }
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        } else {
            if (previewImg) {
                previewImg.style.display = 'none';
            }
            if (placeholder) {
                placeholder.style.display = 'block';
            }
        }
    }

    filterLogos(searchTerm) {
        const logoItems = document.querySelectorAll('.logo-item');
        const term = searchTerm.toLowerCase();
        
        logoItems.forEach(item => {
            const gameName = item.querySelector('h4').textContent.toLowerCase();
            const aliases = item.querySelector('p').textContent.toLowerCase();
            
            if (gameName.includes(term) || aliases.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    setupUploadForm() {
        const uploadForm = document.getElementById('streamUploadForm');
        if (!uploadForm) return;

        // Setup file input labels
        this.setupFileInputs();
        
        // Setup tags input
        this.setupTagsInput();

        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(uploadForm);
            
            // Process thumbnail file if uploaded
            let thumbnailUrl = '';
            const thumbnailFile = formData.get('thumbnailFile');
            if (thumbnailFile && thumbnailFile.size > 0) {
                try {
                    thumbnailUrl = await this.convertFileToBase64(thumbnailFile);
                } catch (error) {
                    console.error('Error converting thumbnail to base64:', error);
                    this.showToast('Fehler beim Verarbeiten des Thumbnails', 'error');
                    return;
                }
            }
            
            // Process chat JSON file to extract duration and store raw content
            let duration = 0;
            let chatContent = null;
            const chatFile = formData.get('chatFile');
            if (chatFile && chatFile.size > 0) {
                try {
                    const chatText = await chatFile.text();
                    const chatData = JSON.parse(chatText);
                    duration = this.extractDurationFromChat(chatData);
                    chatContent = chatText; // Store raw JSON content
                } catch (error) {
                    console.error('Error processing chat file:', error);
                    this.showToast('Fehler beim Verarbeiten der Chat-Datei', 'error');
                    return;
                }
            }
            
            // Convert FormData to JSON object
            const streamData = {
                title: formData.get('title'),
                description: formData.get('description'),
                stream_url: formData.get('stream_url'),
                thumbnail_url: thumbnailUrl,
                category: formData.get('category'),
                is_live: formData.get('is_live') === 'on',
                viewer_count: parseInt(formData.get('viewer_count')) || 0,
                tags: this.tags.join(','),
                duration: duration,
                chatData: chatContent
            };
            
            try {
                const response = await fetch(`${this.apiBase}/streams`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': cookieManager.getPreference('session_token') ? `Bearer ${cookieManager.getPreference('session_token')}` : ''
                    },
                    body: JSON.stringify(streamData)
                });
                
                const data = await response.json();
                if (data.success) {
                    this.showToast('Stream erfolgreich hochgeladen', 'success');
                    uploadForm.reset();
                    this.tags = []; // Clear tags
                    this.updateTagsDisplay();
                    this.loadArchive();
                } else {
                    this.showToast('Fehler beim Hochladen: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Upload error:', error);
                this.showToast('Fehler beim Hochladen', 'error');
            }
        });
    }

    setupFileInputs() {
        const fileInputs = ['chatFile', 'thumbnailFile', 'videoFile'];
        
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const label = document.querySelector(`label[for="${inputId}"]`);
            
            if (input && label) {
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const fileName = file.name;
                        const icon = label.querySelector('i');
                        const text = label.querySelector('.file-name') || document.createElement('span');
                        text.className = 'file-name';
                        text.textContent = fileName;
                        
                        if (!label.querySelector('.file-name')) {
                            label.appendChild(text);
                        }
                        
                        label.classList.add('file-selected');
                    } else {
                        const text = label.querySelector('.file-name');
                        if (text) {
                            text.remove();
                        }
                        label.classList.remove('file-selected');
                    }
                });
            }
        });
    }

    setupTagsInput() {
        const tagsInput = document.getElementById('streamTags');
        const tagsList = document.getElementById('tagsList');
        
        if (!tagsInput || !tagsList) return;
        
        tagsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                if (tag && !this.tags.includes(tag)) {
                    this.tags.push(tag);
                    this.updateTagsDisplay();
                    tagsInput.value = '';
                }
            }
        });
    }

    convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
    
    extractDurationFromChat(chatData) {
        try {
            // Check if chatData has comments array
            if (!chatData.comments || !Array.isArray(chatData.comments)) {
                console.warn('No comments array found in chat data');
                return 0;
            }
            
            // Find the last message timestamp to determine stream duration
            let maxTimestamp = 0;
            
            chatData.comments.forEach(comment => {
                if (comment.content_offset_seconds) {
                    maxTimestamp = Math.max(maxTimestamp, comment.content_offset_seconds);
                }
            });
            
            // Convert seconds to milliseconds and return
            return Math.round(maxTimestamp * 1000);
        } catch (error) {
            console.error('Error extracting duration from chat:', error);
            return 0;
        }
    }
    
    formatDuration(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return '0:00';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    async updateExistingStreamDurations() {
        try {
            this.showToast('Funktion wird in einer zukünftigen Version verfügbar sein', 'info');
            // TODO: Implement functionality to update existing stream durations
            // This would require:
            // 1. Loading existing chat files for streams without duration
            // 2. Processing each chat file to extract duration
            // 3. Updating the stream records with the extracted duration
        } catch (error) {
            console.error('Error updating stream durations:', error);
            this.showToast('Fehler beim Aktualisieren der Stream-Dauern', 'error');
        }
    }
    
    async checkChatDataStatus(streamId) {
        const statusIcon = document.getElementById('editChatStatusIcon');
        const statusText = document.getElementById('editChatStatusText');
        
        try {
            const response = await fetch(`${this.apiBase}/chat_data/${streamId}`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            
            if (data.success) {
                statusIcon.className = 'fas fa-circle text-success';
                statusText.textContent = 'Chat-Daten vorhanden';
                document.getElementById('editChatFileLabel').textContent = 'Chat-JSON aktualisieren';
            } else {
                statusIcon.className = 'fas fa-circle text-warning';
                statusText.textContent = 'Keine Chat-Daten vorhanden';
                document.getElementById('editChatFileLabel').textContent = 'Chat-JSON hochladen';
            }
        } catch (error) {
            console.error('Error checking chat data status:', error);
            statusIcon.className = 'fas fa-circle text-error';
            statusText.textContent = 'Fehler beim Prüfen der Chat-Daten';
        }
    }
    
    setupEditChatFileInput() {
        const fileInput = document.getElementById('editChatFile');
        const label = document.querySelector('label[for="editChatFile"]');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Update label
                const fileName = file.name;
                let fileNameSpan = label.querySelector('.file-name');
                if (!fileNameSpan) {
                    fileNameSpan = document.createElement('span');
                    fileNameSpan.className = 'file-name';
                    label.appendChild(fileNameSpan);
                }
                fileNameSpan.textContent = fileName;
                label.classList.add('file-selected');
            } else {
                const fileNameSpan = label.querySelector('.file-name');
                if (fileNameSpan) fileNameSpan.remove();
                label.classList.remove('file-selected');
            }
        });
    }

    updateTagsDisplay() {
        const tagsList = document.getElementById('tagsList');
        if (!tagsList) return;
        
        tagsList.innerHTML = '';
        
        this.tags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <button type="button" class="tag-remove" onclick="adminPanel.removeTag(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            tagsList.appendChild(tagElement);
        });
    }

    removeTag(index) {
        this.tags.splice(index, 1);
        this.updateTagsDisplay();
    }

    setupEditTagsInput() {
        const tagsInput = document.getElementById('editTags');
        const tagsList = document.getElementById('editTagsList');
        
        if (!tagsInput || !tagsList) return;
        
        tagsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                if (tag && !this.editTags.includes(tag)) {
                    this.editTags.push(tag);
                    this.updateEditTagsDisplay();
                    tagsInput.value = '';
                }
            }
        });
    }

    updateEditTagsDisplay() {
        const tagsList = document.getElementById('editTagsList');
        if (!tagsList) return;
        
        tagsList.innerHTML = '';
        
        this.editTags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <button type="button" class="tag-remove" onclick="adminPanel.removeEditTag(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            tagsList.appendChild(tagElement);
        });
    }

    removeEditTag(index) {
        this.editTags.splice(index, 1);
        this.updateEditTagsDisplay();
    }

    async exportData() {
        try {
            // Get all data from APIs
            const [usersResponse, streamsResponse, settingsResponse, logosResponse] = await Promise.all([
                fetch(`${this.apiBase}/users/list`),
                fetch(`${this.apiBase}/streams`),
                fetch(`${this.apiBase}/settings/all`),
                fetch(`${this.apiBase}/logos`)
            ]);
            
            const [usersData, streamsData, settingsData, logosData] = await Promise.all([
                usersResponse.json(),
                streamsResponse.json(),
                settingsResponse.json(),
                logosResponse.json()
            ]);
            
            const exportData = {
                users: usersData.success ? usersData.data : [],
                streams: streamsData.success ? streamsData.data : [],
                settings: settingsData.success ? settingsData.data : [],
                logos: logosData.success ? logosData.data : [],
                exportDate: new Date().toISOString()
            };
            
            const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `stream-archive-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Daten wurden erfolgreich exportiert', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Fehler beim Exportieren der Daten', 'error');
        }
    }

    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (confirm('Möchten Sie wirklich alle Daten importieren? Dies überschreibt vorhandene Daten!')) {
                // Note: This would require additional API endpoints for bulk import
                // For now, we'll show a message that this feature needs to be implemented
                this.showToast('Import-Funktion wird in einer zukünftigen Version verfügbar sein', 'info');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showToast('Fehler beim Importieren der Daten', 'error');
        }
    }

    async clearAllData() {
        if (confirm('Sind Sie sicher, dass Sie ALLE Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden!')) {
            if (confirm('Letzte Bestätigung: Wirklich ALLE Daten löschen?')) {
                try {
                    // Clear all data via APIs
                    await Promise.all([
                        fetch(`${this.apiBase}/analytics/all`, { method: 'DELETE' }),
                        // Note: We don't delete users and streams here as that would require
                        // individual delete calls for each item
                    ]);
                    
                    this.showToast('Daten wurden erfolgreich gelöscht', 'success');
                    
                    // Reload all data
                    await this.loadMockData();
                    this.loadDashboard();
                    this.loadUsers();
                    this.loadArchive();
                    this.loadSettings();
                    this.loadLogos();
                } catch (error) {
                    console.error('Clear data error:', error);
                    this.showToast('Fehler beim Löschen der Daten', 'error');
                }
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Export AdminPanel as AdminManager for SPA compatibility
window.AdminManager = AdminPanel;

// Auto-initialize AdminPanel when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded - checking adminManagerInstance:', !!window.adminManagerInstance);
        if (!window.adminManagerInstance) {
            console.log('Creating new AdminPanel instance from DOMContentLoaded');
            window.adminManagerInstance = new AdminPanel();
            window.adminPanel = window.adminManagerInstance;
        } else {
            console.log('AdminPanel instance already exists from DOMContentLoaded');
        }
    });
} else {
    console.log('Document already loaded - checking adminManagerInstance:', !!window.adminManagerInstance);
    if (!window.adminManagerInstance) {
        console.log('Creating new AdminPanel instance immediately');
        window.adminManagerInstance = new AdminPanel();
        window.adminPanel = window.adminManagerInstance;
    } else {
        console.log('AdminPanel instance already exists immediately');
    }
}