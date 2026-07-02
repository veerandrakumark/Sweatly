# Setup script for Sweatly Monorepo (Windows PowerShell)
Write-Host "🚀 Initializing Sweatly Monorepo Development Environment..." -ForegroundColor Cyan

# Function to copy env templates
function Copy-EnvFile($dir) {
    $examplePath = Join-Path $dir ".env.example"
    $envPath = Join-Path $dir ".env"
    
    if (Test-Path $examplePath) {
        if (-not (Test-Path $envPath)) {
            Copy-Item $examplePath -Destination $envPath
            Write-Host "✅ Created $envPath" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ $envPath already exists, skipping." -ForegroundColor Yellow
        }
    }
}

# Copy client and server environment files
Copy-EnvFile "client"
Copy-EnvFile "server"

# Install global root dependencies
Write-Host "📦 Installing Monorepo dependencies..." -ForegroundColor Cyan
npm install

Write-Host "🎉 Setup complete! Run 'npm run dev' to start local development." -ForegroundColor Green
