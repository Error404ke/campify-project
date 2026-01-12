// Main JavaScript file for Campify
class CampifyApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.socketUrl = 'http://localhost:5000';
        
        this.init();
    }
    
    async init() {
        // Check authentication status
        await this.checkAuth();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Initialize modals
        this.initModals();
        
        // Initialize socket connection
        this.initSocket();
        
        // Update online users count
        this.updateStats();
    }
    
    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUIForLoggedInUser();
            }
        } catch (error) {
            console.log('User not logged in');
        }
    }
    
    updateUIForLoggedInUser() {
        // Update navigation
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        
        if (this.currentUser) {
            if (loginBtn) loginBtn.textContent = 'Dashboard';
            if (signupBtn) {
                signupBtn.textContent = 'Logout';
                signupBtn.onclick = () => this.logout();
            }
        }
    }
    
    initEventListeners() {
        // Navigation
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
        
        // Modal triggers
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const getStartedBtn = document.getElementById('getStartedBtn');
        const ctaSignupBtn = document.getElementById('ctaSignupBtn');
        
        if (loginBtn && !this.currentUser) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        if (signupBtn && !this.currentUser) {
            signupBtn.addEventListener('click', () => this.showSignupModal());
        }
        
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    window.location.href = 'dashboard.html';
                } else {
                    this.showSignupModal();
                }
            });
        }
        
        if (ctaSignupBtn) {
            ctaSignupBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    window.location.href = 'dashboard.html';
                } else {
                    this.showSignupModal();
                }
            });
        }
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Close mobile menu if open
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                }
            });
        });
        
        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }
    }
    
    initModals() {
        // Login modal
        const loginModal = document.getElementById('loginModal');
        const loginClose = document.getElementById('loginClose');
        const switchToSignup = document.getElementById('switchToSignup');
        
        if (loginClose) {
            loginClose.addEventListener('click', () => this.hideLoginModal());
        }
        
        if (switchToSignup) {
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLoginModal();
                this.showSignupModal();
            });
        }
        
        // Signup modal
        const signupModal = document.getElementById('signupModal');
        const signupClose = document.getElementById('signupClose');
        const switchToLogin = document.getElementById('switchToLogin');
        
        if (signupClose) {
            signupClose.addEventListener('click', () => this.hideSignupModal());
        }
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideSignupModal();
                this.showLoginModal();
            });
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.hideLoginModal();
            }
            if (e.target === signupModal) {
                this.hideSignupModal();
            }
        });
        
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Signup form submission
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
    }
    
    initSocket() {
        // Initialize socket connection
        this.socket = io(this.socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        // Socket event listeners
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            this.updateSocketStatus('connected');
            
            // Authenticate socket if user is logged in
            if (this.currentUser && this.currentUser.token) {
                this.socket.emit('authenticate', { token: this.currentUser.token });
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            this.updateSocketStatus('disconnected');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.updateSocketStatus('error');
        });
        
        this.socket.on('authenticated', (data) => {
            console.log('Socket authenticated:', data);
        });
        
        this.socket.on('user_online', (data) => {
            console.log('User online:', data);
            this.updateOnlineUsers();
        });
        
        this.socket.on('user_offline', (data) => {
            console.log('User offline:', data);
            this.updateOnlineUsers();
        });
        
        this.socket.on('new_message', (data) => {
            console.log('New message:', data);
            this.showNotification('New message', `${data.sender_name}: ${data.content}`);
        });
    }
    
    updateSocketStatus(status) {
        const socketStatus = document.getElementById('socketStatus');
        if (!socketStatus) return;
        
        const statusDot = socketStatus.querySelector('.status-dot');
        const statusText = socketStatus.querySelector('.status-text');
        
        socketStatus.className = 'socket-status';
        
        switch (status) {
            case 'connected':
                socketStatus.classList.add('connected');
                statusDot.textContent = '●';
                statusText.textContent = 'Connected to campus network';
                break;
            case 'disconnected':
                socketStatus.classList.add('disconnected');
                statusDot.textContent = '●';
                statusText.textContent = 'Disconnected - reconnecting...';
                break;
            case 'error':
                socketStatus.classList.add('error');
                statusDot.textContent = '●';
                statusText.textContent = 'Connection error';
                break;
            default:
                socketStatus.classList.add('connecting');
                statusDot.textContent = '●';
                statusText.textContent = 'Connecting to campus network...';
        }
    }
    
    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    showSignupModal() {
        const signupModal = document.getElementById('signupModal');
        if (signupModal) {
            signupModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideSignupModal() {
        const signupModal = document.getElementById('signupModal');
        if (signupModal) {
            signupModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.currentUser.token = data.token;
                
                // Store token in localStorage if remember me is checked
                if (rememberMe) {
                    localStorage.setItem('campify_token', data.token);
                }
                
                // Update UI
                this.updateUIForLoggedInUser();
                
                // Close modal
                this.hideLoginModal();
                
                // Show success message
                this.showNotification('Success', 'Logged in successfully!');
                
                // Authenticate socket
                if (this.socket && this.socket.connected) {
                    this.socket.emit('authenticate', { token: data.token });
                }
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showNotification('Error', data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Error', 'Login failed. Please try again.');
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const university = document.getElementById('signupUniversity').value;
        const major = document.getElementById('signupMajor').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validation
        if (password !== confirmPassword) {
            this.showNotification('Error', 'Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Error', 'Password must be at least 6 characters');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    university,
                    major,
                    year: '1' // Default year
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.currentUser.token = data.token;
                
                // Update UI
                this.updateUIForLoggedInUser();
                
                // Close modal
                this.hideSignupModal();
                
                // Show success message
                this.showNotification('Success', 'Account created successfully!');
                
                // Authenticate socket
                if (this.socket && this.socket.connected) {
                    this.socket.emit('authenticate', { token: data.token });
                }
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showNotification('Error', data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification('Error', 'Registration failed. Please try again.');
        }
    }
    
    async logout() {
        try {
            await fetch(`${this.apiBaseUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            // Clear local data
            this.currentUser = null;
            localStorage.removeItem('campify_token');
            
            // Update UI
            this.updateUIForLoggedInUser();
            
            // Disconnect socket
            if (this.socket) {
                this.socket.disconnect();
            }
            
            // Show notification
            this.showNotification('Success', 'Logged out successfully');
            
            // Refresh page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    async handleContactSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const university = document.getElementById('university').value;
        const interest = document.getElementById('interest').value;
        const message = document.getElementById('message').value;
        
        // Simulate form submission
        this.showNotification('Success', 'Message sent! We\'ll get back to you soon.');
        
        // Reset form
        e.target.reset();
    }
    
    async updateStats() {
        // Simulate fetching stats
        const onlineUsers = document.getElementById('onlineUsers');
        const activeGroups = document.getElementById('activeGroups');
        const campuses = document.getElementById('campuses');
        
        if (onlineUsers) onlineUsers.textContent = '2,847';
        if (activeGroups) activeGroups.textContent = '512';
        if (campuses) campuses.textContent = '28';
    }
    
    async updateOnlineUsers() {
        // This would fetch actual online users from API
        const onlineUsers = document.getElementById('onlineUsers');
        if (onlineUsers) {
            const current = parseInt(onlineUsers.textContent.replace(',', ''));
            const change = Math.floor(Math.random() * 10) - 5; // Random change
            const newCount = Math.max(2500, current + change);
            onlineUsers.textContent = newCount.toLocaleString();
        }
    }
    
    showNotification(title, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.campify = new CampifyApp();
});