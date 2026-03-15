# Quick Start Guide

Get your IP Camera Viewer up and running in 5 minutes!

## 🚀 Quick Setup

### Step 1: Install Dependencies (2 minutes)

```bash
# Install Node.js packages
npm install

# Verify FFmpeg is installed
ffmpeg -version
```

If FFmpeg is not installed:
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

### Step 2: Start the Server (30 seconds)

```bash
npm start
```

### Step 3: Open the Application (30 seconds)

Open your browser and go to:
```
http://localhost:3000
```

### Step 4: Configure Your Camera (2 minutes)

1. Click **"Start Viewing"**
2. Enter your camera details:
   - **IP Address**: `192.168.1.100` (your camera's IP)
   - **HTTP Port**: `80` (usually 80 or 8080)
   - **RTSP URL**: `rtsp://192.168.1.100:554/stream1`
   - **Username**: Your camera username
   - **Password**: Your camera password
3. Click **"Connect to Camera"**

### Step 5: Start Viewing! (Immediate)

You're now viewing your camera in fullscreen mode with full controls!

## 🎮 Quick Controls

| Button | Function | Keyboard |
|--------|----------|----------|
| ▶️ Play/Pause | Start/stop stream | `Space` |
| 🔍 Zoom In | Zoom into view | `+` or `=` |
| 🔍 Zoom Out | Zoom out of view | `-` |
| ⏹️ Stop | Stop zoom movement | `0` |
| ⏺️ Record | Start/stop recording | `R` |
| 📸 Snapshot | Take photo | `S` |
| ⛶ Fullscreen | Toggle fullscreen | `F` or `F11` |

## 📋 Common Camera RTSP URLs

### Find Your Camera's RTSP URL:

**Hikvision:**
```
rtsp://[ip]:554/Streaming/Channels/101
```

**Dahua:**
```
rtsp://[ip]:554/cam/realmonitor?channel=1&subtype=0
```

**Axis:**
```
rtsp://[ip]:554/axis-media/media.amp
```

**TP-Link:**
```
rtsp://[ip]:554/stream1
```

**Generic:**
```
rtsp://[ip]:554/live
rtsp://[ip]:554/h264
rtsp://[ip]:554/stream1
```

## ⚠️ Troubleshooting

### Problem: Can't connect to camera

**Solution:**
1. Ping your camera: `ping [camera-ip]`
2. Check ONVIF is enabled in camera settings
3. Verify username and password
4. Ensure camera is on same network

### Problem: Stream not showing

**Solution:**
1. Test RTSP URL in VLC Media Player:
   - Open VLC
   - Media → Open Network Stream
   - Enter your RTSP URL
2. If VLC works, check browser console (F12)
3. Ensure backend server is running

### Problem: Controls not working

**Solution:**
1. Verify camera supports PTZ (Pan-Tilt-Zoom)
2. Check ONVIF PTZ service is enabled
3. Ensure user has control permissions

### Problem: Server won't start

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Check if port 3000 is available
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000
```

## 🎯 Demo Mode

Don't have a camera? No problem!

The application will automatically enter **demo mode** if it can't connect to a camera or backend server. You'll see a sample video with all controls working.

## 📁 Files and Folders

```
ip-camera-viewer/
├── index.html          # Welcome page
├── config.html         # Camera settings
├── viewer.html         # Main viewer
├── server.js          # Backend server
├── css/               # Stylesheets
├── js/                # JavaScript files
└── recordings/        # Saved recordings & snapshots
```

## 🔐 Important Security Notes

⚠️ **For testing only!** This setup stores credentials in localStorage.

**For production:**
1. Use HTTPS/WSS (secure connections)
2. Implement proper authentication
3. Don't expose camera directly to internet
4. Use VPN for remote access

## 💡 Pro Tips

1. **Better Performance**: Use camera's sub-stream (lower resolution) for smoother playback
2. **Keyboard Shortcuts**: Use keyboard for quick control access
3. **Multiple Cameras**: Save different camera profiles in config page
4. **Recordings**: Find all recordings in `/recordings` folder
5. **Network**: Use wired connection for best quality

## 📱 Features Overview

### ✅ Currently Working
- Real-time RTSP streaming
- PTZ controls (zoom in/out)
- Recording to file
- Snapshot capture
- Fullscreen mode
- ONVIF protocol integration
- WebSocket streaming
- Demo mode fallback

### 🔄 Coming Soon
- Multi-camera view
- Playback interface
- Motion detection
- Cloud storage
- Mobile app

## 🆘 Need Help?

1. Check browser console: Press `F12` → Console tab
2. Check server logs in terminal
3. Review `INSTALL.md` for detailed setup
4. Verify camera is ONVIF-compatible

## 🎉 You're All Set!

Your IP Camera Viewer is ready to use. Enjoy professional-grade camera monitoring!

**Next Steps:**
- Explore all control buttons
- Try keyboard shortcuts
- Test recording and snapshot features
- Configure multiple camera profiles

---

**Having issues?** Check `INSTALL.md` for detailed troubleshooting.
**Want more features?** See `README.md` for roadmap and development plans.
