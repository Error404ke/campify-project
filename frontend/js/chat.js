// Chat functionality
class ChatManager {
    constructor(socket, apiBaseUrl = 'http://localhost:5000/api') {
        this.socket = socket;
        this.apiBaseUrl = apiBaseUrl;
        this.currentRoom = null;
        this.messages = new Map(); // room_id -> messages array
        this.typingUsers = new Map(); // room_id -> Set of user_ids
        
        this.initSocketEvents();
    }
    
    initSocketEvents() {
        if (!this.socket) return;
        
        // Message received
        this.socket.on('new_message', (message) => {
            this.handleNewMessage(message);
        });
        
        // Message sent confirmation
        this.socket.on('message_sent', (data) => {
            this.handleMessageSent(data);
        });
        
        // User typing
        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });
        
        // Room joined
        this.socket.on('room_joined', (data) => {
            console.log('Joined room:', data.room_id);
        });
        
        // Room left
        this.socket.on('room_left', (data) => {
            console.log('Left room:', data.room_id);
        });
    }
    
    // Join a chat room
    joinRoom(roomId) {
        if (!this.socket || !this.socket.connected) {
            console.error('Socket not connected');
            return false;
        }
        
        if (this.currentRoom) {
            this.leaveRoom(this.currentRoom);
        }
        
        this.socket.emit('join_room', { room_id: roomId });
        this.currentRoom = roomId;
        
        // Load previous messages
        this.loadRoomMessages(roomId);
        
        return true;
    }
    
    // Leave a chat room
    leaveRoom(roomId) {
        if (!this.socket || !this.socket.connected) {
            return false;
        }
        
        this.socket.emit('leave_room', { room_id: roomId });
        
        if (this.currentRoom === roomId) {
            this.currentRoom = null;
        }
        
        return true;
    }
    
    // Send a message
    sendMessage(content, type = 'text', metadata = {}) {
        if (!this.socket || !this.socket.connected) {
            console.error('Socket not connected');
            return false;
        }
        
        if (!this.currentRoom) {
            console.error('No room selected');
            return false;
        }
        
        if (!content || content.trim() === '') {
            console.error('Message content is empty');
            return false;
        }
        
        const messageData = {
            room_id: this.currentRoom,
            content: content.trim(),
            type: type,
            metadata: metadata
        };
        
        this.socket.emit('send_message', messageData);
        
        // Add to local messages immediately (optimistic update)
        const tempMessage = {
            id: `temp_${Date.now()}`,
            room_id: this.currentRoom,
            content: content.trim(),
            type: type,
            timestamp: new Date().toISOString(),
            sender_id: 'temp',
            status: 'sending',
            metadata: metadata
        };
        
        this.addMessageToRoom(this.currentRoom, tempMessage);
        
        return true;
    }
    
    // Send typing indicator
    sendTypingIndicator(isTyping = true) {
        if (!this.socket || !this.socket.connected || !this.currentRoom) {
            return false;
        }
        
        this.socket.emit('typing', {
            room_id: this.currentRoom,
            is_typing: isTyping
        });
        
        return true;
    }
    
    // Load messages for a room
    async loadRoomMessages(roomId, limit = 50, skip = 0) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/chat/messages/${roomId}?limit=${limit}&skip=${skip}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Store messages
                    this.messages.set(roomId, data.messages.reverse()); // Reverse to show oldest first
                    
                    // Trigger event for UI update
                    this.triggerEvent('messages_loaded', {
                        roomId: roomId,
                        messages: data.messages,
                        unreadCount: data.unread_count
                    });
                    
                    return data.messages;
                }
            }
            
            return [];
        } catch (error) {
            console.error('Failed to load messages:', error);
            return [];
        }
    }
    
    // Handle new message from socket
    handleNewMessage(message) {
        const roomId = message.room_id;
        
        // Add message to room
        this.addMessageToRoom(roomId, message);
        
        // Update message status if it was a temp message
        if (message.sender_id !== 'temp') {
            // Check if we have a temp message with same content
            const roomMessages = this.messages.get(roomId) || [];
            const tempIndex = roomMessages.findIndex(m => 
                m.id.startsWith('temp_') && 
                m.content === message.content &&
                Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000
            );
            
            if (tempIndex !== -1) {
                // Replace temp message with real message
                roomMessages[tempIndex] = message;
                this.messages.set(roomId, roomMessages);
                
                this.triggerEvent('message_updated', {
                    roomId: roomId,
                    messageId: message.id,
                    message: message
                });
                
                return;
            }
        }
        
        // Trigger new message event
        this.triggerEvent('new_message', {
            roomId: roomId,
            message: message
        });
        
        // If message is in current room and user is not the sender, mark as read
        if (roomId === this.currentRoom && message.sender_id !== 'temp') {
            this.markMessageAsRead(message.id);
        }
    }
    
    // Handle message sent confirmation
    handleMessageSent(data) {
        // Update temp message status
        const roomMessages = this.messages.get(this.currentRoom) || [];
        const tempIndex = roomMessages.findIndex(m => m.id.startsWith('temp_'));
        
        if (tempIndex !== -1) {
            roomMessages[tempIndex].status = 'sent';
            this.messages.set(this.currentRoom, roomMessages);
            
            this.triggerEvent('message_status_updated', {
                roomId: this.currentRoom,
                messageId: roomMessages[tempIndex].id,
                status: 'sent'
            });
        }
    }
    
    // Handle user typing indicator
    handleUserTyping(data) {
        const { room_id, user_id, is_typing } = data;
        
        if (!this.typingUsers.has(room_id)) {
            this.typingUsers.set(room_id, new Set());
        }
        
        const typingSet = this.typingUsers.get(room_id);
        
        if (is_typing) {
            typingSet.add(user_id);
        } else {
            typingSet.delete(user_id);
        }
        
        // Trigger typing event
        this.triggerEvent('typing_update', {
            roomId: room_id,
            userId: user_id,
            isTyping: is_typing,
            typingUsers: Array.from(typingSet)
        });
    }
    
    // Mark message as read
    async markMessageAsRead(messageId) {
        try {
            await fetch(`${this.apiBaseUrl}/chat/messages/${messageId}/read`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    }
    
    // Add message to room
    addMessageToRoom(roomId, message) {
        if (!this.messages.has(roomId)) {
            this.messages.set(roomId, []);
        }
        
        const roomMessages = this.messages.get(roomId);
        
        // Don't add duplicate messages
        if (!roomMessages.some(m => m.id === message.id)) {
            roomMessages.push(message);
            
            // Sort by timestamp
            roomMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            this.messages.set(roomId, roomMessages);
        }
    }
    
    // Get messages for room
    getRoomMessages(roomId) {
        return this.messages.get(roomId) || [];
    }
    
    // Clear messages for room
    clearRoomMessages(roomId) {
        this.messages.delete(roomId);
    }
    
    // Event system for UI updates
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`chat:${eventName}`, { detail: data });
        window.dispatchEvent(event);
    }
    
    // Subscribe to chat events
    on(eventName, callback) {
        window.addEventListener(`chat:${eventName}`, (event) => {
            callback(event.detail);
        });
    }
    
    // Unsubscribe from chat events
    off(eventName, callback) {
        window.removeEventListener(`chat:${eventName}`, callback);
    }
}

// Export for use in other files
window.ChatManager = ChatManager;