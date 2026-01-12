# Campify - Campus Community Platform

A modern web application connecting students within their campus community through real-time chat, study groups, events, housing, and resources.

## 🚀 Features

- **Real-time Chat** - Socket.IO powered instant messaging
- **Study Groups** - Create and join study groups for courses
- **Campus Events** - Discover and attend campus events
- **Housing Marketplace** - Find housing near campus
- **Resources Library** - Share and access educational resources
- **Announcements** - Stay updated with campus news
- **User Profiles** - Connect with other students

## 🛠 Tech Stack

**Backend:**
- Flask + Flask-SocketIO (Python)
- MongoDB (NoSQL database)
- JWT Authentication
- Eventlet (async support)

**Frontend:**
- Vanilla JavaScript
- Socket.IO client
- Responsive CSS3
- Font Awesome icons

## 📋 Prerequisites

- Python 3.11+
- Node.js 16+
- MongoDB instance
- A modern web browser

## 🔧 Local Development

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Configure Environment
Create a `.env` file in the `backend/` directory:
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=campify_db
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Run Backend
```bash
python app.py
# Server runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
# No build step needed for development
# Use live-server or any local server
live-server
# Opens on http://127.0.0.1:8080
```

## 🚀 Production Deployment

### Backend Deployment (Recommended: Railway, Render, or Heroku)

**Environment Variables to set:**
- `FLASK_ENV=production`
- `SECRET_KEY` - Generate a strong random key
- `JWT_SECRET_KEY` - Generate a strong random key
- `MONGO_URI` - Your MongoDB Atlas connection string
- `MONGO_DB_NAME=campify_db`
- `CORS_ORIGINS=https://yourdomain.com`

**Deploy to Railway:**
1. Push code to GitHub
2. Connect to Railway.app
3. Add MongoDB addon
4. Set environment variables
5. Deploy!

**Deploy to Render:**
1. Push code to GitHub
2. Create new Web Service on render.com
3. Connect GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `gunicorn --worker-class eventlet -w 1 app:app`
6. Add environment variables
7. Deploy!

### Frontend Deployment (Recommended: Vercel, Netlify, or Firebase)

**Update API URL:**
Before deploying, update `API_BASE_URL` in `frontend/js/dashboard.js`:
```javascript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

**Deploy to Vercel:**
1. Push frontend code to GitHub
2. Import project in vercel.com
3. Deploy!

**Deploy to Netlify:**
1. Push code to GitHub
2. Connect to netlify.com
3. Set publish directory: `frontend`
4. Deploy!

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Chat
- `GET /api/chat/rooms` - List chat rooms
- `GET /api/chat/messages/:room_id` - Get messages
- `POST /api/chat/messages/:message_id/read` - Mark as read
- `DELETE /api/chat/messages/:message_id` - Delete message

### Users
- `GET /api/users` - List users
- `GET /api/users/:user_id` - Get user profile

### Study Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List groups
- `POST /api/groups/:group_id/join` - Join group
- `POST /api/groups/:group_id/leave` - Leave group

### Events
- `POST /api/events` - Create event
- `GET /api/events` - List events
- `POST /api/events/:event_id/join` - Join event
- `POST /api/events/:event_id/leave` - Leave event

### Housing
- `POST /api/housing` - Create listing
- `GET /api/housing` - Search listings
- `POST /api/housing/:listing_id/favorite` - Add favorite
- `DELETE /api/housing/:listing_id/favorite` - Remove favorite

### Courses
- `POST /api/courses` - Create course
- `GET /api/courses` - List courses
- `POST /api/courses/:course_id/enroll` - Enroll
- `POST /api/courses/:course_id/unenroll` - Unenroll

### Resources
- `POST /api/resources` - Upload resource
- `GET /api/resources` - List resources
- `POST /api/resources/:resource_id/like` - Like resource

### Announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements` - List announcements
- `GET /api/announcements/:announcement_id` - Get announcement

## 🔐 Security Notes

- Always use HTTPS in production
- Change SECRET_KEY and JWT_SECRET_KEY in production
- Use MongoDB Atlas with IP whitelisting
- Enable CORS only for your domain
- Regularly update dependencies
- Use strong passwords for admin accounts
- Set SESSION_COOKIE_SECURE=True in production

## 📝 Environment Variables Reference

```
# Core
FLASK_ENV=development|production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# Database
MONGO_URI=mongodb://user:pass@host:port/
MONGO_DB_NAME=campify_db

# CORS
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com

# Email (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure MongoDB is running
- Check `.env` file exists and is valid
- Verify Python 3.11+ installed

**Frontend can't connect to backend:**
- Check `API_BASE_URL` in dashboard.js
- Verify backend is running on port 5000
- Check CORS_ORIGINS environment variable
- Open browser console (F12) for errors

**Socket.IO connection fails:**
- Ensure WebSocket support enabled
- Check firewall isn't blocking port 5000
- Verify auth token is valid

## 📧 Support

For issues or questions, check the code comments or review the documentation in each module.

## 📄 License

MIT License

## 🎓 Built for Campus Communities

Campify aims to enhance student life by creating a connected, engaged campus community where students can learn, grow, and build lasting relationships.
