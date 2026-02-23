#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file"
    export $(grep -v '^#' .env | xargs)
fi

# Backend setup and run
if [ "$1" == "backend" ]; then
    echo "Setting up Smart Irrigation System backend..."
    pip install -r requirements.txt
    
    echo "Starting backend server..."
    python app.py
    exit 0
fi

# Frontend setup and run
if [ "$1" == "frontend" ]; then
    echo "Setting up Smart Irrigation Dashboard frontend..."
    cd frontend
    
    echo "Installing dependencies..."
    npm install
    
    echo "Starting frontend development server..."
    npm start
    exit 0
fi

# Install dependencies only
if [ "$1" == "install" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
    
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    echo "All dependencies installed successfully!"
    exit 0
fi

# Usage instructions
if [ "$1" == "" ]; then
    echo "Smart Irrigation System - Usage Instructions"
    echo "-------------------------------------------"
    echo "Backend:  ./run.sh backend   # Start the Python FastAPI backend"
    echo "Frontend: ./run.sh frontend  # Start the React frontend dashboard"
    echo "Install:  ./run.sh install   # Install all dependencies"
    echo ""
    echo "For best results, run backend and frontend in separate terminal windows."
    exit 1
fi 