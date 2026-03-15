# IP Camera Viewer Website

A complete web-based IP camera viewer with ONVIF protocol support for professional camera control and real-time streaming.

## 🎯 Project Overview

This project provides a full-featured web interface for viewing and controlling IP cameras using ONVIF protocol. It includes real-time video streaming, PTZ (Pan-Tilt-Zoom) controls, recording capabilities, and snapshot functionality.

## ✅ Currently Completed Features

### Frontend Pages
1. **Welcome Page** (`index.html`)
   - Elegant landing page with start button
   - Smooth animations and modern design
   - Entry point to the application

2. **Camera Configuration Page** (`config.html`)
   - Camera connection settings form
   - Input fields: IP address, HTTP port, RTSP address, username, password
   - Settings saved to localStorage for convenience
   - Connect button to proceed to viewer

3. **Main Viewer Page** (`viewer.html`)
   - Full-screen video display (always fullscreen mode)
   - Real-time camera stream viewer
   - Transparent overlay control buttons
   - Responsive design

### Camera Controls (Overlay Buttons)
- ▶️ **Play/Pause**: Start and stop video stream
- 🔍 **Zoom In**: Zoom into camera view
- 🔍 **Zoom Out**: Zoom out from camera view
- ⏹️ **Zoom Stop**: Stop zoom operation
- ⏺️ **Record On/Off**: Start and stop recording
- 📸 **Snapshot**: Capture still image from stream
- ⚙️ **Settings**: Return to configuration page

### Backend Server (`server.js`)
- **RTSP to WebSocket Streaming**: Converts RTSP stream to browser-compatible format
- **ONVIF SOAP Integration**: Full ONVIF protocol implementation
- **PTZ Control Endpoints**: REST API for camera control
- **Recording Management**: Server-side video recording
- **Snapshot Generation**: Image capture from stream
- **CORS Support**: Handles cross-origin requests

### JavaScript Components
1. **ONVIF Client** (`js/onvif.js`)
   - SOAP envelope generation
   - WS-Security authentication
   - PTZ control commands
   - Camera capabilities discovery

2. **Camera Controller** (`js/camera-control.js`)
   - Video stream management
   - Control button handlers
   - Fullscreen mode enforcement
   - Recording and snapshot logic

3. **WebSocket Client** (`js/stream.js`)
   - WebSocket connection management
   - Video frame decoding
   - Stream error handling

## 🚀 Functional Entry URIs

### Frontend Routes
- `/` or `/index.html` - Welcome page
- `/config.html` - Camera configuration page
- `/viewer.html` - Main camera viewer (fullscreen)

### Backend API Endpoints

#### Camera Control
- `POST /api/connect` - Connect to camera
  - Body: `{ip, port, rtspUrl, username, password}`
  
- `POST /api/ptz/zoom-in` - Zoom in camera
- `POST /api/ptz/zoom-out` - Zoom out camera
- `POST /api/ptz/zoom-stop` - Stop zoom
- `POST /api/ptz/move` - Move camera (pan/tilt)
  - Body: `{x, y, zoom}`

#### Recording & Snapshots
- `POST /api/record/start` - Start recording
- `POST /api/record/stop` - Stop recording
- `GET /api/snapshot` - Capture snapshot

#### Streaming
- `WebSocket ws://localhost:3000/stream` - Video stream WebSocket

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Client-side logic
- **Canvas API**: Video rendering
- **WebSocket API**: Real-time streaming
- **LocalStorage API**: Settings persistence

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **ws**: WebSocket library
- **node-onvif**: ONVIF protocol library
- **fluent-ffmpeg**: Video processing
- **cors**: Cross-origin resource sharing

### Protocols
- **ONVIF**: Camera control protocol
- **RTSP**: Real-Time Streaming Protocol
- **WebSocket**: Browser streaming
- **SOAP**: ONVIF communication

## 📦 Installation & Setup

### Prerequisites
- Node.js 14+ installed
- IP camera with ONVIF support
- FFmpeg installed on system

### Installation Steps

1. **Install Node.js dependencies**:
```bash
npm install
```

2. **Start the backend server**:
```bash
node server.js
```

3. **Open the application**:
   - Open `index.html` in a web browser
   - Or navigate to `http://localhost:3000` if served

### Configuration
1. Click "Start" on welcome page
2. Enter camera details:
   - Camera IP address (e.g., `192.168.1.100`)
   - HTTP Port (e.g., `80`)
   - RTSP URL (e.g., `rtsp://192.168.1.100:554/stream1`)
   - Username
   - Password
3. Click "Connect to Camera"

## 🎮 How to Use

### Basic Operation
1. **Connect**: Enter camera credentials on config page
2. **View**: Stream automatically displays in fullscreen
3. **Control**: Use overlay buttons to control camera
4. **Record**: Click record button to save video
5. **Snapshot**: Click camera button to capture image

### Control Buttons
All buttons appear as transparent overlays on the video:
- Located at the bottom of the screen
- Hover for visual feedback
- Click to activate function
- Icons clearly indicate function

### Fullscreen Mode
- Automatically enters fullscreen on viewer page
- Press ESC to exit fullscreen
- Click settings icon to return to config

## 📊 Data Models

### Camera Configuration (LocalStorage)
```javascript
{
  cameraIp: "192.168.1.100",
  httpPort: "80",
  rtspUrl: "rtsp://192.168.1.100:554/stream1",
  username: "admin",
  password: "password123"
}
```

### ONVIF PTZ Command Structure
```xml
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ContinuousMove xmlns="http://www.onvif.org/ver20/ptz/wsdl">
      <ProfileToken>ProfileToken</ProfileToken>
      <Velocity>
        <Zoom x="0.5"/>
      </Velocity>
    </ContinuousMove>
  </s:Body>
</s:Envelope>
```

## 🔄 Features Not Yet Implemented

1. **Multi-Camera Support**: View multiple cameras simultaneously
2. **Camera Presets**: Save and recall camera positions
3. **Motion Detection**: Alert on detected motion
4. **Playback Controls**: Review recorded footage
5. **Cloud Storage**: Upload recordings to cloud
6. **User Authentication**: Secure access to viewer
7. **Mobile App**: Native mobile application
8. **PTZ Tour**: Automated camera movement patterns
9. **Audio Support**: Two-way audio communication
10. **Advanced Analytics**: AI-powered video analysis

## 🎯 Recommended Next Steps

### Phase 1: Enhancement
1. Add multiple camera profiles
2. Implement camera preset positions
3. Add video quality selector
4. Improve error handling and user feedback

### Phase 2: Recording Features
1. Implement recording playback interface
2. Add recording list and management
3. Add time-lapse recording option
4. Implement scheduled recording

### Phase 3: Advanced Features
1. Motion detection and alerts
2. Video analytics integration
3. Cloud backup integration
4. Mobile responsive improvements

### Phase 4: Production Ready
1. Add user authentication system
2. Implement HTTPS/WSS for security
3. Add logging and monitoring
4. Performance optimization

## 🔒 Security Considerations

### Current Implementation
- Camera credentials stored in localStorage (not secure for production)
- HTTP connections (should upgrade to HTTPS)
- No user authentication

### Production Recommendations
1. **Encrypt credentials**: Use secure storage
2. **HTTPS/WSS**: Enable SSL/TLS
3. **Authentication**: Add user login system
4. **Rate Limiting**: Prevent API abuse
5. **Input Validation**: Sanitize all inputs
6. **CORS**: Configure proper origins

## 🐛 Troubleshooting

### Common Issues

**Stream not displaying**:
- Verify camera RTSP URL is correct
- Check camera username/password
- Ensure FFmpeg is installed
- Check firewall settings

**Controls not working**:
- Verify camera supports ONVIF
- Check ONVIF service is enabled on camera
- Ensure camera HTTP port is correct

**Connection refused**:
- Verify camera IP address
- Check network connectivity
- Ensure camera is powered on

## 📝 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🤝 Support

For issues or questions:
1. Check camera ONVIF compatibility
2. Verify network connectivity
3. Review browser console for errors
4. Check server logs

## 🎨 Demo Mode

If you don't have an ONVIF camera, the application includes:
- Demo video playback capability
- Simulated control responses
- Test mode for development

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Fully functional prototype with complete backend implementation
