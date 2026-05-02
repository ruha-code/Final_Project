#!/bin/bash
set -e

echo "========================================="
echo "MedLinks Clinic — Setup Script"
echo "========================================="

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and set your passwords!"
    echo ""
    read -p "Press Enter after editing .env..."
fi

if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from backend/.env.example..."
    cp backend/.env.example backend/.env
fi

# Start services
echo ""
echo "Starting services..."
docker compose up -d

# Wait for database
echo "Waiting for database to be ready..."
sleep 10

# Run seed
echo ""
echo "Running seed script..."
docker compose exec api python seed.py

echo ""
echo "========================================="
echo "Setup complete!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "pgAdmin:  http://localhost:8080"
echo "========================================="
