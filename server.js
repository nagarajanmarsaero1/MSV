/**
 * Node.js Backend Server for IP Camera Viewer
 * Handles RTSP to WebSocket streaming, ONVIF commands, and recording
 * 
 * To run this server:
 * 1. Install dependencies: npm install
 * 2. Make sure FFmpeg is installed on your system
 * 3. Run: node server.js
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const onvif = require('node-onvif');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Configuration
const PORT = process.env.PORT || 4000;
let cameraConfig = null;
let onvifDevice = null;
let ffmpegProcess = null;
let recordingProcess = null;
let isRecording = false;

// Recordings directory
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR);
}

/**
 * Health Check API
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'ok', 
        port: PORT,
        cameraConfigured: !!cameraConfig 
    });
});

/**
 * Connect to camera
 */
app.post('/api/connect', async (req, res) => {
    try {
        cameraConfig = req.body;
        console.log('Connecting to camera:', cameraConfig.cameraIp);

        // Initialize ONVIF device
        const device = new onvif.OnvifDevice({
            xaddr: `http://${cameraConfig.cameraIp}:${cameraConfig.httpPort}/onvif/device_service`,
            user: cameraConfig.username,
            pass: cameraConfig.password
        });

        // Ensure RTSP URL has credentials if needed
        if (cameraConfig.rtspUrl && !cameraConfig.rtspUrl.includes('@') && cameraConfig.username && cameraConfig.password) {
            const urlParts = cameraConfig.rtspUrl.split('://');
            if (urlParts.length === 2) {
                cameraConfig.rtspUrl = `${urlParts[0]}://${encodeURIComponent(cameraConfig.username)}:${encodeURIComponent(cameraConfig.password)}@${urlParts[1]}`;
            }
        }

        await device.init();
        onvifDevice = device;

        console.log('Camera connected successfully');
        console.log('Device info:', device.information);

        res.json({
            success: true,
            message: 'Connected to camera',
            deviceInfo: device.information
        });

    } catch (error) {
        console.error('Failed to connect to camera:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect to camera',
            error: error.message
        });
    }
});

/**
 * Test connection
 */
app.post('/api/test-connection', async (req, res) => {
    try {
        const config = req.body;

        const device = new onvif.OnvifDevice({
            xaddr: `http://${config.cameraIp}:${config.httpPort}/onvif/device_service`,
            user: config.username,
            pass: config.password
        });

        await device.init();

        res.json({
            success: true,
            message: 'Connection successful',
            deviceInfo: device.information
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Connection failed',
            error: error.message
        });
    }
});

/**
 * PTZ Control - Zoom In
 */
app.post('/api/ptz/zoom-in', async (req, res) => {
    try {
        if (!onvifDevice) {
            throw new Error('Camera not connected');
        }

        const speed = req.body.speed || 0.5;
        console.log(`PTZ: Zooming in at speed ${speed}`);

        await onvifDevice.ptzMove({
            speed: { x: 0, y: 0, z: speed },
            timeout: 1
        });

        res.json({ success: true, message: 'Zoom in command sent' });

    } catch (error) {
        console.error('Zoom in failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PTZ Control - Zoom Out
 */
app.post('/api/ptz/zoom-out', async (req, res) => {
    try {
        if (!onvifDevice) {
            throw new Error('Camera not connected');
        }

        const speed = req.body.speed || 0.5;
        console.log(`PTZ: Zooming out at speed ${speed}`);

        await onvifDevice.ptzMove({
            speed: { x: 0, y: 0, z: -speed },
            timeout: 1
        });

        res.json({ success: true, message: 'Zoom out command sent' });

    } catch (error) {
        console.error('Zoom out failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PTZ Control - Stop Zoom
 */
app.post('/api/ptz/zoom-stop', async (req, res) => {
    try {
        if (!onvifDevice) {
            throw new Error('Camera not connected');
        }

        console.log('PTZ: Stopping movement');
        await onvifDevice.ptzStop();

        res.json({ success: true, message: 'Stop command sent' });

    } catch (error) {
        console.error('Stop failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PTZ Control - Move (Pan/Tilt)
 */
app.post('/api/ptz/move', async (req, res) => {
    try {
        if (!onvifDevice) {
            throw new Error('Camera not connected');
        }

        const { x, y, zoom } = req.body;

        await onvifDevice.ptzMove({
            x: x || 0,
            y: y || 0,
            zoom: zoom || 0,
            timeout: 1
        });

        res.json({ success: true, message: 'Move command sent' });

    } catch (error) {
        console.error('Move failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Start Recording
 */
app.post('/api/record/start', (req, res) => {
    try {
        if (isRecording) {
            return res.status(400).json({ success: false, message: 'Already recording' });
        }

        if (!cameraConfig) {
            return res.status(400).json({ success: false, message: 'Camera not connected' });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `recording_${timestamp}.mp4`;
        const outputPath = path.join(RECORDINGS_DIR, filename);

        // Start FFmpeg recording process
        // Added -movflags frag_keyframe+empty_moov for fragmented mp4 if needed, 
        // but 'copy' is better for performance if source is already H.264
        recordingProcess = spawn('ffmpeg', [
            '-rtsp_transport', 'tcp',
            '-i', cameraConfig.rtspUrl,
            '-c', 'copy',
            '-f', 'mp4',
            '-y', // Overwrite if exists
            outputPath
        ]);

        recordingProcess.on('error', (error) => {
            console.error('Recording error:', error);
            isRecording = false;
        });

        recordingProcess.on('exit', (code) => {
            console.log(`Recording process exited with code ${code}`);
            isRecording = false;
        });

        isRecording = true;
        console.log('Recording started:', filename);

        res.json({
            success: true,
            message: 'Recording started',
            filename: filename
        });

    } catch (error) {
        console.error('Failed to start recording:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Stop Recording
 */
app.post('/api/record/stop', (req, res) => {
    try {
        if (!isRecording || !recordingProcess) {
            return res.status(400).json({ success: false, message: 'Not recording' });
        }

        // Send quit command to FFmpeg gracefully if possible
        if (recordingProcess.stdin) {
            recordingProcess.stdin.write('q');
        }

        setTimeout(() => {
            if (recordingProcess) {
                recordingProcess.kill('SIGTERM');
                recordingProcess = null;
            }
            isRecording = false;
        }, 1000);

        console.log('Recording stopped');

        res.json({
            success: true,
            message: 'Recording stopped',
            downloadUrl: `/api/recordings/latest`
        });

    } catch (error) {
        console.error('Failed to stop recording:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get latest recording
 */
app.get('/api/recordings/latest', (req, res) => {
    try {
        const files = fs.readdirSync(RECORDINGS_DIR)
            .filter(f => f.endsWith('.mp4'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(RECORDINGS_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 0) {
            const latestFile = path.join(RECORDINGS_DIR, files[0].name);
            res.download(latestFile);
        } else {
            res.status(404).json({ success: false, message: 'No recordings found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get Snapshot
 */
app.get('/api/snapshot', async (req, res) => {
    try {
        if (!cameraConfig) {
            return res.status(400).json({ success: false, message: 'Camera not connected' });
        }

        // Get snapshot from camera
        const snapshotUrl = `http://${cameraConfig.cameraIp}:${cameraConfig.httpPort}/onvif-http/snapshot`;

        // For demo purposes, we'll use FFmpeg to grab a frame
        const timestamp = Date.now();
        const tempFile = path.join(RECORDINGS_DIR, `snapshot_${timestamp}.jpg`);

        const ffmpeg = spawn('ffmpeg', [
            '-rtsp_transport', 'tcp',
            '-i', cameraConfig.rtspUrl,
            '-vframes', '1',
            '-f', 'image2',
            '-update', '1',
            tempFile
        ]);

        ffmpeg.on('exit', (code) => {
            if (code === 0 && fs.existsSync(tempFile)) {
                res.sendFile(tempFile, (err) => {
                    // Clean up temp file after sending
                    if (!err) {
                        setTimeout(() => {
                            fs.unlink(tempFile, () => { });
                        }, 1000);
                    }
                });
            } else {
                res.status(500).json({ success: false, message: 'Failed to capture snapshot' });
            }
        });

    } catch (error) {
        console.error('Snapshot failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * WebSocket Stream Handler
 */
let lastRestartTime = 0;
const RESTART_COOLDOWN = 2000; // 2 seconds

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Check for crash loop
    const now = Date.now();
    if (now - lastRestartTime < RESTART_COOLDOWN) {
        console.warn('FFmpeg restart cooldown active. Delaying connection...');
    }
    lastRestartTime = now;

    // Start FFmpeg process after a small delay to prevent crash loops
    const startFFmpeg = () => {
        if (ws.readyState !== WebSocket.OPEN) return;

        console.log('Starting MPEG-TS stream for:', cameraConfig.rtspUrl);

        const ffmpeg = spawn('ffmpeg', [
            '-rtsp_transport', 'tcp',
            '-i', cameraConfig.rtspUrl,
            '-vcodec', 'copy',
            '-an',
            '-f', 'mpegts',
            '-fflags', 'nobuffer',
            '-flags', 'low_delay',
            'pipe:1'
        ]);

        // Process FFmpeg output - direct pipe for MPEG-TS
        ffmpeg.stdout.on('data', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                // For MPEG-TS, we just send chunks. 
                // The frontend player (mpegts.js) will handle reconstruction.
                if (ws.bufferedAmount < 1024 * 1024) { // 1MB buffer limit
                    ws.send(data);
                }
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.includes('Error') || msg.includes('fail')) {
                // Avoid logging every tiny error to keep console clean
                if (!msg.includes('Packet corrupt')) {
                    console.error('FFmpeg error:', msg);
                }
            }
        });

    ffmpeg.on('error', (error) => {
        console.error('FFmpeg process error:', error);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ error: 'FFmpeg process failed' }));
        }
        ws.close(1011, 'Stream error');
    });

    ffmpeg.on('exit', (code) => {
        console.log(`FFmpeg exited with code ${code}`);
        if (code !== 0 && code !== null) {
            console.error(`FFmpeg crash detected. Exit code: ${code}`);
        }
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Stream ended');
        }
    });

        // Handle client disconnect
        ws.on('close', () => {
            console.log('WebSocket client disconnected');
            if (ffmpeg) {
                ffmpeg.kill('SIGTERM');
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            if (ffmpeg) {
                ffmpeg.kill('SIGTERM');
            }
        });
    };

    if (!cameraConfig) {
        ws.close(1000, 'Camera not configured');
        return;
    }

    // Determine initial delay to prevent crash loops
    const initialDelay = Math.max(0, RESTART_COOLDOWN - (now - lastRestartTime));
    if (initialDelay > 0) {
        console.log(`Delaying stream start by ${initialDelay}ms to prevent loop...`);
    }
    setTimeout(startFFmpeg, initialDelay);
});

/**
 * Start server
 */
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        IP Camera Viewer Backend Server                   ║
║                                                           ║
║        Server running on: http://localhost:${PORT}       ║
║        WebSocket endpoint: ws://localhost:${PORT}/stream  ║
║                                                           ║
║        Ready to accept camera connections!                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
    console.log('Recordings will be saved to:', RECORDINGS_DIR);
});

/**
 * Cleanup on exit
 */
process.on('SIGINT', () => {
    console.log('\nShutting down server...');

    if (recordingProcess) {
        recordingProcess.kill('SIGTERM');
    }

    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGTERM');
    }

    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Server terminated');
    process.exit(0);
});
