// API Documentation JavaScript

class APIDocumentation {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupCodeCopying();
        this.setupScrollSpy();
        this.setupSearchFunctionality();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupCodeHighlighting();
    }

    // Navigation Setup
    setupNavigation() {
        const navSections = document.querySelectorAll('.nav-section, .nav-subsection');
        
        navSections.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    this.scrollToSection(targetElement);
                    this.updateActiveNavigation(link);
                }
            });
        });
    }

    // Scroll to Section
    scrollToSection(element) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const elementPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }

    // Update Active Navigation
    updateActiveNavigation(activeLink) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-section, .nav-subsection').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked item
        activeLink.classList.add('active');
        
        // If it's a subsection, also activate parent section
        if (activeLink.classList.contains('nav-subsection')) {
            const parentSection = activeLink.closest('li').parentElement.previousElementSibling;
            if (parentSection && parentSection.classList.contains('nav-section')) {
                parentSection.classList.add('active');
            }
        }
    }

    // Code Copying Functionality
    setupCodeCopying() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const codeBlock = button.closest('.code-block');
                const codeElement = codeBlock.querySelector('code');
                const codeText = codeElement.textContent;
                
                this.copyToClipboard(codeText, button);
            });
        });
    }

    // Copy to Clipboard
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopySuccess(button);
        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(text, button);
        }
    }

    // Fallback Copy Method
    fallbackCopyToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(button);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showCopyError(button);
        }
        
        document.body.removeChild(textArea);
    }

    // Show Copy Success
    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = '#4caf50';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '';
        }, 2000);
    }

    // Show Copy Error
    showCopyError(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-times"></i>';
        button.style.color = '#f44336';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '';
        }, 2000);
    }

    // Scroll Spy
    setupScrollSpy() {
        const sections = document.querySelectorAll('.api-section');
        const navLinks = document.querySelectorAll('.nav-section, .nav-subsection');
        
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    this.updateScrollSpyNavigation(id, navLinks);
                }
            });
        }, observerOptions);
        
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Update Scroll Spy Navigation
    updateScrollSpyNavigation(activeId, navLinks) {
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Search Functionality
    setupSearchFunctionality() {
        // Create search input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'api-search';
        searchContainer.innerHTML = `
            <div class="search-input-container">
                <i class="fas fa-search"></i>
                <input type="text" id="apiSearch" placeholder="Suche in der Dokumentation..." />
                <button id="clearSearch" class="clear-search" style="display: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="searchResults" class="search-results" style="display: none;"></div>
        `;
        
        // Insert search before sidebar nav
        const sidebar = document.querySelector('.api-sidebar');
        sidebar.insertBefore(searchContainer, sidebar.firstChild);
        
        // Add search styles
        this.addSearchStyles();
        
        // Setup search event listeners
        const searchInput = document.getElementById('apiSearch');
        const clearButton = document.getElementById('clearSearch');
        const searchResults = document.getElementById('searchResults');
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length > 0) {
                clearButton.style.display = 'block';
                searchTimeout = setTimeout(() => {
                    this.performSearch(query, searchResults);
                }, 300);
            } else {
                clearButton.style.display = 'none';
                searchResults.style.display = 'none';
            }
        });
        
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.style.display = 'none';
            searchResults.style.display = 'none';
            searchInput.focus();
        });
    }

    // Add Search Styles
    addSearchStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .api-search {
                margin-bottom: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .search-input-container {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .search-input-container i {
                position: absolute;
                left: 0.75rem;
                color: var(--text-muted);
                z-index: 1;
            }
            
            #apiSearch {
                width: 100%;
                padding: 0.75rem 2.5rem 0.75rem 2.5rem;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--input-bg);
                color: var(--text-primary);
                font-size: 0.9rem;
                transition: all 0.2s ease;
            }
            
            #apiSearch:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px var(--primary-color-alpha);
            }
            
            .clear-search {
                position: absolute;
                right: 0.75rem;
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .clear-search:hover {
                background: var(--hover-bg);
                color: var(--text-primary);
            }
            
            .search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: var(--shadow-md);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                margin-top: 0.5rem;
            }
            
            .search-result-item {
                padding: 0.75rem;
                border-bottom: 1px solid var(--border-color);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            .search-result-item:hover {
                background: var(--hover-bg);
            }
            
            .search-result-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
            }
            
            .search-result-content {
                font-size: 0.85rem;
                color: var(--text-secondary);
                line-height: 1.4;
            }
            
            .search-highlight {
                background: var(--primary-color-alpha);
                color: var(--primary-color);
                padding: 0.1rem 0.2rem;
                border-radius: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    // Perform Search
    performSearch(query, resultsContainer) {
        const sections = document.querySelectorAll('.api-section');
        const results = [];
        
        sections.forEach(section => {
            const title = section.querySelector('h2, h3')?.textContent || '';
            const content = section.textContent.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (content.includes(queryLower)) {
                const snippet = this.extractSnippet(section.textContent, query);
                results.push({
                    id: section.id,
                    title: title,
                    snippet: snippet
                });
            }
        });
        
        this.displaySearchResults(results, query, resultsContainer);
    }

    // Extract Search Snippet
    extractSnippet(text, query) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        const index = textLower.indexOf(queryLower);
        
        if (index === -1) return text.substring(0, 100) + '...';
        
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);
        
        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        return snippet;
    }

    // Display Search Results
    displaySearchResults(results, query, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-result-item">
                    <div class="search-result-title">Keine Ergebnisse gefunden</div>
                    <div class="search-result-content">Versuche einen anderen Suchbegriff.</div>
                </div>
            `;
        } else {
            container.innerHTML = results.map(result => {
                const highlightedSnippet = this.highlightSearchTerm(result.snippet, query);
                return `
                    <div class="search-result-item" data-target="${result.id}">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-content">${highlightedSnippet}</div>
                    </div>
                `;
            }).join('');
            
            // Add click listeners to results
            container.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const targetId = item.dataset.target;
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        this.scrollToSection(targetElement);
                        container.style.display = 'none';
                    }
                });
            });
        }
        
        container.style.display = 'block';
    }

    // Highlight Search Term
    highlightSearchTerm(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    // Theme Toggle
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                // Update icon
                const icon = themeToggle.querySelector('i');
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            });
        }
    }

    // Mobile Menu
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = mobileMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.className = 'fas fa-bars';
                }
            });
        }
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        // Handle anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    this.scrollToSection(targetElement);
                }
            });
        });
    }

    // Code Highlighting
    setupCodeHighlighting() {
        // Prism.js should handle this automatically
        // But we can add custom highlighting for inline code
        document.querySelectorAll('code:not([class*="language-"])')?.forEach(code => {
            if (!code.closest('pre')) {
                code.classList.add('inline-code');
            }
        });
    }

    // Utility: Show Toast Notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Copy Code Function (Global)
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const codeElement = codeBlock.querySelector('code');
    const codeText = codeElement.textContent;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = '#4caf50';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new APIDocumentation();
    
    // Initialize StreamArchiveApp for login functionality
    if (typeof StreamArchiveApp !== 'undefined') {
        window.streamApp = new StreamArchiveApp();
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
});