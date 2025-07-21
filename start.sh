#!/bin/bash

# Simple ChatAI startup script
cd "$(dirname "$0")"

echo "🚀 Starting ChatAI..."

# Install dependencies if needed
install_deps() {
    if ! command -v ollama &> /dev/null; then
        echo "Installing Ollama..."
        curl -fsSL https://ollama.ai/install.sh | sh
    fi
    
    if ! command -v node &> /dev/null; then
        echo "Please install Node.js first"
        exit 1
    fi
}

# Setup directories
setup_dirs() {
    mkdir -p models ollama public
    
    # Move UI files if needed
    if [ -d "html/browser" ] && [ ! -d "public/index.html" ]; then
        cp -r html/browser/* public/
    fi
    
    if [ ! -f "public/index.html" ]; then
        echo "❌ No UI files found in public/"
        exit 1
    fi
}

# Start services
start_services() {
    # Clean up old processes
    pkill -f "app.exe|proxy|ollama serve" 2>/dev/null || true
    sleep 2
    
    # Start Ollama
    if ! pgrep -f "ollama serve" > /dev/null; then
        ollama serve &
        sleep 3
    fi
    
    # Start backend
    echo "Starting backend..."
    wine app.exe > server.log 2>&1 &
    APP_PID=$!
    
    # Wait for backend
    for i in {1..10}; do
        if curl -s http://localhost:5001/health > /dev/null 2>&1; then
            echo "✅ Backend ready"
            break
        fi
        echo "Waiting for backend... ($i/10)"
        sleep 2
    done
    
    # Start proxy
    echo "Starting proxy..."
    node native_proxy.js &
    PROXY_PID=$!
    sleep 2
    
    # Test proxy
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        URL="http://localhost:3000"
        echo "✅ Proxy ready"
    else
        URL="http://localhost:5001"
        echo "⚠️ Using direct backend"
    fi
}

# Open browser
open_browser() {
    echo "Opening browser..."
    for browser in google-chrome chromium firefox xdg-open; do
        if command -v $browser &> /dev/null; then
            $browser "$URL" &> /dev/null &
            break
        fi
    done
}

# Cleanup function
cleanup() {
    echo "Stopping services..."
    kill $APP_PID $PROXY_PID 2>/dev/null || true
    pkill -f "app.exe|native_proxy.js" 2>/dev/null || true
    exit 0
}

# Main execution
main() {
    install_deps
    setup_dirs
    start_services
    open_browser
    
    echo "✅ ChatAI running at: $URL"
    echo "Press Ctrl+C to stop"
    
    trap cleanup INT TERM
    wait
}

main