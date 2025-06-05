// Comments System JavaScript
class CommentsManager {
    constructor() {
        this.comments = [];
        this.currentUser = null;
        this.streamId = null;
        this.sortBy = 'newest'; // newest, oldest, popular
        this.isLoading = false;
        this.hasMoreComments = true;
        this.commentsPerPage = 20;
        this.currentPage = 1;
        
        this.init();
    }
    
    init() {
        this.getStreamId();
        this.checkUserAuth();
        this.loadComments();
        this.setupEventListeners();
        this.setupFormValidation();
    }
    
    getStreamId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.streamId = urlParams.get('id');
    }
    
    checkUserAuth() {
        // Check if user is logged in (mock implementation)
        const authData = localStorage.getItem('twitchAuth');
        if (authData) {
            try {
                this.currentUser = JSON.parse(authData);
                this.updateUIForLoggedInUser();
            } catch (e) {
                console.error('Error parsing auth data:', e);
            }
        } else {
            this.updateUIForLoggedOutUser();
        }
    }
    
    updateUIForLoggedInUser() {
        const commentForm = document.getElementById('commentForm');
        const loginPrompt = document.getElementById('loginPrompt');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (commentForm) commentForm.style.display = 'block';
        if (loginPrompt) loginPrompt.style.display = 'none';
        
        if (this.currentUser) {
            if (userAvatar) userAvatar.src = this.currentUser.profile_image_url || '/images/default-avatar.png';
            if (userName) userName.textContent = this.currentUser.display_name || this.currentUser.login;
        }
    }
    
    updateUIForLoggedOutUser() {
        const commentForm = document.getElementById('commentForm');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (commentForm) commentForm.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
    }
    
    loadComments() {
        if (this.isLoading || !this.hasMoreComments) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        // Simulate API call
        setTimeout(() => {
            const newComments = this.getMockComments(this.currentPage);
            
            if (newComments.length === 0) {
                this.hasMoreComments = false;
            } else {
                this.comments.push(...newComments);
                this.currentPage++;
            }
            
            this.renderComments();
            this.hideLoadingState();
            this.isLoading = false;
            
            this.updateLoadMoreButton();
        }, 500);
    }
    
    getMockComments(page) {
        const allComments = [
            {
                id: '1',
                author: {
                    id: '123456',
                    username: 'GamerPro2024',
                    displayName: 'GamerPro2024',
                    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile_image-300x300.png',
                    badges: ['subscriber']
                },
                content: 'Großartiger Stream! Die Drift-Techniken waren wirklich beeindruckend. Kannst du ein Tutorial dazu machen?',
                timestamp: '2025-06-04T19:30:00Z',
                likes: 15,
                replies: [
                    {
                        id: '1-1',
                        author: {
                            id: '840070929',
                            username: 'factor_ks',
                            displayName: 'Factor_KS',
                            avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/6345d801-5d04-4fca-a819-b4bb7a70f03e-profile_image-300x300.png',
                            badges: ['broadcaster']
                        },
                        content: 'Danke! Ein Tutorial ist eine super Idee, werde ich definitiv machen! 🚗💨',
                        timestamp: '2025-06-04T19:35:00Z',
                        likes: 8
                    }
                ],
                isLiked: false,
                isEdited: false
            },
            {
                id: '2',
                author: {
                    id: '789012',
                    username: 'DriftKing99',
                    displayName: 'DriftKing99',
                    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile_image-300x300.png',
                    badges: ['vip']
                },
                content: 'Das Spiel sieht echt gut aus! Wie ist die Physik im Vergleich zu anderen Racing-Games?',
                timestamp: '2025-06-04T19:25:00Z',
                likes: 7,
                replies: [],
                isLiked: false,
                isEdited: false
            },
            {
                id: '3',
                author: {
                    id: '345678',
                    username: 'SpeedDemon',
                    displayName: 'SpeedDemon',
                    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile_image-300x300.png',
                    badges: []
                },
                content: 'Erste! 🎉 Freue mich schon auf den nächsten Stream!',
                timestamp: '2025-06-04T19:20:00Z',
                likes: 3,
                replies: [],
                isLiked: true,
                isEdited: false
            }
        ];
        
        // Return comments for the requested page
        const startIndex = (page - 1) * this.commentsPerPage;
        const endIndex = startIndex + this.commentsPerPage;
        
        if (page === 1) {
            return allComments;
        } else {
            return []; // No more comments for demo
        }
    }
    
    renderComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        // Sort comments
        const sortedComments = this.sortComments([...this.comments]);
        
        // Clear existing comments if this is the first page
        if (this.currentPage === 2) {
            commentsList.innerHTML = '';
        }
        
        // Render each comment
        sortedComments.forEach(comment => {
            if (!document.getElementById(`comment-${comment.id}`)) {
                const commentElement = this.createCommentElement(comment);
                commentsList.appendChild(commentElement);
            }
        });
        
        // Show empty state if no comments
        if (this.comments.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
        }
        
        this.updateCommentsCount();
    }
    
    createCommentElement(comment, isReply = false) {
        const commentDiv = document.createElement('div');
        commentDiv.className = `comment-item ${isReply ? 'comment-reply' : ''}`;
        commentDiv.id = `comment-${comment.id}`;
        
        const badges = comment.author.badges.map(badge => 
            `<span class="user-badge badge-${badge}">${this.getBadgeText(badge)}</span>`
        ).join('');
        
        const timeAgo = this.getTimeAgo(comment.timestamp);
        const editedText = comment.isEdited ? '<span class="edited-indicator">(bearbeitet)</span>' : '';
        
        commentDiv.innerHTML = `
            <div class="comment-content">
                <div class="comment-author">
                    <img src="${comment.author.avatar}" alt="${comment.author.displayName}" class="author-avatar">
                    <div class="author-info">
                        <div class="author-name">
                            ${badges}
                            <span class="username">${comment.author.displayName}</span>
                            ${editedText}
                        </div>
                        <div class="comment-date">${timeAgo}</div>
                    </div>
                </div>
                <div class="comment-text">${this.formatCommentText(comment.content)}</div>
                <div class="comment-actions">
                    <button class="action-btn like-btn ${comment.isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                        <i class="${comment.isLiked ? 'fas' : 'far'} fa-heart"></i>
                        <span class="like-count">${comment.likes}</span>
                    </button>
                    ${!isReply ? `<button class="action-btn reply-btn" data-comment-id="${comment.id}">
                        <i class="fas fa-reply"></i>
                        Antworten
                    </button>` : ''}
                    ${this.canModerateComment(comment) ? `
                        <button class="action-btn edit-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-edit"></i>
                            Bearbeiten
                        </button>
                        <button class="action-btn delete-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-trash"></i>
                            Löschen
                        </button>
                    ` : ''}
                    ${this.canReportComment(comment) ? `
                        <button class="action-btn report-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-flag"></i>
                            Melden
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add replies if any
        if (comment.replies && comment.replies.length > 0 && !isReply) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'comment-replies';
            
            comment.replies.forEach(reply => {
                const replyElement = this.createCommentElement(reply, true);
                repliesContainer.appendChild(replyElement);
            });
            
            commentDiv.appendChild(repliesContainer);
        }
        
        return commentDiv;
    }
    
    formatCommentText(text) {
        // Basic text formatting (mentions, links, etc.)
        return text
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n/g, '<br>');
    }
    
    getBadgeText(badge) {
        const badgeTexts = {
            'broadcaster': 'Streamer',
            'moderator': 'Mod',
            'vip': 'VIP',
            'subscriber': 'Sub',
            'premium': 'Prime'
        };
        return badgeTexts[badge] || badge;
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const commentDate = new Date(timestamp);
        const diffInSeconds = Math.floor((now - commentDate) / 1000);
        
        if (diffInSeconds < 60) {
            return 'gerade eben';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
        }
    }
    
    canModerateComment(comment) {
        if (!this.currentUser) return false;
        
        // User can moderate their own comments
        if (comment.author.id === this.currentUser.id) return true;
        
        // Broadcasters and moderators can moderate all comments
        const userRole = this.currentUser.role || 'user';
        return ['broadcaster', 'moderator', 'admin'].includes(userRole);
    }
    
    canReportComment(comment) {
        if (!this.currentUser) return false;
        return comment.author.id !== this.currentUser.id;
    }
    
    sortComments(comments) {
        switch (this.sortBy) {
            case 'oldest':
                return comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            case 'popular':
                return comments.sort((a, b) => b.likes - a.likes);
            case 'newest':
            default:
                return comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }
    
    setupEventListeners() {
        // Comment form submission
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitComment();
            });
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('commentSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderComments();
            });
        }
        
        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadComments();
            });
        }
        
        // Comment actions (like, reply, edit, delete, report)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            const commentId = target.dataset.commentId;
            if (!commentId) return;
            
            if (target.classList.contains('like-btn')) {
                this.toggleLike(commentId);
            } else if (target.classList.contains('reply-btn')) {
                this.showReplyForm(commentId);
            } else if (target.classList.contains('edit-btn')) {
                this.editComment(commentId);
            } else if (target.classList.contains('delete-btn')) {
                this.deleteComment(commentId);
            } else if (target.classList.contains('report-btn')) {
                this.reportComment(commentId);
            }
        });
        
        // Formatting buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('format-btn')) {
                const format = e.target.dataset.format;
                this.applyFormatting(format);
            }
        });
    }
    
    setupFormValidation() {
        const commentInput = document.getElementById('commentInput');
        const submitBtn = document.getElementById('submitComment');
        const charCount = document.getElementById('charCount');
        
        if (commentInput && submitBtn) {
            commentInput.addEventListener('input', () => {
                const length = commentInput.value.length;
                const maxLength = 500;
                
                if (charCount) {
                    charCount.textContent = `${length}/${maxLength}`;
                    charCount.classList.toggle('over-limit', length > maxLength);
                }
                
                submitBtn.disabled = length === 0 || length > maxLength;
            });
        }
    }
    
    submitComment() {
        const commentInput = document.getElementById('commentInput');
        if (!commentInput || !this.currentUser) return;
        
        const content = commentInput.value.trim();
        if (!content) return;
        
        // Create new comment
        const newComment = {
            id: Date.now().toString(),
            author: {
                id: this.currentUser.id,
                username: this.currentUser.login,
                displayName: this.currentUser.display_name || this.currentUser.login,
                avatar: this.currentUser.profile_image_url || '/images/default-avatar.png',
                badges: this.currentUser.badges || []
            },
            content: content,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: [],
            isLiked: false,
            isEdited: false
        };
        
        // Add to comments array
        this.comments.unshift(newComment);
        
        // Clear form
        commentInput.value = '';
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0/500';
        
        const submitBtn = document.getElementById('submitComment');
        if (submitBtn) submitBtn.disabled = true;
        
        // Re-render comments
        this.renderComments();
        
        // Show success message
        this.showToast('Kommentar erfolgreich gepostet!');
        
        // Scroll to new comment
        setTimeout(() => {
            const newCommentElement = document.getElementById(`comment-${newComment.id}`);
            if (newCommentElement) {
                newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newCommentElement.classList.add('new-comment');
            }
        }, 100);
    }
    
    toggleLike(commentId) {
        if (!this.currentUser) {
            this.showToast('Bitte logge dich ein, um Kommentare zu liken.');
            return;
        }
        
        const comment = this.findComment(commentId);
        if (!comment) return;
        
        comment.isLiked = !comment.isLiked;
        comment.likes += comment.isLiked ? 1 : -1;
        
        // Update UI
        const likeBtn = document.querySelector(`[data-comment-id="${commentId}"].like-btn`);
        if (likeBtn) {
            const icon = likeBtn.querySelector('i');
            const count = likeBtn.querySelector('.like-count');
            
            likeBtn.classList.toggle('liked', comment.isLiked);
            icon.className = comment.isLiked ? 'fas fa-heart' : 'far fa-heart';
            count.textContent = comment.likes;
        }
    }
    
    showReplyForm(commentId) {
        if (!this.currentUser) {
            this.showToast('Bitte logge dich ein, um zu antworten.');
            return;
        }
        
        // Remove any existing reply forms
        document.querySelectorAll('.reply-form').forEach(form => form.remove());
        
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (!commentElement) return;
        
        const replyForm = document.createElement('div');
        replyForm.className = 'reply-form';
        replyForm.innerHTML = `
            <div class="comment-form">
                <div class="form-header">
                    <img src="${this.currentUser.profile_image_url || '/images/default-avatar.png'}" alt="${this.currentUser.display_name}" class="user-avatar">
                    <span class="user-name">${this.currentUser.display_name || this.currentUser.login}</span>
                </div>
                <div class="form-content">
                    <textarea id="replyInput-${commentId}" placeholder="Schreibe eine Antwort..." maxlength="500"></textarea>
                    <div class="form-actions">
                        <div class="char-count">
                            <span id="replyCharCount-${commentId}">0/500</span>
                        </div>
                        <div class="action-buttons">
                            <button type="button" class="btn btn-secondary cancel-reply" data-comment-id="${commentId}">Abbrechen</button>
                            <button type="button" class="btn btn-primary submit-reply" data-comment-id="${commentId}" disabled>Antworten</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        commentElement.appendChild(replyForm);
        
        // Setup reply form events
        const replyInput = document.getElementById(`replyInput-${commentId}`);
        const submitReplyBtn = replyForm.querySelector('.submit-reply');
        const cancelReplyBtn = replyForm.querySelector('.cancel-reply');
        const charCount = document.getElementById(`replyCharCount-${commentId}`);
        
        replyInput.addEventListener('input', () => {
            const length = replyInput.value.length;
            charCount.textContent = `${length}/500`;
            charCount.classList.toggle('over-limit', length > 500);
            submitReplyBtn.disabled = length === 0 || length > 500;
        });
        
        submitReplyBtn.addEventListener('click', () => {
            this.submitReply(commentId, replyInput.value.trim());
            replyForm.remove();
        });
        
        cancelReplyBtn.addEventListener('click', () => {
            replyForm.remove();
        });
        
        replyInput.focus();
    }
    
    submitReply(parentCommentId, content) {
        if (!content || !this.currentUser) return;
        
        const parentComment = this.findComment(parentCommentId);
        if (!parentComment) return;
        
        const reply = {
            id: `${parentCommentId}-${Date.now()}`,
            author: {
                id: this.currentUser.id,
                username: this.currentUser.login,
                displayName: this.currentUser.display_name || this.currentUser.login,
                avatar: this.currentUser.profile_image_url || '/images/default-avatar.png',
                badges: this.currentUser.badges || []
            },
            content: content,
            timestamp: new Date().toISOString(),
            likes: 0,
            isLiked: false,
            isEdited: false
        };
        
        if (!parentComment.replies) {
            parentComment.replies = [];
        }
        parentComment.replies.push(reply);
        
        this.renderComments();
        this.showToast('Antwort erfolgreich gepostet!');
    }
    
    editComment(commentId) {
        // Implementation for editing comments
        this.showToast('Bearbeiten-Funktion wird bald verfügbar sein.');
    }
    
    deleteComment(commentId) {
        if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return;
        
        // Remove comment from array
        this.comments = this.comments.filter(comment => {
            if (comment.id === commentId) return false;
            if (comment.replies) {
                comment.replies = comment.replies.filter(reply => reply.id !== commentId);
            }
            return true;
        });
        
        // Remove from DOM
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (commentElement) {
            commentElement.remove();
        }
        
        this.updateCommentsCount();
        this.showToast('Kommentar gelöscht.');
    }
    
    reportComment(commentId) {
        const reasons = [
            'Spam',
            'Belästigung',
            'Hassrede',
            'Unangemessener Inhalt',
            'Sonstiges'
        ];
        
        const reason = prompt(`Grund für die Meldung:\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nBitte gib die Nummer ein (1-${reasons.length}):`);
        
        if (reason && reason >= 1 && reason <= reasons.length) {
            this.showToast(`Kommentar wegen "${reasons[reason - 1]}" gemeldet.`);
        }
    }
    
    findComment(commentId) {
        for (const comment of this.comments) {
            if (comment.id === commentId) return comment;
            if (comment.replies) {
                const reply = comment.replies.find(r => r.id === commentId);
                if (reply) return reply;
            }
        }
        return null;
    }
    
    applyFormatting(format) {
        const commentInput = document.getElementById('commentInput');
        if (!commentInput) return;
        
        const start = commentInput.selectionStart;
        const end = commentInput.selectionEnd;
        const selectedText = commentInput.value.substring(start, end);
        
        let formattedText = selectedText;
        
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'code':
                formattedText = `\`${selectedText}\``;
                break;
        }
        
        const newValue = commentInput.value.substring(0, start) + formattedText + commentInput.value.substring(end);
        commentInput.value = newValue;
        
        // Trigger input event to update character count
        commentInput.dispatchEvent(new Event('input'));
        
        // Set cursor position
        const newCursorPos = start + formattedText.length;
        commentInput.setSelectionRange(newCursorPos, newCursorPos);
        commentInput.focus();
    }
    
    showLoadingState() {
        const loadingElement = document.getElementById('commentsLoading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }
    
    hideLoadingState() {
        const loadingElement = document.getElementById('commentsLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    showEmptyState() {
        const emptyElement = document.getElementById('commentsEmpty');
        if (emptyElement) {
            emptyElement.style.display = 'block';
        }
    }
    
    hideEmptyState() {
        const emptyElement = document.getElementById('commentsEmpty');
        if (emptyElement) {
            emptyElement.style.display = 'none';
        }
    }
    
    updateCommentsCount() {
        const countElement = document.getElementById('commentsCount');
        if (countElement) {
            const totalComments = this.comments.reduce((count, comment) => {
                return count + 1 + (comment.replies ? comment.replies.length : 0);
            }, 0);
            countElement.textContent = totalComments;
        }
    }
    
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.hasMoreComments ? 'block' : 'none';
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
}

// Initialize comments manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.commentsManager = new CommentsManager();
});