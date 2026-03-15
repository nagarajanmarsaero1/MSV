# API Documentation

Complete API reference for the IP Camera Viewer backend server.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication tokens. Camera credentials are passed in request bodies.

**Security Note**: In production, implement proper authentication (JWT, OAuth, etc.)

---

## Endpoints

### 1. Health Check

Check if server is running.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

**Status Codes:**
- `200 OK`: Server is operational

---

### 2. Connect to Camera

Initialize connection to IP camera via ONVIF.

**Endpoint:** `POST /api/connect`

**Request Body:**
```json
{
  "cameraIp": "192.168.1.100",
  "httpPort": "80",
  "rtspUrl": "rtsp://192.168.1.100:554/stream1",
  "username": "admin",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connected to camera",
  "deviceInfo": {
    "Manufacturer": "Hikvision",
    "Model": "DS-2CD2142FWD-I",
    "FirmwareVersion": "V5.4.5",
    "SerialNumber": "DS-2CD2142FWD-I20160101",
    "HardwareId": "88"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to connect to camera",
  "error": "Connection timeout"
}
```

**Status Codes:**
- `200 OK`: Successfully connected
- `500 Internal Server Error`: Connection failed

---

### 3. Test Connection

Test camera connection without saving configuration.

**Endpoint:** `POST /api/test-connection`

**Request Body:**
```json
{
  "cameraIp": "192.168.1.100",
  "httpPort": "80",
  "username": "admin",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful",
  "deviceInfo": {
    "Manufacturer": "Hikvision",
    "Model": "DS-2CD2142FWD-I"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Connection failed",
  "error": "Authentication failed"
}
```

**Status Codes:**
- `200 OK`: Test successful
- `500 Internal Server Error`: Test failed

---

## PTZ Control Endpoints

### 4. Zoom In

Zoom camera in.

**Endpoint:** `POST /api/ptz/zoom-in`

**Request Body (Optional):**
```json
{
  "speed": 0.5
}
```

**Parameters:**
- `speed` (optional): Zoom speed from 0.0 to 1.0 (default: 0.5)

**Response:**
```json
{
  "success": true,
  "message": "Zoom in command sent"
}
```

**Status Codes:**
- `200 OK`: Command sent successfully
- `500 Internal Server Error`: Command failed

---

### 5. Zoom Out

Zoom camera out.

**Endpoint:** `POST /api/ptz/zoom-out`

**Request Body (Optional):**
```json
{
  "speed": 0.5
}
```

**Parameters:**
- `speed` (optional): Zoom speed from 0.0 to 1.0 (default: 0.5)

**Response:**
```json
{
  "success": true,
  "message": "Zoom out command sent"
}
```

**Status Codes:**
- `200 OK`: Command sent successfully
- `500 Internal Server Error`: Command failed

---

### 6. Stop Zoom

Stop all PTZ movements.

**Endpoint:** `POST /api/ptz/zoom-stop`

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Stop command sent"
}
```

**Status Codes:**
- `200 OK`: Command sent successfully
- `500 Internal Server Error`: Command failed

---

### 7. PTZ Move

Control pan, tilt, and zoom simultaneously.

**Endpoint:** `POST /api/ptz/move`

**Request Body:**
```json
{
  "x": 0.5,
  "y": 0.3,
  "zoom": 0.2
}
```

**Parameters:**
- `x` (optional): Pan speed from -1.0 (left) to 1.0 (right)
- `y` (optional): Tilt speed from -1.0 (down) to 1.0 (up)
- `zoom` (optional): Zoom speed from -1.0 (out) to 1.0 (in)

**Response:**
```json
{
  "success": true,
  "message": "Move command sent"
}
```

**Status Codes:**
- `200 OK`: Command sent successfully
- `500 Internal Server Error`: Command failed

---

## Recording Endpoints

### 8. Start Recording

Start video recording.

**Endpoint:** `POST /api/record/start`

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Recording started",
  "filename": "recording_2024-01-15T10-30-45.123Z.mp4"
}
```

**Status Codes:**
- `200 OK`: Recording started
- `400 Bad Request`: Already recording or camera not connected
- `500 Internal Server Error`: Failed to start recording

---

### 9. Stop Recording

Stop video recording.

**Endpoint:** `POST /api/record/stop`

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Recording stopped"
}
```

**Status Codes:**
- `200 OK`: Recording stopped
- `400 Bad Request`: Not recording
- `500 Internal Server Error`: Failed to stop recording

---

## Media Endpoints

### 10. Get Snapshot

Capture still image from camera stream.

**Endpoint:** `GET /api/snapshot`

**Response:** Binary JPEG image

**Content-Type:** `image/jpeg`

**Status Codes:**
- `200 OK`: Snapshot captured successfully (returns image file)
- `400 Bad Request`: Camera not connected
- `500 Internal Server Error`: Failed to capture snapshot

---

## WebSocket Endpoints

### 11. Stream WebSocket

Real-time video stream via WebSocket.

**Endpoint:** `ws://localhost:3000/stream`

**Protocol:** WebSocket

**Data Format:** Binary (JPEG frames)

**Connection Flow:**
1. Client connects to WebSocket
2. Server starts FFmpeg process to convert RTSP to MJPEG
3. Server sends JPEG frames continuously
4. Client displays frames on canvas

**Messages:**
- **Binary**: JPEG image frame

**Close Codes:**
- `1000`: Normal closure (stream ended)
- `1011`: Stream error

**Example Client Code:**
```javascript
const ws = new WebSocket('ws://localhost:3000/stream');
ws.binaryType = 'arraybuffer';

ws.onmessage = (event) => {
  const blob = new Blob([event.data], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  };
  img.src = url;
};
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details"
}
```

### Common Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "Camera not connected" | No active camera connection | Call `/api/connect` first |
| "Connection timeout" | Camera unreachable | Check IP address and network |
| "Authentication failed" | Wrong credentials | Verify username/password |
| "ONVIF not supported" | Camera doesn't support ONVIF | Use ONVIF-compatible camera |
| "PTZ not supported" | Camera has no PTZ capability | Check camera specifications |
| "Already recording" | Recording already in progress | Stop current recording first |
| "Not recording" | Trying to stop when not recording | Start recording first |

---

## Rate Limiting

Currently, no rate limiting is implemented.

**Production Recommendation**: Implement rate limiting to prevent abuse:
- Max 100 requests per minute per IP
- Max 10 concurrent WebSocket connections
- Max 5 concurrent recordings

---

## CORS Configuration

CORS is enabled for all origins (`*`) in development.

**Production Recommendation**: Restrict to specific origins:
```javascript
app.use(cors({
  origin: 'https://your-domain.com'
}));
```

---

## Client Libraries

### JavaScript/TypeScript Example

```javascript
class CameraAPI {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  async connect(config) {
    const response = await fetch(`${this.baseUrl}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await response.json();
  }

  async zoomIn(speed = 0.5) {
    const response = await fetch(`${this.baseUrl}/ptz/zoom-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    });
    return await response.json();
  }

  async startRecording() {
    const response = await fetch(`${this.baseUrl}/record/start`, {
      method: 'POST'
    });
    return await response.json();
  }

  async getSnapshot() {
    const response = await fetch(`${this.baseUrl}/snapshot`);
    return await response.blob();
  }
}
```

---

## Version History

- **v1.0.0** (2024): Initial release
  - Basic ONVIF support
  - PTZ control
  - Recording and snapshot
  - WebSocket streaming

---

## Future API Endpoints (Planned)

- `GET /api/recordings` - List all recordings
- `GET /api/recordings/:id` - Get specific recording
- `DELETE /api/recordings/:id` - Delete recording
- `GET /api/capabilities` - Get camera capabilities
- `POST /api/presets/save` - Save PTZ preset
- `POST /api/presets/goto` - Go to PTZ preset
- `GET /api/status` - Get camera status

---

For more information, see the main [README.md](README.md) file.
