#!/bin/bash

echo "🚀 Setting up Auth Service..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "✅ Auth Service setup complete!"
echo ""
echo "To start the service, run:"
echo "  npm run dev"
