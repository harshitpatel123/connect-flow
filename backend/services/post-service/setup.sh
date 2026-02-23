#!/bin/bash

echo "🚀 Setting up Post Service..."

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "✅ Post Service setup complete!"
echo ""
echo "To start the service, run:"
echo "  npm run dev"
