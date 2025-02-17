#!/bin/bash
echo "Installing dependencies..."
apt-get update && apt-get install -y wget unzip

echo "Installing Chrome..."
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt-get install -y ./google-chrome-stable_current_amd64.deb

echo "Chrome installed successfully!"
