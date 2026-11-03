#!/usr/bin/env bash

# ==============================================================================
# ClassSync Stop Script
# Kills any active ClassSync backend or stale port processes.
# ==============================================================================

echo "Stopping ClassSync processes..."

# Kill backend process by pattern
pkill -f "classsync-backend" 2>/dev/null || true

# Free ports 8080 and 5173 if still bound
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "✓ ClassSync backend and frontend have been stopped."
