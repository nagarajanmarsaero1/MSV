/**
 * Camera Control JavaScript
 * Handles all camera control operations including zoom, play/pause, record, snapshot
 */

// Global state
let cameraConfig = null;
let onvifClient = null;
let isPlaying = false;
let isRecording = false;
let recordingStartTime = null;
let recordingInterval = null;
let streamConnection = null;

// Backend API base URL (change if backend is on different server)
const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Initialize camera configuration from localStorage
 */
function initializeCameraConfig() {
    const savedConfig = localStorage.getItem('cameraConfig');
    if (savedConfig) {
        cameraConfig = JSON.parse(savedConfig);
        return true;
    }
    return false;
}

/**
 * Show notification toast
 */
function showNotification(message, duration = 2000) {
    const toast = document.getElementById('notificationToast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(status, text) {
    const statusElement = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (statusElement && statusText) {
        statusElement.className = `connection-status ${status}`;
        statusText.textContent = text;
    }
}

/**
 * Connect to backend API
 */
async function connectToBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cameraConfig)
        });

        if (!response.ok) {
            throw new Error('Failed to connect to camera');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Backend connection error:', error);
        // Return demo mode if backend is not available
        return { mode: 'demo', message: 'Running in demo mode' };
    }
}

/**
 * Zoom In
 */
async function zoomIn() {
    showNotification('🔍 Zooming In...');
    
    try {
        // Try backend API first
        const response = await fetch(`${API_BASE_URL}/ptz/zoom-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            console.log('Zoom in command sent via backend');
        }
    } catch (error) {
        console.log('Backend not available, using direct ONVIF');
        
        // Fallback to direct ONVIF
        if (onvifClient) {
            try {
                await onvifClient.zoomIn(0.5);
                console.log('Zoom in command sent via ONVIF');
            } catch (onvifError) {
                console.error('ONVIF zoom in failed:', onvifError);
            }
        }
    }
}

/**
 * Zoom Out
 */
async function zoomOut() {
    showNotification('🔍 Zooming Out...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/ptz/zoom-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            console.log('Zoom out command sent via backend');
        }
    } catch (error) {
        console.log('Backend not available, using direct ONVIF');
        
        if (onvifClient) {
            try {
                await onvifClient.zoomOut(0.5);
                console.log('Zoom out command sent via ONVIF');
            } catch (onvifError) {
                console.error('ONVIF zoom out failed:', onvifError);
            }
        }
    }
}

/**
 * Stop Zoom
 */
async function zoomStop() {
    showNotification('⏹️ Stopping Zoom');
    
    try {
        const response = await fetch(`${API_BASE_URL}/ptz/zoom-stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            console.log('Zoom stop command sent via backend');
        }
    } catch (error) {
        console.log('Backend not available, using direct ONVIF');
        
        if (onvifClient) {
            try {
                await onvifClient.stop();
                console.log('Stop command sent via ONVIF');
            } catch (onvifError) {
                console.error('ONVIF stop failed:', onvifError);
            }
        }
    }
}

/**
 * Toggle Play/Pause
 */
function togglePlayPause() {
    const playIcon = document.getElementById('playIcon');
    const playText = document.getElementById('playText');
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playIcon.className = 'fas fa-pause';
        playText.textContent = 'Pause';
        showNotification('▶️ Playing');
        
        // Start or resume stream
        if (streamConnection) {
            streamConnection.play();
        }
    } else {
        playIcon.className = 'fas fa-play';
        playText.textContent = 'Play';
        showNotification('⏸️ Paused');
        
        // Pause stream
        if (streamConnection) {
            streamConnection.pause();
        }
    }
}

/**
 * Toggle Recording
 */
async function toggleRecord() {
    const recordBtn = document.getElementById('recordBtn');
    const recordIcon = document.getElementById('recordIcon');
    const recordText = document.getElementById('recordText');
    const recordingIndicator = document.getElementById('recordingIndicator');
    
    isRecording = !isRecording;
    
    if (isRecording) {
        // Start recording
        recordBtn.classList.add('recording');
        recordText.textContent = 'Stop';
        recordingIndicator.style.display = 'flex';
        showNotification('⏺️ Recording Started');
        
        recordingStartTime = Date.now();
        recordingInterval = setInterval(updateRecordingTime, 1000);
        
        // Send start recording to backend
        try {
            await fetch(`${API_BASE_URL}/record/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.log('Backend recording not available, using local recording');
        }
        
    } else {
        // Stop recording
        recordBtn.classList.remove('recording');
        recordText.textContent = 'Record';
        recordingIndicator.style.display = 'none';
        showNotification('⏹️ Recording Stopped');
        
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
        
        // Send stop recording to backend
        try {
            const response = await fetch(`${API_BASE_URL}/record/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.downloadUrl) {
                    // Trigger download of the recording
                    setTimeout(() => {
                        const a = document.createElement('a');
                        a.href = data.downloadUrl;
                        a.download = `recording_${Date.now()}.mp4`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        showNotification('✅ Recording Saved to Downloads');
                    }, 1500); // Wait for FFmpeg to finish writing
                }
            }
        } catch (error) {
            console.log('Backend recording not available');
        }
    }
}

/**
 * Update recording time display
 */
function updateRecordingTime() {
    if (!recordingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const recordTime = document.getElementById('recordTime');
    if (recordTime) {
        recordTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

/**
 * Take Snapshot
 */
async function takeSnapshot() {
    showNotification('📸 Taking Snapshot...');
    
    try {
        // Try backend API
        const response = await fetch(`${API_BASE_URL}/snapshot`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Download the snapshot
            const a = document.createElement('a');
            a.href = url;
            a.download = `snapshot_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('✅ Snapshot Saved');
        }
    } catch (error) {
        console.log('Backend snapshot not available, using canvas');
        
        // Fallback: capture from canvas
        const canvas = document.getElementById('videoCanvas');
        if (canvas) {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `snapshot_${Date.now()}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showNotification('✅ Snapshot Saved');
            }, 'image/jpeg');
        }
    }
}

/**
 * Toggle Fullscreen
 */
function toggleFullscreen() {
    const container = document.querySelector('.viewer-container');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const fullscreenText = document.getElementById('fullscreenText');
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => {
            fullscreenIcon.className = 'fas fa-compress';
            fullscreenText.textContent = 'Exit Fullscreen';
            showNotification('⛶ Fullscreen Mode');
        }).catch(err => {
            console.error('Fullscreen request failed:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            fullscreenIcon.className = 'fas fa-expand';
            fullscreenText.textContent = 'Fullscreen';
            showNotification('⛶ Exited Fullscreen');
        });
    }
}

/**
 * Go to Settings
 */
function goToSettings() {
    if (confirm('Return to settings? Current stream will be disconnected.')) {
        // Clean up
        if (isRecording) {
            toggleRecord();
        }
        if (streamConnection) {
            streamConnection.disconnect();
        }
        
        window.location.href = 'config.html';
    }
}

/**
 * Update stream time display
 */
let streamStartTime = Date.now();
setInterval(() => {
    const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    const streamTimeElement = document.getElementById('streamTime');
    if (streamTimeElement) {
        streamTimeElement.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}, 1000);

/**
 * Refresh Stream
 */
function refreshStream() {
    showNotification('🔄 Refreshing Stream...');
    if (streamConnection && typeof streamConnection.handleReconnect === 'function') {
        streamConnection.handleReconnect();
    } else {
        window.location.reload();
    }
}

// Export functions for use in viewer.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        zoomIn,
        zoomOut,
        zoomStop,
        togglePlayPause,
        toggleRecord,
        takeSnapshot,
        refreshStream,
        toggleFullscreen,
        goToSettings,
        initializeCameraConfig,
        connectToBackend,
        showNotification,
        updateConnectionStatus
    };
}
