# VPS Deployment Guide for Horizons Export

This guide will help you deploy the Horizons Export application to your own Virtual Private Server (VPS).

## Prerequisites

### Local Machine Requirements
- Node.js 18+ installed
- SSH client
- Git

### VPS Requirements
- Ubuntu 20.04+ (or similar Debian-based distribution)
- At least 1GB RAM (2GB recommended)
- 10GB+ storage space
- Root or sudo access
- SSH access

### Optional
- Domain name pointed to your VPS IP
- SSL certificate (can be set up automatically with Let's Encrypt)

## Quick Start

### 1. Prepare Your VPS

First, set up your VPS with all required dependencies:

```bash
# Set your VPS details as environment variables (optional)
export VPS_HOST="your-server-ip"
export VPS_USER="root"
export VPS_DOMAIN="your-domain.com"  # Optional

# Run the VPS setup script
npm run setup:vps -- --host=your-server-ip --domain=your-domain.com
```

This script will:
- Install Node.js 20, npm, PM2
- Install and configure PostgreSQL
- Install and configure Nginx
- Set up firewall rules
- Set up SSL certificates (if domain is provided)
- Create necessary directories

### 2. Configure Environment Variables

After setup, SSH into your VPS and configure the environment:

```bash
ssh root@your-server-ip
cd /opt/horizons-backend
cp .env.template .env
nano .env  # Edit the configuration file
```

Update these important values in `.env`:
```bash
# Change these security keys!
JWT_SECRET=your-very-secure-jwt-secret-here
ADMIN_KEY=your-very-secure-admin-key-here

# Update database password
DATABASE_URL=postgresql://horizons_user:your-new-password@localhost:5432/horizons_export

# Update domain
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 3. Deploy the Application

Deploy both admin and user interfaces:

```bash
# Deploy everything
npm run deploy:vps:full -- --host=your-server-ip

# Or deploy individually
npm run deploy:vps:admin -- --host=your-server-ip
npm run deploy:vps:user -- --host=your-server-ip
```

## Detailed Deployment Options

### Environment Variables

You can set these environment variables to avoid typing them each time:

```bash
export VPS_HOST="192.168.1.100"
export VPS_USER="root"
export VPS_PORT="22"
export VPS_DOMAIN="example.com"
export VPS_DEPLOY_PATH="/var/www/horizons-export"
export VPS_BACKEND_PATH="/opt/horizons-backend"
```

### Setup Script Options

```bash
# Basic setup
npm run setup:vps -- --host=192.168.1.100

# Setup with domain and SSL
npm run setup:vps -- --host=192.168.1.100 --domain=example.com

# Skip firewall setup
npm run setup:vps -- --host=192.168.1.100 --skip-firewall

# Skip SSL setup
npm run setup:vps -- --host=192.168.1.100 --skip-ssl

# Dry run (show commands without executing)
npm run setup:vps -- --host=192.168.1.100 --dry-run
```

### Deployment Script Options

```bash
# Deploy admin interface only
npm run deploy:vps -- --target=admin --host=192.168.1.100

# Deploy user interface only
npm run deploy:vps -- --target=user --host=192.168.1.100

# Skip backend deployment
npm run deploy:vps -- --target=admin --host=192.168.1.100 --skip-backend

# Skip frontend deployment
npm run deploy:vps -- --target=admin --host=192.168.1.100 --skip-frontend

# Skip nginx reload
npm run deploy:vps -- --target=admin --host=192.168.1.100 --skip-nginx

# Skip PM2 restart
npm run deploy:vps -- --target=admin --host=192.168.1.100 --skip-pm2

# Dry run
npm run deploy:vps -- --target=admin --host=192.168.1.100 --dry-run
```

## Manual Setup (Alternative)

If you prefer to set up your VPS manually:

### 1. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install other dependencies
apt install -y nginx postgresql postgresql-contrib git pm2

# Install PM2 globally
npm install -g pm2
```

### 2. Configure PostgreSQL

```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE horizons_export;
CREATE USER horizons_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE horizons_export TO horizons_user;
ALTER USER horizons_user CREATEDB;
EOF
```

### 3. Set Up Directories

```bash
# Create application directories
mkdir -p /var/www/horizons-export/public
mkdir -p /var/www/horizons-export/admin
mkdir -p /opt/horizons-backend
mkdir -p /var/log/horizons-export

# Set permissions
chown -R www-data:www-data /var/www/horizons-export
chown -R $USER:$USER /opt/horizons-backend
```

### 4. Configure Nginx

Copy the nginx configuration from `nginx/missudsinhvien2025.conf` and adapt it for your domain:

```bash
# Copy and edit nginx config
cp /path/to/your/project/nginx/*.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/your-config.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Application Structure on VPS

After deployment, your VPS will have this structure:

```
/var/www/horizons-export/
├── admin/           # Admin interface files
│   ├── index.html
│   ├── assets/
│   └── ...
└── public/          # User interface files
    ├── index.html
    ├── assets/
    └── ...

/opt/horizons-backend/
├── src/             # Backend source code
├── package.json
├── ecosystem.config.cjs  # PM2 configuration
├── .env             # Environment variables
└── node_modules/
```

## Monitoring and Management

### Check Application Status

```bash
# Check PM2 processes
pm2 list
pm2 logs horizons-backend

# Check nginx status
systemctl status nginx
nginx -t

# Check database status
systemctl status postgresql
sudo -u postgres psql -c "SELECT version();" horizons_export
```

### View Logs

```bash
# Backend logs
pm2 logs horizons-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

### Restart Services

```bash
# Restart backend
pm2 restart horizons-backend

# Restart nginx
systemctl restart nginx

# Restart database
systemctl restart postgresql
```

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Check VPS IP address
   - Verify SSH key or password
   - Ensure SSH service is running on VPS

2. **Build Failed**
   - Ensure all dependencies are installed locally
   - Check Node.js version compatibility
   - Run `npm ci` to clean install dependencies

3. **Database Connection Failed**
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Check database credentials in `.env`
   - Test connection: `sudo -u postgres psql horizons_export`

4. **Nginx Configuration Error**
   - Test configuration: `nginx -t`
   - Check file permissions
   - Verify domain configuration

5. **PM2 Process Not Starting**
   - Check backend logs: `pm2 logs horizons-backend`
   - Verify Node.js version on VPS
   - Check environment variables in `.env`

### Getting Help

1. Check logs on your VPS:
   ```bash
   pm2 logs horizons-backend
   tail -f /var/log/nginx/error.log
   ```

2. Test components individually:
   ```bash
   # Test backend directly
   cd /opt/horizons-backend && npm start
   
   # Test database connection
   sudo -u postgres psql horizons_export
   
   # Test nginx configuration
   nginx -t
   ```

3. Verify network connectivity:
   ```bash
   # Test API endpoint
   curl http://localhost:4000/api/health
   
   # Test frontend
   curl http://localhost/
   ```

## Security Considerations

1. **Change Default Passwords**: Update database and application passwords
2. **Firewall**: Ensure only necessary ports are open (22, 80, 443)
3. **SSL**: Use HTTPS in production with Let's Encrypt or your own certificates
4. **Regular Updates**: Keep your VPS and application dependencies updated
5. **Backup**: Set up regular database and file backups

## Performance Optimization

1. **Database**: Configure PostgreSQL for your workload
2. **Nginx**: Enable gzip compression and caching
3. **PM2**: Configure cluster mode for multiple CPU cores
4. **Monitoring**: Set up monitoring with PM2 Plus or other tools

## Updating Your Application

To update your deployed application:

```bash
# Pull latest changes locally
git pull origin main

# Deploy updates
npm run deploy:vps:full -- --host=your-server-ip
```

The deployment script will automatically:
- Build the latest version
- Upload new files
- Restart services
- Run database migrations if needed