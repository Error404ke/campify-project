// Authentication utilities
class AuthManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
    }
    
    // Check if user is authenticated
    async isAuthenticated() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                credentials: 'include'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // Get current user
    async getCurrentUser() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    
    // Get authentication token
    async getToken() {
        const user = await this.getCurrentUser();
        return user ? user.token : null;
    }
    
    // Redirect to login if not authenticated
    async requireAuth(redirectUrl = '/') {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
            return false;
        }
        return true;
    }
    
    // Redirect to dashboard if already authenticated
    async redirectIfAuthenticated(redirectUrl = '/dashboard.html') {
        const isAuth = await this.isAuthenticated();
        if (isAuth) {
            window.location.href = redirectUrl;
            return true;
        }
        return false;
    }
    
    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to update profile' };
        }
    }
}

// Export for use in other files
window.AuthManager = AuthManager;