# Deployment Guide

Guide for deploying the College Attendance System to production.

## Production Checklist

Before deploying to production, ensure:

- [ ] All default passwords changed
- [ ] Environment variables configured
- [ ] MongoDB authentication enabled
- [ ] HTTPS/SSL configured
- [ ] Firewall rules set up
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error logging enabled
- [ ] Rate limiting implemented
- [ ] CORS properly configured

## Server Deployment

### Option 1: VPS/Dedicated Server (Recommended)

#### Requirements
- Ubuntu 20.04 LTS or higher
- 2GB RAM minimum (4GB recommended)
- 20GB storage
- Static IP address
- Domain name (optional but recommended)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 2: Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/attendance-system
sudo chown $USER:$USER /var/www/attendance-system

# Clone repository
cd /var/www/attendance-system
git clone <repository-url> .

# Install dependencies
npm install
cd server && npm install
cd ../admin-panel && npm install

# Download face recognition models
cd ../server
node download-models.js

# Initialize database
node init-db.js

# Seed data (optional)
node seed-data.js
```

#### Step 3: Configure Environment

```bash
cd /var/www/attendance-system/server
nano .env
```

Add:
```env
PORT=3000
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/attendance_app
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-super-secret-session-key-change-this
ALLOWED_ORIGINS=https://yourdomain.com
```

#### Step 4: Configure MongoDB Authentication

```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "strong-password-here",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Switch to app database
use attendance_app

# Create app user
db.createUser({
  user: "attendance_user",
  pwd: "another-strong-password",
  roles: ["readWrite"]
})

exit
```

Update MongoDB URI in `.env`:
```env
MONGO_URI=mongodb://attendance_user:another-strong-password@localhost:27017/attendance_app
```

Enable authentication in MongoDB:
```bash
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

#### Step 5: Configure PM2

```bash
cd /var/www/attendance-system/server

# Start application with PM2
pm2 start index.js --name attendance-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

#### Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/attendance-system
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase upload size for photos
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads/ {
        alias /var/www/attendance-system/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/attendance-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Configure SSL (HTTPS)

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Step 8: Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

### Option 2: Cloud Platforms

#### Heroku

1. Create `Procfile`:
```
web: cd server && node index.js
```

2. Deploy:
```bash
heroku create attendance-system
heroku addons:create mongolab
git push heroku main
```

#### AWS EC2

Similar to VPS deployment, but:
1. Launch EC2 instance (t2.medium recommended)
2. Configure security groups (ports 22, 80, 443)
3. Use Elastic IP for static IP
4. Follow VPS deployment steps

#### DigitalOcean

1. Create Droplet (Ubuntu 20.04, 2GB RAM)
2. Follow VPS deployment steps
3. Use DigitalOcean's managed MongoDB if preferred

#### Google Cloud Platform

1. Create Compute Engine instance
2. Follow VPS deployment steps
3. Use Cloud SQL for MongoDB alternative

## Mobile App Deployment

### Android

#### Step 1: Prepare for Release

Update `app.json`:
```json
{
  "expo": {
    "name": "College Attendance",
    "slug": "college-attendance",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.attendance",
      "versionCode": 1,
      "permissions": ["CAMERA", "INTERNET"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a1628"
      }
    }
  }
}
```

#### Step 2: Update API URLs

Update all files with production URLs:
- `App.js`
- `FaceVerificationScreen.js`
- `ProfileScreen.js`
- `CalendarScreen.js`

```javascript
const API_URL = 'https://yourdomain.com/api/config';
const SOCKET_URL = 'https://yourdomain.com';
```

#### Step 3: Generate Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore attendance-release.keystore -alias attendance-key -keyalg RSA -keysize 2048 -validity 10000
```

#### Step 4: Configure Gradle

Edit `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=attendance-release.keystore
MYAPP_RELEASE_KEY_ALIAS=attendance-key
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Step 5: Build APK

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

#### Step 6: Publish to Play Store

1. Create Google Play Developer account ($25 one-time fee)
2. Create new application
3. Upload APK
4. Fill in store listing details
5. Set content rating
6. Set pricing & distribution
7. Submit for review

### iOS (Optional)

Requires macOS and Apple Developer account ($99/year).

```bash
expo build:ios
```

Follow Expo's iOS deployment guide.

## Admin Panel Deployment

### Option 1: Desktop Application

Build standalone executable:

```bash
cd admin-panel
npm install electron-builder --save-dev
```

Add to `package.json`:
```json
{
  "scripts": {
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.yourcompany.attendance-admin",
    "productName": "Attendance Admin",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    }
  }
}
```

Build:
```bash
npm run build
```

Distribute the executable from `admin-panel/dist/`.

### Option 2: Web Application

Convert to web app and host on server:

1. Remove Electron dependencies
2. Convert to static HTML/JS/CSS
3. Host on Nginx or Apache
4. Add authentication layer

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# View logs
pm2 logs attendance-server

# Monitor resources
pm2 monit

# Restart application
pm2 restart attendance-server

# View status
pm2 status
```

### MongoDB Backup

Create backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://attendance_user:password@localhost:27017/attendance_app" --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Schedule with cron:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### Log Rotation

```bash
sudo nano /etc/logrotate.d/attendance-system
```

Add:
```
/var/www/attendance-system/server/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Monitoring Tools

Install monitoring:
```bash
# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Or use PM2 Plus
pm2 link <secret> <public>
```

## Security Hardening

### 1. Enable Fail2Ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Setup Automatic Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. Implement Rate Limiting

Add to server code:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. Add Helmet.js

```bash
cd server
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

## Performance Optimization

### 1. Enable Gzip Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Add Redis Caching

```bash
sudo apt install redis-server
npm install redis
```

### 3. Optimize MongoDB

```javascript
// Add indexes (already in init-db.js)
// Use projection to limit fields
// Implement pagination
```

### 4. CDN for Static Assets

Use Cloudflare or AWS CloudFront for:
- Profile photos
- Static assets
- Admin panel files

## Troubleshooting Production Issues

### Check Server Status
```bash
pm2 status
pm2 logs attendance-server --lines 100
```

### Check MongoDB
```bash
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"
```

### Check Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Check Disk Space
```bash
df -h
du -sh /var/www/attendance-system/*
```

### Check Memory
```bash
free -h
pm2 monit
```

## Rollback Procedure

```bash
# Stop application
pm2 stop attendance-server

# Restore previous version
cd /var/www/attendance-system
git checkout <previous-commit>
npm install
cd server && npm install

# Restore database backup
mongorestore --uri="mongodb://..." --drop /path/to/backup

# Restart application
pm2 restart attendance-server
```

## Support & Maintenance

### Regular Tasks

**Daily:**
- Check PM2 logs for errors
- Monitor server resources

**Weekly:**
- Review attendance data
- Check backup integrity
- Update dependencies

**Monthly:**
- Security updates
- Performance review
- Database optimization

### Emergency Contacts

Document:
- Server provider support
- Database administrator
- Development team contacts
- Backup locations

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx/HAProxy)
2. Deploy multiple server instances
3. Use Redis for session storage
4. Implement sticky sessions for WebSocket

### Vertical Scaling

1. Upgrade server resources
2. Optimize database queries
3. Implement caching
4. Use CDN for static assets

## Conclusion

After deployment:
1. Test all features thoroughly
2. Monitor for 24-48 hours
3. Document any issues
4. Train administrators
5. Provide user documentation

For support, contact: [your-email@example.com]
