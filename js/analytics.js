// Analytics Dashboard JavaScript

class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.currentTimeRange = '7d';
        this.mockData = this.generateMockData();
        this.init();
    }

    init() {
        this.setupTimeRangeSelector();
        this.loadMetrics();
        this.initializeCharts();
        this.setupTableFunctionality();
        this.setupExportFunctions();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.startRealTimeUpdates();
    }

    // Generate Data from localStorage
    generateMockData() {
        // Load real streams from localStorage
        const realStreams = JSON.parse(localStorage.getItem('streamArchive_streams') || '[]');
        
        // Convert real streams to analytics format
        const streams = realStreams.map(stream => ({
            id: stream.id,
            title: stream.title,
            game: stream.game || 'Unbekannt',
            date: new Date(stream.date || stream.createdAt || Date.now()),
            duration: stream.duration || 0,
            views: stream.views || stream.viewCount || 0,
            watchTime: Math.floor((stream.views || stream.viewCount || 0) * (stream.duration || 0) * 0.5), // Estimate 50% completion
            completionRate: 50, // Default completion rate
            comments: stream.comments || 0,
            rating: '4.0'
        }));
        
        return {
            streams: streams,
            devices: {
                'Desktop': 65,
                'Mobile': 25,
                'Tablet': 10
            },
            browsers: {
                'Chrome': 45,
                'Firefox': 25,
                'Safari': 20,
                'Edge': 10
            },
            regions: {
                'Deutschland': 60,
                'Österreich': 15,
                'Schweiz': 12,
                'Niederlande': 8,
                'Andere': 5
            }
        };
    }

    // Time Range Selector
    setupTimeRangeSelector() {
        const timeButtons = document.querySelectorAll('.time-btn');
        
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                timeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTimeRange = btn.dataset.range;
                this.updateDashboard();
            });
        });
    }

    // Load Metrics
    loadMetrics() {
        const filteredStreams = this.filterStreamsByTimeRange(this.mockData.streams);
        
        const totalViews = filteredStreams.reduce((sum, stream) => sum + stream.views, 0);
        const totalWatchTime = filteredStreams.reduce((sum, stream) => sum + stream.watchTime, 0);
        const uniqueViewers = Math.floor(totalViews * 0.7); // Estimate
        const totalComments = filteredStreams.reduce((sum, stream) => sum + stream.comments, 0);
        const avgCompletion = filteredStreams.reduce((sum, stream) => sum + stream.completionRate, 0) / filteredStreams.length;
        
        // Update DOM
        document.getElementById('totalViews').textContent = this.formatNumber(totalViews);
        document.getElementById('watchTime').textContent = this.formatDuration(totalWatchTime);
        document.getElementById('uniqueViewers').textContent = this.formatNumber(uniqueViewers);
        document.getElementById('totalStreams').textContent = filteredStreams.length;
        document.getElementById('totalComments').textContent = this.formatNumber(totalComments);
        document.getElementById('avgCompletion').textContent = Math.round(avgCompletion) + '%';
        
        // Update changes (mock data)
        document.getElementById('viewsChange').textContent = '+' + (Math.random() * 20 + 5).toFixed(1) + '%';
        document.getElementById('watchTimeChange').textContent = '+' + (Math.random() * 15 + 3).toFixed(1) + '%';
        document.getElementById('viewersChange').textContent = '+' + (Math.random() * 25 + 8).toFixed(1) + '%';
        document.getElementById('streamsChange').textContent = '+' + Math.floor(Math.random() * 5 + 1);
        document.getElementById('commentsChange').textContent = '+' + (Math.random() * 30 + 10).toFixed(1) + '%';
        document.getElementById('completionChange').textContent = '+' + (Math.random() * 5 + 1).toFixed(1) + '%';
        
        // Update demographics
        document.getElementById('avgSessionDuration').textContent = Math.floor(Math.random() * 60 + 30) + ' min';
        document.getElementById('returningViewers').textContent = Math.floor(Math.random() * 30 + 40) + '%';
        document.getElementById('mobilePercentage').textContent = this.mockData.devices.Mobile + '%';
        document.getElementById('peakTime').textContent = '20:' + String(Math.floor(Math.random() * 60)).padStart(2, '0');
    }

    // Filter Streams by Time Range
    filterStreamsByTimeRange(streams) {
        const now = new Date();
        let cutoffDate = new Date();
        
        switch (this.currentTimeRange) {
            case '7d':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                cutoffDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
                return streams;
        }
        
        return streams.filter(stream => stream.date >= cutoffDate);
    }

    // Initialize Charts
    initializeCharts() {
        this.createViewsChart();
        this.createTopStreamsChart();
        this.createGamesChart();
        this.createActivityChart();
        this.createDemographicsCharts();
    }

    // Views Over Time Chart
    createViewsChart() {
        const ctx = document.getElementById('viewsChart').getContext('2d');
        const filteredStreams = this.filterStreamsByTimeRange(this.mockData.streams);
        
        // Group by date
        const viewsByDate = {};
        filteredStreams.forEach(stream => {
            const dateKey = stream.date.toISOString().split('T')[0];
            viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + stream.views;
        });
        
        const labels = Object.keys(viewsByDate).sort();
        const data = labels.map(date => viewsByDate[date]);
        
        this.charts.views = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(date => new Date(date).toLocaleDateString('de-DE')),
                datasets: [{
                    label: 'Views',
                    data: data,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Chart type toggle
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const newType = btn.dataset.type;
                this.charts.views.config.type = newType;
                this.charts.views.update();
            });
        });
    }

    // Top Streams Chart
    createTopStreamsChart() {
        const ctx = document.getElementById('topStreamsChart').getContext('2d');
        const filteredStreams = this.filterStreamsByTimeRange(this.mockData.streams);
        
        const topStreams = filteredStreams
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);
        
        this.charts.topStreams = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topStreams.map(stream => stream.title.substring(0, 20) + '...'),
                datasets: [{
                    label: 'Views',
                    data: topStreams.map(stream => stream.views),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Filter change
        document.getElementById('topStreamsFilter').addEventListener('change', (e) => {
            const sortBy = e.target.value;
            let sortedStreams;
            
            switch (sortBy) {
                case 'views':
                    sortedStreams = filteredStreams.sort((a, b) => b.views - a.views);
                    break;
                case 'watchtime':
                    sortedStreams = filteredStreams.sort((a, b) => b.watchTime - a.watchTime);
                    break;
                case 'comments':
                    sortedStreams = filteredStreams.sort((a, b) => b.comments - a.comments);
                    break;
                case 'completion':
                    sortedStreams = filteredStreams.sort((a, b) => b.completionRate - a.completionRate);
                    break;
            }
            
            const topSorted = sortedStreams.slice(0, 10);
            this.charts.topStreams.data.labels = topSorted.map(stream => stream.title.substring(0, 20) + '...');
            this.charts.topStreams.data.datasets[0].data = topSorted.map(stream => {
                switch (sortBy) {
                    case 'views': return stream.views;
                    case 'watchtime': return Math.floor(stream.watchTime / 3600);
                    case 'comments': return stream.comments;
                    case 'completion': return stream.completionRate;
                }
            });
            this.charts.topStreams.update();
        });
    }

    // Games Distribution Chart
    createGamesChart() {
        const ctx = document.getElementById('gamesChart').getContext('2d');
        const filteredStreams = this.filterStreamsByTimeRange(this.mockData.streams);
        
        const gameStats = {};
        filteredStreams.forEach(stream => {
            gameStats[stream.game] = (gameStats[stream.game] || 0) + stream.views;
        });
        
        const sortedGames = Object.entries(gameStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);
        
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
            '#10b981', '#3b82f6', '#ef4444'
        ];
        
        this.charts.games = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedGames.map(([game]) => game),
                datasets: [{
                    data: sortedGames.map(([, views]) => views),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Create custom legend
        const legend = document.getElementById('gamesLegend');
        legend.innerHTML = sortedGames.map(([game, views], index) => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${colors[index]}"></div>
                <span>${game} (${this.formatNumber(views)})</span>
            </div>
        `).join('');
    }

    // Activity Chart
    createActivityChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        // Generate hourly activity data
        const hourlyData = Array.from({length: 24}, (_, hour) => {
            // Peak around 20:00, lower during night
            const base = Math.sin((hour - 6) * Math.PI / 12) * 0.5 + 0.5;
            const peak = hour >= 18 && hour <= 22 ? 1.5 : 1;
            return Math.floor(Math.random() * 100 * base * peak + 10);
        });
        
        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => i + ':00'),
                datasets: [{
                    label: 'Aktive Viewer',
                    data: hourlyData,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Demographics Charts
    createDemographicsCharts() {
        this.createDeviceChart();
        this.createBrowserChart();
        this.createRegionChart();
    }

    createDeviceChart() {
        const ctx = document.getElementById('deviceChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(this.mockData.devices),
                datasets: [{
                    data: Object.values(this.mockData.devices),
                    backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Update stats
        const deviceStats = document.getElementById('deviceStats');
        deviceStats.innerHTML = Object.entries(this.mockData.devices).map(([device, percentage]) => `
            <div class="demo-stat-item">
                <span class="demo-stat-label">${device}</span>
                <span class="demo-stat-value">${percentage}%</span>
            </div>
        `).join('');
    }

    createBrowserChart() {
        const ctx = document.getElementById('browserChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(this.mockData.browsers),
                datasets: [{
                    data: Object.values(this.mockData.browsers),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Update stats
        const browserStats = document.getElementById('browserStats');
        browserStats.innerHTML = Object.entries(this.mockData.browsers).map(([browser, percentage]) => `
            <div class="demo-stat-item">
                <span class="demo-stat-label">${browser}</span>
                <span class="demo-stat-value">${percentage}%</span>
            </div>
        `).join('');
    }

    createRegionChart() {
        const ctx = document.getElementById('regionChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(this.mockData.regions),
                datasets: [{
                    data: Object.values(this.mockData.regions),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Update stats
        const regionStats = document.getElementById('regionStats');
        regionStats.innerHTML = Object.entries(this.mockData.regions).map(([region, percentage]) => `
            <div class="demo-stat-item">
                <span class="demo-stat-label">${region}</span>
                <span class="demo-stat-value">${percentage}%</span>
            </div>
        `).join('');
    }

    // Table Functionality
    setupTableFunctionality() {
        this.populateStreamsTable();
        this.setupTableSearch();
        this.setupTableSort();
    }

    populateStreamsTable() {
        const tbody = document.getElementById('streamsTableBody');
        const filteredStreams = this.filterStreamsByTimeRange(this.mockData.streams)
            .sort((a, b) => b.date - a.date)
            .slice(0, 20);
        
        tbody.innerHTML = filteredStreams.map(stream => `
            <tr>
                <td>
                    <div class="stream-title">${stream.title}</div>
                </td>
                <td>${stream.date.toLocaleDateString('de-DE')}</td>
                <td><span class="game-tag">${stream.game}</span></td>
                <td>${this.formatDuration(stream.duration)}</td>
                <td>${this.formatNumber(stream.views)}</td>
                <td>${this.formatDuration(stream.watchTime)}</td>
                <td>${stream.completionRate}%</td>
                <td>${stream.comments}</td>
                <td>
                    <span class="rating-stars">
                        ${'★'.repeat(Math.floor(stream.rating))}${'☆'.repeat(5 - Math.floor(stream.rating))}
                    </span>
                    ${stream.rating}
                </td>
            </tr>
        `).join('');
    }

    setupTableSearch() {
        const searchInput = document.getElementById('streamSearch');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#streamsTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    setupTableSort() {
        const sortSelect = document.getElementById('streamSort');
        sortSelect.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            let sortedStreams = [...this.filterStreamsByTimeRange(this.mockData.streams)];
            
            switch (sortBy) {
                case 'date':
                    sortedStreams.sort((a, b) => b.date - a.date);
                    break;
                case 'views':
                    sortedStreams.sort((a, b) => b.views - a.views);
                    break;
                case 'duration':
                    sortedStreams.sort((a, b) => b.duration - a.duration);
                    break;
                case 'completion':
                    sortedStreams.sort((a, b) => b.completionRate - a.completionRate);
                    break;
            }
            
            const tbody = document.getElementById('streamsTableBody');
            tbody.innerHTML = sortedStreams.slice(0, 20).map(stream => `
                <tr>
                    <td><div class="stream-title">${stream.title}</div></td>
                    <td>${stream.date.toLocaleDateString('de-DE')}</td>
                    <td><span class="game-tag">${stream.game}</span></td>
                    <td>${this.formatDuration(stream.duration)}</td>
                    <td>${this.formatNumber(stream.views)}</td>
                    <td>${this.formatDuration(stream.watchTime)}</td>
                    <td>${stream.completionRate}%</td>
                    <td>${stream.comments}</td>
                    <td>
                        <span class="rating-stars">
                            ${'★'.repeat(Math.floor(stream.rating))}${'☆'.repeat(5 - Math.floor(stream.rating))}
                        </span>
                        ${stream.rating}
                    </td>
                </tr>
            `).join('');
        });
    }

    // Export Functions
    setupExportFunctions() {
        window.exportData = (format) => {
            const filteredStreams = this.filterStreamsByTimeRange(this.mockData.streams);
            
            switch (format) {
                case 'csv':
                    this.exportCSV(filteredStreams);
                    break;
                case 'json':
                    this.exportJSON(filteredStreams);
                    break;
                case 'pdf':
                    this.exportPDF(filteredStreams);
                    break;
            }
        };
    }

    exportCSV(data) {
        const headers = ['Title', 'Game', 'Date', 'Duration', 'Views', 'Watch Time', 'Completion Rate', 'Comments', 'Rating'];
        const csvContent = [
            headers.join(','),
            ...data.map(stream => [
                `"${stream.title}"`,
                `"${stream.game}"`,
                stream.date.toISOString().split('T')[0],
                stream.duration,
                stream.views,
                stream.watchTime,
                stream.completionRate,
                stream.comments,
                stream.rating
            ].join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, 'analytics-data.csv', 'text/csv');
    }

    exportJSON(data) {
        const jsonContent = JSON.stringify({
            exportDate: new Date().toISOString(),
            timeRange: this.currentTimeRange,
            streams: data,
            summary: {
                totalStreams: data.length,
                totalViews: data.reduce((sum, s) => sum + s.views, 0),
                totalWatchTime: data.reduce((sum, s) => sum + s.watchTime, 0),
                avgCompletionRate: data.reduce((sum, s) => sum + s.completionRate, 0) / data.length
            }
        }, null, 2);
        
        this.downloadFile(jsonContent, 'analytics-data.json', 'application/json');
    }

    exportPDF(data) {
        // Simplified PDF export (in real implementation, use jsPDF or similar)
        const content = `
Factor_KS Analytics Report
Generated: ${new Date().toLocaleDateString('de-DE')}
Time Range: ${this.currentTimeRange}

Summary:
- Total Streams: ${data.length}
- Total Views: ${this.formatNumber(data.reduce((sum, s) => sum + s.views, 0))}
- Total Watch Time: ${this.formatDuration(data.reduce((sum, s) => sum + s.watchTime, 0))}
- Average Completion Rate: ${Math.round(data.reduce((sum, s) => sum + s.completionRate, 0) / data.length)}%

Top 10 Streams by Views:
${data.sort((a, b) => b.views - a.views).slice(0, 10).map((stream, i) => 
    `${i + 1}. ${stream.title} - ${this.formatNumber(stream.views)} views`
).join('\n')}
        `;
        
        this.downloadFile(content, 'analytics-report.txt', 'text/plain');
        this.showToast('PDF export would require additional library in production', 'info');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`${filename} wurde heruntergeladen`, 'success');
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
                
                // Update charts for theme
                this.updateChartsForTheme(newTheme);
            });
        }
    }

    updateChartsForTheme(theme) {
        const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
        const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
        
        Object.values(this.charts).forEach(chart => {
            if (chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.ticks = chart.options.scales.x.ticks || {};
                    chart.options.scales.x.ticks.color = textColor;
                    chart.options.scales.x.grid = chart.options.scales.x.grid || {};
                    chart.options.scales.x.grid.color = gridColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks = chart.options.scales.y.ticks || {};
                    chart.options.scales.y.ticks.color = textColor;
                    chart.options.scales.y.grid = chart.options.scales.y.grid || {};
                    chart.options.scales.y.grid.color = gridColor;
                }
            }
            chart.update();
        });
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
        }
    }

    // Real-time Updates
    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.updateMetricsWithRandomChanges();
        }, 30000);
    }

    updateMetricsWithRandomChanges() {
        // Simulate small changes in metrics
        const elements = [
            { id: 'totalViews', current: parseInt(document.getElementById('totalViews').textContent.replace(/[^0-9]/g, '')) },
            { id: 'uniqueViewers', current: parseInt(document.getElementById('uniqueViewers').textContent.replace(/[^0-9]/g, '')) },
            { id: 'totalComments', current: parseInt(document.getElementById('totalComments').textContent.replace(/[^0-9]/g, '')) }
        ];
        
        elements.forEach(({ id, current }) => {
            const change = Math.floor(Math.random() * 10) + 1;
            const newValue = current + change;
            document.getElementById(id).textContent = this.formatNumber(newValue);
        });
    }

    // Update Dashboard
    updateDashboard() {
        this.loadMetrics();
        this.populateStreamsTable();
        
        // Update charts
        Object.values(this.charts).forEach(chart => {
            chart.destroy();
        });
        this.charts = {};
        this.initializeCharts();
    }

    // Utility Functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

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
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
});