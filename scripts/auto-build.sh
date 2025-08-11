#!/bin/bash

# Auto Build Script for Unix/Linux/macOS
set -e

echo "🚀 Auto Build Script Started"
echo

# Parse command line arguments
BUILD_ADMIN=false
BUILD_USER=false
WATCH_MODE=false
CLEAN_MODE=false
DEPLOY_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --admin)
            BUILD_ADMIN=true
            shift
            ;;
        --user)
            BUILD_USER=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --clean)
            CLEAN_MODE=true
            shift
            ;;
        --deploy)
            DEPLOY_MODE=true
            shift
            ;;
        --help|-h)
            echo "Auto Build Script for Unix/Linux/macOS"
            echo
            echo "Usage: ./scripts/auto-build.sh [options]"
            echo
            echo "Options:"
            echo "  --admin          Build admin version"
            echo "  --user           Build user version"
            echo "  --watch          Watch for file changes and rebuild"
            echo "  --clean          Clean before building"
            echo "  --deploy         Deploy to Netlify after build"
            echo "  --help, -h       Show this help message"
            echo
            echo "Examples:"
            echo "  ./scripts/auto-build.sh                    # Build once"
            echo "  ./scripts/auto-build.sh --admin --watch    # Build admin with watch"
            echo "  ./scripts/auto-build.sh --user --deploy    # Build user and deploy"
            echo "  ./scripts/auto-build.sh --admin --watch --deploy  # Full admin build with watch and deploy"
            echo
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show current options
echo "Options:"
echo "  Admin Build: $BUILD_ADMIN"
echo "  User Build: $BUILD_USER"
echo "  Watch Mode: $WATCH_MODE"
echo "  Clean Mode: $CLEAN_MODE"
echo "  Deploy Mode: $DEPLOY_MODE"
echo

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%H:%M:%S')
    echo -e "${color}[$timestamp] $message${NC}"
}

# Run preflight checks
log "Running preflight checks..." "$YELLOW"
npm run preflight
log "Preflight checks completed" "$GREEN"

# Clean admin if needed
if [ "$BUILD_ADMIN" = true ] && [ "$CLEAN_MODE" = true ]; then
    log "Cleaning admin build..." "$YELLOW"
    npm run clean:admin
    log "Admin cleanup completed" "$GREEN"
fi

# Build project
log "Building project..." "$YELLOW"
if [ "$BUILD_ADMIN" = true ]; then
    npm run build:admin:nix
elif [ "$BUILD_USER" = true ]; then
    npm run build:user:nix
else
    npm run build
fi
log "Build completed successfully" "$GREEN"

# Post-build tasks for admin
if [ "$BUILD_ADMIN" = true ]; then
    log "Purging legacy assets..." "$YELLOW"
    if npm run purge:legacy; then
        log "Legacy assets purged" "$GREEN"
    else
        log "Legacy assets purge failed, continuing..." "$YELLOW"
    fi

    log "Verifying admin assets..." "$YELLOW"
    if node scripts/verify-admin-assets.mjs; then
        log "Admin assets verified" "$GREEN"
    else
        log "Admin assets verification failed, continuing..." "$YELLOW"
    fi
fi

# Deploy if requested
if [ "$DEPLOY_MODE" = true ]; then
    log "Deploying to Netlify..." "$YELLOW"
    if [ "$BUILD_ADMIN" = true ]; then
        node scripts/deploy-admin-netlify.mjs
    else
        node scripts/deploy-user-netlify.mjs
    fi
    log "Deployment completed" "$GREEN"
fi

# Watch mode
if [ "$WATCH_MODE" = true ]; then
    log "Starting watch mode..." "$CYAN"
    echo "Press Ctrl+C to stop watching"
    echo

    if [ "$BUILD_ADMIN" = true ]; then
        npm run build:admin:watch:nix
    elif [ "$BUILD_USER" = true ]; then
        npm run build:user:watch
    else
        npm run build:watch
    fi
else
    log "Auto build completed successfully!" "$GREEN"
fi
