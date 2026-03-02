#!/usr/bin/env bash
# exit on error
#!/usr/bin/env bash
set -o errexit

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📁 Collecting static files..."
python manage.py collectstatic --no-input

echo "🗄️ Running database migrations..."
python manage.py migrate 

echo "✅ Build completed successfully!"