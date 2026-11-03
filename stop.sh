#!/usr/bin/env bash

# ==============================================================================
# ClassSync Stop Script
# Kills any active ClassSync backend, frontend, or stale port processes.
# ==============================================================================

echo "Stopping ClassSync processes..."

# Kill processes by pattern
pkill -f "classsync-backend" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Free ports 8080 and 5173 if still bound
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "✓ ClassSync backend and frontend have been stopped."

