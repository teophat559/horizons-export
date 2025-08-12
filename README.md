# Horizons Export

A modern web application for data export and management, supporting both admin and user interfaces.

## Quick Start

### VPS Deployment (Recommended)

Deploy to your own VPS server:

```bash
# 1. Setup VPS with all dependencies
npm run setup:vps -- --host=your-server-ip --domain=your-domain.com

# 2. Configure environment on VPS
ssh root@your-server-ip
cd /opt/horizons-backend && cp .env.template .env && nano .env

# 3. Deploy application
npm run deploy:vps:full -- --host=your-server-ip

# 4. Verify deployment
npm run verify:vps -- --host=your-server-ip
```

See [VPS_QUICK_START.md](VPS_QUICK_START.md) for Vietnamese instructions and [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md) for detailed guide.

### Other Deployment Options

- **Netlify**: Use existing netlify deployment scripts
- **Render**: Use render.yaml configuration
- **Local Development**: See development setup below

## Available Scripts

### VPS Deployment
- `npm run setup:vps` - Set up VPS with all dependencies
- `npm run deploy:vps:full` - Deploy both admin and user interfaces
- `npm run deploy:vps:admin` - Deploy admin interface only
- `npm run deploy:vps:user` - Deploy user interface only  
- `npm run verify:vps` - Verify VPS deployment

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run backend:dev` - Start backend development server
- `npm run dev:all` - Start both frontend and backend

### Other Commands
- `npm run build:admin` - Build admin interface
- `npm run build:user` - Build user interface
- `npm run deploy:netlify:admin` - Deploy admin to Netlify
- `npm run deploy:netlify:user` - Deploy user to Netlify

## Project Structure

```
horizons-export/
├── src/                 # Frontend source code
├── backend/            # Backend API server
├── admin/              # Admin interface build output
├── user/               # User interface build output
├── scripts/            # Deployment and utility scripts
├── nginx/              # Nginx configuration for VPS
└── docs/               # Documentation
```

## Environment Variables

For VPS deployment, copy `.env.vps.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `ADMIN_KEY` - Admin authentication key
- `ALLOWED_ORIGINS` - Allowed CORS origins

## Technology Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: PostgreSQL
- **Deployment**: VPS (Nginx + PM2), Netlify, Render

## Documentation

- [VPS Deployment Guide](docs/VPS_DEPLOYMENT.md) - Complete VPS setup guide
- [VPS Quick Start](VPS_QUICK_START.md) - Quick Vietnamese guide
- [Environment Configuration](ENVIRONMENT.md) - Environment setup

## Support

For deployment to VPS ("upload code to VPS"), this project now includes comprehensive VPS deployment scripts and documentation. You can easily deploy the complete application to any Ubuntu-based VPS with the provided automation scripts.
