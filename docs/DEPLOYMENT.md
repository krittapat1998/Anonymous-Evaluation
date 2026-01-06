# Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js v16+ installed
- PostgreSQL v12+ running
- Nginx or reverse proxy
- SSL certificate

### 1. Database Setup

```bash
# Create database
createdb anonymous_voting_db

# Create user (with password)
createuser -P voting_user

# Grant privileges
psql -d anonymous_voting_db
# In psql:
GRANT ALL PRIVILEGES ON DATABASE anonymous_voting_db TO voting_user;
GRANT ALL ON SCHEMA public TO voting_user;
```

### 2. Backend Deployment

```bash
# Clone repository
cd AnonymousPersonal/backend

# Install dependencies
npm ci --only=production

# Create .env from .env.example
cp .env.example .env

# Edit .env with production values:
# - Set DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
# - Set NODE_ENV=production
# - Set CORS_ORIGIN to your domain

# Run database migrations/initialization
npm run seed

# Test the server
npm start

# Use PM2 for production process management
npm install -g pm2
pm2 start server.js --name "voting-backend"
pm2 save
pm2 startup
```

### 3. Frontend Deployment

```bash
# Build for production
cd AnonymousPersonal/frontend

# Install dependencies
npm ci

# Create .env for production
cp .env.example .env

# Build
npm run build

# Output is in dist/ directory
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/voting-system`:

```nginx
upstream backend {
    server localhost:5001;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        root /var/www/voting-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/voting-system /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 5. Environment Security

**Production .env checklist:**

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate secure admin password
openssl rand -base64 16

# Use strong database password
# Store in secrets manager (not in .env in production)
```

**Never commit .env to git!**

### 6. Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/voting-db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U voting_user anonymous_voting_db | \
  gzip > $BACKUP_DIR/voting-db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

### 7. Monitoring & Logging

**Backend logging:**

```bash
# Create log directory
mkdir -p /var/log/voting-system

# Configure log rotation
cat > /etc/logrotate.d/voting-system <<EOF
/var/log/voting-system/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload voting-backend > /dev/null 2>&1 || true
    endscript
}
EOF
```

### 8. Security Checklist

- [ ] HTTPS configured
- [ ] PostgreSQL firewall rules (only from backend)
- [ ] Backend firewall rules (only from Nginx)
- [ ] Strong passwords set
- [ ] JWT_SECRET is unique
- [ ] CORS_ORIGIN is correct domain
- [ ] NODE_ENV=production
- [ ] Database backups automated
- [ ] SSL certificate auto-renewal (Let's Encrypt)
- [ ] Monitoring alerts configured
- [ ] Log aggregation setup
- [ ] Regular security updates

### 9. Scaling for Large Deployments

**Multiple backend instances:**

```bash
# Use PM2 cluster mode
pm2 start server.js -i max --name "voting-backend"
```

**Database optimization:**

```sql
-- Create indexes for common queries
CREATE INDEX idx_votes_survey_candidate ON votes(survey_id, candidate_id);
CREATE INDEX idx_votes_used_survey_token ON votes_used(survey_id, token_hash);
```

**Caching (optional):**

```bash
# Add Redis for caching results
npm install redis
# Cache candidate results for 1 hour
# Invalidate on new vote
```

### 10. Disaster Recovery

**Database restoration:**

```bash
# Restore from backup
gunzip -c /var/backups/voting-db/voting-db_20240101_000000.sql.gz | \
  psql -U voting_user anonymous_voting_db
```

**Application recovery:**

```bash
# PM2 restart
pm2 restart voting-backend

# Or reload with zero-downtime
pm2 reload voting-backend
```

---

## 🛠️ Maintenance Tasks

### Weekly
- [ ] Check application logs
- [ ] Verify backups completed
- [ ] Monitor server resources

### Monthly
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Test disaster recovery procedures

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Update SSL certificates (if needed)

---

**Version:** 1.0.0  
**Last Updated:** December 2024
