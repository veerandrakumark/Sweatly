#!/bin/bash

# Setup script for Sweatly Monorepo
echo "🚀 Initializing Sweatly Monorepo Development Environment..."

# Function to copy env templates
copy_env() {
    local dir=$1
    if [ -f "$dir/.env.example" ]; then
        if [ ! -f "$dir/.env" ]; then
            cp "$dir/.env.example" "$dir/.env"
            echo "✅ Created $dir/.env"
        else
            echo "ℹ️ $dir/.env already exists, skipping."
        fi
    fi
}

# Copy client and server environment files
copy_env "client"
copy_env "server"

# Install global root dependencies
echo "📦 Installing Monorepo dependencies..."
npm install

echo "🎉 Setup complete! Run 'npm run dev' to start local development."
