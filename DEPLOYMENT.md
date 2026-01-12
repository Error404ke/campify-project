# Campify Deployment Guide

## Quick Start Deployment Options

### Option 1: Railway (Recommended - Easiest)
**Cost:** Free tier available, $5/month starter plan

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → GitHub repo
4. Add MongoDB plugin (included free)
5. Set environment variables:
   ```
   FLASK_ENV=production
   SECRET_KEY=generate-random-key
   JWT_SECRET_KEY=generate-random-key
   MONGO_DB_NAME=campify_db
   CORS_ORIGINS=https://yourapp.up.railway.app
   ```
6. Deploy!
7. Frontend: Deploy to Vercel pointing to Railway backend

### Option 2: Render
**Cost:** Free tier available, $7/month hobby plan

**Backend:**
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Select Python 3.11
5. Build command: `pip install -r requirements.txt`
6. Start command: `gunicorn --worker-class eventlet -w 1 app:app`
7. Add MongoDB addon or use MongoDB Atlas
8. Set environment variables
9. Deploy

**Frontend:**
1. Deploy to Vercel or Netlify
2. Update API_BASE_URL to Render backend URL

### Option 3: Heroku (Legacy but still works)
**Cost:** $7/month minimum now

1. Install Heroku CLI
2. `heroku create campify-app`
3. Add MongoDB: `heroku addons:create mongolab:sandbox`
4. Set config: `heroku config:set FLASK_ENV=production`
5. `git push heroku main`
6. View logs: `heroku logs --tail`

### Option 4: AWS/DigitalOcean (Most Control)
**Cost:** $5-20/month

- Use EC2/Droplet
- Install Python, MongoDB, Nginx
- Deploy with PM2 or Gunicorn
- Use Let's Encrypt for HTTPS

## Frontend Deployment

### Vercel (Recommended)
1. Push frontend to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Import GitHub repo
4. Framework: Other (static files)
5. Publish directory: `frontend`
6. Create `.env.production` for API URL
7. Deploy

### Netlify
1. Push to GitHub
2. Go to [Netlify.com](https://netlify.com)
3. New site → GitHub repo
4. Publish: `frontend`
5. Deploy

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. `firebase init hosting`
3. Deploy: `firebase deploy`

## Environment Variables Setup

### Backend (.env file)
```
# Required
FLASK_ENV=production
SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>
JWT_SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true
MONGO_DB_NAME=campify_db
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional (for email features)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=app-password
```

### Generate Secret Keys (Python)
```python
import secrets
print(secrets.token_urlsafe(32))
```

### Frontend (in dashboard.js)
```javascript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account
3. Create cluster (M0 free tier)
4. Create database user
5. Whitelist IP addresses
6. Get connection string
7. Update MONGO_URI in .env

## SSL/HTTPS Setup

- Railway/Render: Automatic
- Heroku: Use Auto Cert
- Custom domain: Use Let's Encrypt via Certbot

## Monitoring & Maintenance

- Monitor logs regularly
- Set up error tracking (Sentry)
- Schedule backups for MongoDB
- Update dependencies monthly
- Monitor server health

## Troubleshooting Deployment

**502 Bad Gateway:**
- Check backend logs
- Verify MongoDB connection
- Ensure gunicorn is running

**CORS errors:**
- Update CORS_ORIGINS for deployed domain
- Don't use localhost in production

**WebSocket connection fails:**
- Check firewall rules
- Ensure WebSocket upgrade allowed
- Verify Socket.IO configuration

**Static files not loading:**
- Frontend build complete?
- API_BASE_URL correct?
- Browser cache cleared?

## Cost Summary

| Service | Component | Cost |
|---------|-----------|------|
| Railway | Backend + DB | Free - $5/mo |
| Vercel | Frontend | Free |
| Total | | **Free tier available!** |

Or:

| Service | Component | Cost |
|---------|-----------|------|
| Render | Backend | Free - $7/mo |
| Netlify | Frontend | Free |
| MongoDB Atlas | Database | Free 512MB |
| Total | | **Free tier available!** |

## Next Steps

1. Push code to GitHub
2. Choose deployment platform
3. Set up MongoDB (Atlas or addon)
4. Deploy backend
5. Deploy frontend
6. Update API URLs
7. Test thoroughly
8. Set up monitoring
9. Configure custom domain
10. Enable SSL/HTTPS

Need help? Check platform-specific docs or GitHub issues!
