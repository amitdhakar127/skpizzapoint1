#!/bin/bash
# SK Pizza Point Admin - Termux Build Script
set -e

echo "🍕 ==================================================="
echo "🍕 SK Pizza Point Admin APK - Termux Build Helper"
echo "🍕 ==================================================="

# Check and install requirements in Termux
if command -v pkg &> /dev/null; then
    echo "📦 Checking Termux environment packages..."
    pkg update -y || true
    pkg install -y openjdk-17 gradle || true
fi

# Set Java Home if in Termux
if [ -d "/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk" ]; then
    export JAVA_HOME="/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

if command -v python3 &> /dev/null; then
    echo "🎨 Generating native brand launcher icons..."
    python3 generate_icons.py || true
fi

chmod +x gradlew
echo "🔨 Building Debug APK with Gradle..."
./gradlew assembleDebug --no-daemon

echo "✅ SUCCESS! Debug APK has been built successfully:"
echo "📂 app/build/outputs/apk/debug/app-debug.apk"
