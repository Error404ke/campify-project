// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';
let socket;
let currentUser = null;
let currentRoomId = 'general';

// Initialize on page load
window.addEventListener('load', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    await loadUserProfile();
    await initializeSocket();
    setupEventListeners();
    await loadChatRooms();
});

/**
 * Load user profile from API
 */
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load profile');

        const data = await response.json();
        currentUser = data.user;

        // Update UI with user info
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userUniversity').textContent = currentUser.university;

        // Update header user info
        const userAvatarText = currentUser.name.charAt(0).toUpperCase();
        document.querySelectorAll('[id*="userAvatar"]').forEach(el => {
            el.textContent = userAvatarText;
            el.title = currentUser.name;
        });

        return currentUser;
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}

/**
 * Initialize Socket.IO connection
 */
async function initializeSocket() {
    return new Promise((resolve) => {
        socket = io('http://localhost:5000', {
            auth: {
                token: localStorage.getItem('token')
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
            updateSocketStatus('connected');
            socket.emit('authenticate', { token: localStorage.getItem('token') });
            resolve();
        });

        socket.on('authenticated', (data) => {
            console.log('Socket authenticated:', data);
        });

        socket.on('new_message', (message) => {
            if (message.room_id === currentRoomId) {
                displayMessage(message);
            }
            updateUnreadCount(message.room_id);
        });

        socket.on('user_typing', (data) => {
            if (data.room_id === currentRoomId && data.is_typing) {
                document.getElementById('typingUsers').textContent = data.user_id;
                document.getElementById('typingIndicator').style.display = 'block';
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            updateSocketStatus('disconnected');
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            updateSocketStatus('error');
        });
    });
}

/**
 * Update socket connection status indicator
 */
function updateSocketStatus(status) {
    const statusEl = document.getElementById('socketStatus');
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('.status-text');

    switch (status) {
        case 'connected':
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Connected to campus network';
            statusEl.style.display = 'none';
            break;
        case 'disconnected':
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Disconnected from network';
            statusEl.style.display = 'flex';
            break;
        case 'error':
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Connection error';
            statusEl.style.display = 'flex';
            break;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Chat room selection
    document.addEventListener('click', (e) => {
        if (e.target.closest('.room-item')) {
            const roomId = e.target.closest('.room-item').dataset.room;
            switchChatRoom(roomId);
        }
    });

    // Message sending
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Message typing indicator
    document.getElementById('messageInput').addEventListener('input', () => {
        socket.emit('typing', { room_id: currentRoomId, is_typing: true });
    });

    // Create group button
    document.getElementById('createGroupBtn').addEventListener('click', () => {
        document.getElementById('createGroupModal').style.display = 'flex';
    });

    // Create group form
    document.getElementById('createGroupForm').addEventListener('submit', createStudyGroup);

    // Modal close
    document.getElementById('closeGroupModal').addEventListener('click', () => {
        document.getElementById('createGroupModal').style.display = 'none';
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Notification bell
    document.getElementById('notificationBell').addEventListener('click', toggleNotifications);
}

/**
 * Switch dashboard section
 */
function switchSection(section) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.getElementById(section + 'Section').classList.add('active');

    if (section === 'study-groups') {
        loadStudyGroups();
    } else if (section === 'events') {
        loadEvents();
    } else if (section === 'announcements') {
        loadAnnouncements();
    }
}

/**
 * Load chat rooms
 */
async function loadChatRooms() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load rooms');

        const data = await response.json();
        const roomsList = document.getElementById('roomsList');
        roomsList.innerHTML = '';

        data.rooms.forEach(room => {
            const roomEl = createRoomElement(room);
            roomsList.appendChild(roomEl);
        });
    } catch (error) {
        console.error('Error loading rooms:', error);
        showNotification('Failed to load chat rooms', 'error');
    }
}

/**
 * Create room element
 */
function createRoomElement(room) {
    const div = document.createElement('div');
    div.className = 'room-item' + (room.id === currentRoomId ? ' active' : '');
    div.dataset.room = room.id;
    div.innerHTML = `
        <div class="room-icon">
            <i class="fas fa-${room.type === 'public' ? 'globe' : 'users'}"></i>
        </div>
        <div class="room-info">
            <h4 class="room-name">${room.name}</h4>
            <p class="room-last-message">${room.last_message || 'No messages yet'}</p>
        </div>
        <div class="room-meta">
            <span class="room-time">${room.last_message_time ? formatTime(new Date(room.last_message_time)) : 'Never'}</span>
            ${room.unread_count > 0 ? `<span class="room-unread">${room.unread_count}</span>` : ''}
        </div>
    `;
    return div;
}

/**
 * Switch to different chat room
 */
function switchChatRoom(roomId) {
    currentRoomId = roomId;
    document.querySelectorAll('.room-item').forEach(r => r.classList.remove('active'));
    document.querySelector(`[data-room="${roomId}"]`).classList.add('active');

    // Update room info
    const room = document.querySelector(`[data-room="${roomId}"]`);
    const roomName = room.querySelector('.room-name').textContent;
    document.getElementById('currentRoomName').textContent = roomName;

    // Join room via socket
    socket.emit('join_room', { room_id: roomId });

    // Load messages
    loadMessages(roomId);
}

/**
 * Load messages for room
 */
async function loadMessages(roomId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/chat/messages/${roomId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load messages');

        const data = await response.json();
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        data.messages.forEach(msg => {
            displayMessage(msg);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Failed to load messages', 'error');
    }
}

/**
 * Display message
 */
function displayMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageEl = document.createElement('div');
    messageEl.className = 'message ' + (message.sender_id === currentUser._id ? 'sent' : 'received');

    messageEl.innerHTML = `
        ${message.sender_id !== currentUser._id ? `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        ` : ''}
        <div class="message-content">
            ${message.sender_id !== currentUser._id ? `<div class="message-sender">${message.sender_name}</div>` : ''}
            <div class="message-text">${escapeHtml(message.content)}</div>
            <div class="message-time">${formatTime(new Date(message.timestamp))}</div>
        </div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Send message
 */
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content) return;

    try {
        socket.emit('send_message', {
            room_id: currentRoomId,
            content: content,
            type: 'text'
        });

        input.value = '';
        document.getElementById('typingIndicator').style.display = 'none';
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

/**
 * Load study groups
 */
async function loadStudyGroups() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/groups?university=${encodeURIComponent(currentUser.university)}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Failed to load groups');

        const data = await response.json();
        const container = document.getElementById('studyGroupsContainer');
        container.innerHTML = '';

        data.groups.forEach(group => {
            const groupEl = createGroupElement(group);
            container.appendChild(groupEl);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
        showNotification('Failed to load study groups', 'error');
    }
}

/**
 * Create group element
 */
function createGroupElement(group) {
    const div = document.createElement('div');
    div.className = 'group-card';
    div.innerHTML = `
        <div class="group-header">
            <h3>${group.name}</h3>
            <span class="group-badge">${group.members ? group.members.length : 0} members</span>
        </div>
        <p class="group-description">${group.description || 'No description'}</p>
        <div class="group-meta">
            <span><i class="fas fa-book"></i> ${group.course_code}</span>
            <span><i class="fas fa-lock"></i> ${group.privacy || 'Public'}</span>
        </div>
        <button class="btn btn-primary btn-small" onclick="joinGroup('${group._id}')">
            <i class="fas fa-plus"></i> Join Group
        </button>
    `;
    return div;
}

/**
 * Create study group
 */
async function createStudyGroup(e) {
    e.preventDefault();

    try {
        const token = localStorage.getItem('token');
        const formData = {
            name: document.getElementById('groupName').value,
            course_code: document.getElementById('courseCode').value,
            course_name: document.getElementById('courseName').value,
            description: document.getElementById('groupDescription').value,
            privacy: document.getElementById('groupPrivacy').value,
            university: currentUser.university
        };

        const response = await fetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to create group');

        showNotification('Group created successfully!', 'success');
        document.getElementById('createGroupModal').style.display = 'none';
        document.getElementById('createGroupForm').reset();
        loadStudyGroups();
    } catch (error) {
        console.error('Error creating group:', error);
        showNotification('Failed to create group: ' + error.message, 'error');
    }
}

/**
 * Join study group
 */
async function joinGroup(groupId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to join group');

        showNotification('Joined group successfully!', 'success');
        loadStudyGroups();
    } catch (error) {
        console.error('Error joining group:', error);
        showNotification('Failed to join group', 'error');
    }
}

/**
 * Load events
 */
async function loadEvents() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/events?university=${encodeURIComponent(currentUser.university)}&upcoming=true`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Failed to load events');

        const data = await response.json();
        console.log('Events loaded:', data);
        showNotification('Events loaded', 'success');
    } catch (error) {
        console.error('Error loading events:', error);
        showNotification('Failed to load events', 'error');
    }
}

/**
 * Load announcements
 */
async function loadAnnouncements() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/announcements?university=${encodeURIComponent(currentUser.university)}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Failed to load announcements');

        const data = await response.json();
        console.log('Announcements loaded:', data);
        showNotification('Announcements loaded', 'success');
    } catch (error) {
        console.error('Error loading announcements:', error);
        showNotification('Failed to load announcements', 'error');
    }
}

/**
 * Update unread count for room
 */
function updateUnreadCount(roomId) {
    const roomEl = document.querySelector(`[data-room="${roomId}"]`);
    if (roomEl) {
        let unreadEl = roomEl.querySelector('.room-unread');
        if (!unreadEl) {
            unreadEl = document.createElement('span');
            unreadEl.className = 'room-unread';
            roomEl.querySelector('.room-meta').appendChild(unreadEl);
        }
        unreadEl.textContent = (parseInt(unreadEl.textContent || 0) + 1);
    }
}

/**
 * Toggle notifications panel
 */
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 6px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

/**
 * Format timestamp
 */
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('token');
    if (socket) socket.disconnect();
    window.location.href = 'index.html';
}
