# ChatAI Linux Setup Guide

## 🔧 Installation Steps

### 1. Install Wine

**Debian/Ubuntu:**
```shell script
sudo apt update
wget -nc https://dl.winehq.org/wine-builds/winehq.key
sudo mv winehq.key /usr/share/keyrings/winehq-archive.key
wget -nc https://dl.winehq.org/wine-builds/ubuntu/dists/$(lsb_release -cs)/winehq-$(lsb_release -cs).sources
sudo mv winehq-$(lsb_release -cs).sources /etc/apt/sources.list.d/
sudo apt update
sudo apt install -y winehq-stable
```


**Fedora/RHEL:**
```shell script
sudo dnf install -y wine
```


**Arch Linux:**
```shell script
sudo pacman -S wine wine-gecko wine-mono
```


**openSUSE:**
```shell script
sudo zypper install -y wine
```


### 2. Install Node.js

**Debian/Ubuntu:**
```shell script
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```


**Fedora/RHEL:**
```shell script
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```


**Arch Linux:**
```shell script
sudo pacman -S nodejs npm
```


**openSUSE:**
```shell script
sudo zypper install -y nodejs18 npm18
```


### 3. Configure Wine

```shell script
# Set Wine environment
export WINEPREFIX="$HOME/.wine"
export WINEARCH="win64"

# Initialize Wine (opens GUI - select Windows 10)
winecfg
```


### 4. Install Python in Wine

```shell script
# Download Python for Windows
cd /tmp
wget https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe

# Install in Wine
wine python-3.10.11-amd64.exe

# Verify installation
wine python --version
```


## 🚀 Using the Script

### 1. Setup Project
```shell script
mkdir -p ~/Desktop/chatai
cd ~/Desktop/chatai

# Place your files:
# - app.exe (your ChatAI executable)
# - start.sh (the startup script)
# - native_proxy.js (the proxy server)
# - public/ folder with your web files

chmod +x start.sh
```


### 2. Run ChatAI
```shell script
./start.sh
```


### 3. Access Application
- Open browser at: **http://localhost:3000**
- Or direct backend: **http://localhost:5001**

### 4. Stop Services
Press `Ctrl+C` in the terminal to stop all services.

## 🔧 What the Script Does

1. **Auto-installs Ollama** if missing
2. **Creates directories** (models, ollama, public)
3. **Moves UI files** from html/browser to public if needed
4. **Starts services** in order:
   - Ollama service
   - ChatAI backend (Wine app)
   - Node.js proxy server
5. **Opens browser** automatically
6. **Handles cleanup** when stopped

## 🐛 Quick Troubleshooting

**Wine issues:**
```shell script
winecfg  # Check configuration
```


**Python missing in Wine:**
```shell script
wine python --version  # Should show Python 3.10.x
```


**Port conflicts:**
```shell script
sudo netstat -tulpn | grep -E ':(3000|5001|11434)'
```


**Check logs:**
```shell script
tail -f server.log
```


That's it! Just install Wine + Node.js, configure Wine, install Python in Wine, then run the script.
