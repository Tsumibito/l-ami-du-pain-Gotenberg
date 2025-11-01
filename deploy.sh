#!/bin/bash

# Production deployment script for PDF API
# Usage: ./deploy.sh

set -e

echo "🚀 Starting PDF API Production Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production settings."
    exit 1
fi

# Check if API_TOKEN is set
if ! grep -q "API_TOKEN=[^your_secure_production_token_here]" .env.production; then
    echo "❌ Error: API_TOKEN is not set in .env.production"
    echo "Please set a real API token before deploying."
    exit 1
fi

echo "📦 Building Docker image..."
docker-compose -f docker-compose.prod.yml build pdf-api

echo "🔄 Stopping existing container..."
docker-compose -f docker-compose.prod.yml down pdf-api || true

echo "🚢 Starting new container..."
docker-compose -f docker-compose.prod.yml up -d pdf-api

echo "⏳ Waiting for service to be healthy..."
sleep 10

# Health check
echo "🏥 Checking health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ PDF API is healthy!"
else
    echo "❌ Health check failed!"
    echo "📋 Logs:"
    docker-compose -f docker-compose.prod.yml logs pdf-api
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📡 API Endpoints:"
echo "  Health: http://localhost:3001/health"
echo "  Avis PDF: POST http://localhost:3001/api/pdf/avis"
echo "  Summary PDF: POST http://localhost:3001/api/pdf/summary"
