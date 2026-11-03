#!/usr/bin/env bash

# ==============================================================================
# ClassSync One-Click Startup Script
#
# Usage:
#   ./run.sh          # Runs against standard database ('classsync')
#   ./run.sh --demo   # Runs against demo database ('classsync_demo')
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=================================================="
echo "          ClassSync Startup Script                "
echo "=================================================="

# Check for --demo flag
if [ "$1" == "--demo" ]; then
    echo "Mode: Running with DEMO database (classsync_demo)"
    export DB_URL="jdbc:mysql://localhost:3306/classsync_demo?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
else
    echo "Mode: Running with DEFAULT database (classsync)"
fi

# 1. Check if MySQL is running
echo ""
echo "[1/4] Checking MySQL..."
if ! mysqladmin ping -u root --silent 2>/dev/null; then
    echo "MySQL is not running. Attempting to start via Homebrew..."
    brew services start mysql || {
        echo "Error: Could not start MySQL. Please start MySQL manually and rerun."
        exit 1
    }
    sleep 2
fi
echo "✓ MySQL is running."

# 2. Check / Build Backend JAR
echo ""
JAR_PATH="$PROJECT_ROOT/target/classsync-backend-0.0.1-SNAPSHOT.jar"
if [ ! -f "$JAR_PATH" ]; then
    echo "[2/4] Backend JAR not found. Building with Maven (skipping tests)..."
    mvn package -DskipTests
else
    echo "[2/4] Backend JAR found ($JAR_PATH)."
fi

# 3. Check Frontend Dependencies
echo ""
echo "[3/4] Checking frontend dependencies..."
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd "$PROJECT_ROOT/frontend" && npm install)
fi
echo "✓ Frontend ready."

# Graceful cleanup handler when user presses Ctrl+C
cleanup() {
    echo ""
    echo "=================================================="
    echo "Shutting down ClassSync..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    pkill -P $$ 2>/dev/null || true
    echo "All ClassSync services stopped cleanly."
    echo "=================================================="
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Clean up any previous stale process on ports 8080 and 5173
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 5. Start Backend
echo ""
echo "[4/4] Starting Backend on http://localhost:8080..."
java -jar "$JAR_PATH" > /tmp/classsync-backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend to be healthy..."
RETRIES=35
while [ $RETRIES -gt 0 ]; do
    if curl -s http://localhost:8080/api/health | grep -q "UP"; then
        break
    fi
    sleep 1
    RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -le 0 ]; then
    echo "Error: Backend failed to start. Last 30 lines of /tmp/classsync-backend.log:"
    tail -n 30 /tmp/classsync-backend.log
    exit 1
fi
echo "✓ Backend is UP and running at http://localhost:8080"

# 6. Start Frontend
echo "Starting Frontend dev server on http://localhost:5173..."
cd "$PROJECT_ROOT/frontend"
npx vite --port 5173 > /tmp/classsync-frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2
echo "✓ Frontend is running at http://localhost:5173"

# 7. Open Browser
if command -v open >/dev/null 2>&1; then
    open "http://localhost:5173"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173"
fi

echo ""
echo "=================================================="
echo "🚀 ClassSync is running successfully!"
echo "   - App URL: http://localhost:5173"
echo "   - API URL: http://localhost:8080/api"
echo "   - Logs:    /tmp/classsync-backend.log"
echo "              /tmp/classsync-frontend.log"
echo ""
echo "Press [Ctrl + C] in this terminal to stop everything."
echo "=================================================="

# Wait for Ctrl+C
wait

