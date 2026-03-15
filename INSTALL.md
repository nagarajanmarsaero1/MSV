# Installation Guide

## Prerequisites

Before installing the IP Camera Viewer, make sure you have the following installed on your system:

### 1. Node.js and npm
- **Node.js**: Version 14.0.0 or higher
- **npm**: Version 6.0.0 or higher

Download from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

### 2. FFmpeg
FFmpeg is required for video streaming and recording.

#### Windows
1. Download from: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to system PATH

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### 3. IP Camera Requirements
- Camera must support ONVIF protocol
- Camera must provide RTSP stream
- Know your camera's:
  - IP address
  - HTTP port (usually 80 or 8080)
  - RTSP stream URL
  - Username and password

## Installation Steps

### 1. Extract Project Files
Extract all files to a directory of your choice:
```
ip-camera-viewer/
├── index.html
├── config.html
├── viewer.html
├── server.js
├── package.json
├── css/
│   └── style.css
├── js/
│   ├── onvif.js
│   ├── stream.js
│   ├── camera-control.js
│   ├── config.js
│   └── viewer.js
└── recordings/ (will be created automatically)
```

### 2. Install Node.js Dependencies
Open terminal/command prompt in the project directory:

```bash
cd path/to/ip-camera-viewer
npm install
```

This will install:
- express (web server)
- ws (WebSocket)
- cors (cross-origin resource sharing)
- node-onvif (ONVIF protocol library)

### 3. Start the Backend Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        IP Camera Viewer Backend Server                   ║
║                                                           ║
║        Server running on: http://localhost:3000          ║
║        WebSocket endpoint: ws://localhost:3000/stream    ║
║                                                           ║
║        Ready to accept camera connections!               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 4. Access the Application

#### Option A: Through Backend Server
Open your browser and navigate to:
```
http://localhost:3000
```

#### Option B: Direct File Access (Demo Mode)
Simply open `index.html` in your browser. 
Note: Full features require the backend server to be running.

## Configuration

### Camera Setup

1. Click "Start" on the welcome page
2. Enter your camera details:

**Example Configuration:**
```
Camera IP Address: 192.168.1.100
HTTP Port: 80
RTSP URL: rtsp://192.168.1.100:554/stream1
Username: admin
Password: your_password
```

3. Click "Test Connection" to verify settings
4. Click "Connect to Camera" to proceed

### Common RTSP URL Formats

Different camera manufacturers use different RTSP URL formats:

**Hikvision:**
```
rtsp://[ip]:[port]/Streaming/Channels/101
```

**Dahua:**
```
rtsp://[ip]:[port]/cam/realmonitor?channel=1&subtype=0
```

**Axis:**
```
rtsp://[ip]:[port]/axis-media/media.amp
```

**Generic:**
```
rtsp://[ip]:[port]/stream1
rtsp://[ip]:[port]/live
rtsp://[ip]:[port]/h264
```

## Troubleshooting

### Server Won't Start

**Error: `Cannot find module 'express'`**
```bash
npm install
```

**Error: Port 3000 already in use**
```bash
# Change port in server.js or stop the other service
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### FFmpeg Not Found

**Error: `spawn ffmpeg ENOENT`**
- Make sure FFmpeg is installed
- Verify it's in system PATH
- Restart terminal after installation

### Camera Connection Issues

**Connection Failed:**
1. Verify camera IP address is correct
2. Check camera is on the same network
3. Ensure ONVIF is enabled on camera
4. Try pinging camera: `ping [camera-ip]`
5. Check firewall settings

**Stream Not Displaying:**
1. Verify RTSP URL is correct
2. Check camera stream is working (try VLC player)
3. Ensure username/password are correct
4. Check camera streaming is enabled

**Controls Not Working:**
1. Verify camera supports PTZ
2. Check ONVIF service is enabled
3. Ensure user has PTZ control permissions

### Browser Issues

**Console Errors:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Clear browser cache and cookies

**WebSocket Connection Failed:**
- Ensure backend server is running
- Check firewall allows WebSocket connections
- Try different browser

## Performance Optimization

### For Better Streaming Performance:

1. **Reduce Stream Quality on Camera**
   - Use sub-stream instead of main stream
   - Lower resolution (720p instead of 1080p)
   - Reduce frame rate to 15-20 fps

2. **Network Optimization**
   - Use wired connection instead of WiFi
   - Ensure good network bandwidth
   - Minimize network congestion

3. **System Resources**
   - Close unnecessary applications
   - Ensure sufficient CPU/RAM available
   - Monitor system resource usage

## Security Recommendations

### For Production Deployment:

1. **Use HTTPS/WSS**
   - Enable SSL/TLS certificates
   - Use secure WebSocket (wss://)

2. **Protect Credentials**
   - Don't store passwords in plain text
   - Use environment variables
   - Implement proper authentication

3. **Network Security**
   - Use VPN for remote access
   - Configure firewall rules
   - Limit camera access to trusted IPs

4. **Camera Security**
   - Change default passwords
   - Keep camera firmware updated
   - Disable unnecessary services

## Next Steps

After successful installation:

1. ✅ Test camera connection
2. ✅ Verify stream is working
3. ✅ Test PTZ controls (zoom, pan, tilt)
4. ✅ Try recording and snapshot features
5. ✅ Configure keyboard shortcuts
6. ✅ Set up multiple camera profiles (optional)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Check server logs for error messages
4. Verify all prerequisites are installed correctly
5. Ensure camera is ONVIF-compatible

## Uninstallation

To remove the application:

1. Stop the server (Ctrl+C)
2. Delete project directory
3. Optionally remove Node.js and FFmpeg

That's it! You're ready to start using the IP Camera Viewer.
