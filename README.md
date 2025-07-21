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


### 3. Install and Configure Chromium Browser

**Debian/Ubuntu:**
```shell script
sudo apt install -y chromium-browser
```


**Fedora/RHEL:**
```shell script
sudo dnf install -y chromium
```


**Arch Linux:**
```shell script
sudo pacman -S chromium
```


**openSUSE:**
```shell script
sudo zypper install -y chromium
```


#### Configure Chromium for Web Development

```shell script
# Create Chromium configuration directory
mkdir -p ~/.config/chromium/Default

# Create a desktop shortcut for easy access (optional)
cat > ~/.local/share/applications/chromium-dev.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Name=Chromium (Dev Mode)
Comment=Web Browser with Dev Tools
Exec=chromium --disable-web-security --user-data-dir=/tmp/chromium-dev --allow-running-insecure-content
Icon=chromium
Terminal=false
Type=Application
Categories=Network;WebBrowser;
EOF

# Make it executable
chmod +x ~/.local/share/applications/chromium-dev.desktop
```


#### Test Chromium Installation

```shell script
# Test if Chromium runs properly
chromium --version

# Test opening a URL
chromium https://google.com &
```


#### Alternative Browsers (if Chromium doesn't work)

**Install Google Chrome:**
```shell script
# Debian/Ubuntu
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable

# Fedora/RHEL
sudo dnf install -y google-chrome-stable

# Arch (from AUR)
yay -S google-chrome
```


**Install Firefox (fallback):**
```shell script
# Debian/Ubuntu
sudo apt install -y firefox

# Fedora/RHEL
sudo dnf install -y firefox

# Arch
sudo pacman -S firefox

# openSUSE
sudo zypper install -y firefox
```


### 4. Configure Wine

```shell script
# Set Wine environment
export WINEPREFIX="$HOME/.wine"
export WINEARCH="win64"

# Initialize Wine (opens GUI - select Windows 10)
winecfg
```


### 5. Install Python in Wine

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

## 🌐 Browser Configuration Tips

### For CORS and Local Development

If you have issues with CORS or local file access, launch Chromium with development flags:

```shell script
chromium --disable-web-security --user-data-dir=/tmp/chromium-dev --allow-running-insecure-content http://localhost:3000
```


### Set Default Browser

```shell script
# Check current default browser
xdg-settings get default-web-browser

# Set Chromium as default
xdg-settings set default-web-browser chromium-browser.desktop

# Or for Google Chrome
xdg-settings set default-web-browser google-chrome.desktop
```


### Browser Detection Order

The script will try browsers in this order:
1. **google-chrome** (Google Chrome)
2. **chromium-browser** or **chromium** (Chromium)
3. **firefox** (Firefox)
4. **xdg-open** (System default)

## 🔧 What the Script Does

1. **Auto-installs Ollama** if missing
2. **Creates directories** (models, ollama, public)
3. **Moves UI files** from html/browser to public if needed
4. **Starts services** in order:
   - Ollama service
   - ChatAI backend (Wine app)
   - Node.js proxy server
5. **Opens browser** automatically (tries Chromium first)
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


**Browser not opening:**
```shell script
# Check if Chromium is installed
chromium --version

# Manually open the URL
chromium http://localhost:3000

# Or try other browsers
google-chrome http://localhost:3000
firefox http://localhost:3000
```


**Port conflicts:**
```shell script
sudo netstat -tulpn | grep -E ':(3000|5001|11434)'
```


**Check logs:**
```shell script
tail -f server.log
```


That's it! Install Wine + Node.js + Chromium, configure Wine, install Python in Wine, then run the script. Chromium will automatically open the ChatAI interface.
