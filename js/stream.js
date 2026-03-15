/**
 * WebSocket Stream Handler
 * Manages WebSocket connection for video streaming
 */

class StreamConnection {
    constructor(wsUrl, videoElementId) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        this.wsUrl = wsUrl || `${protocol}//${host}:4000/stream`;
        this.videoElement = document.getElementById(videoElementId || 'videoElement');
        this.player = null;
        this.isConnected = false;
        this.isPaused = false;
    }

    /**
     * Connect and start MPEG-TS playback
     */
    connect() {
        if (!mpegts.getFeatureList().mseLivePlayback) {
            console.error('MSE not supported by browser');
            showNotification('❌ Browser does not support live streaming');
            return;
        }

        console.log('Connecting to MPEG-TS stream:', this.wsUrl);
        
        // Show video element, hide canvas
        if (this.videoElement) {
            this.videoElement.style.display = 'block';
            this.videoElement.muted = true; // Ensure muted for autoplay
            const canvas = document.getElementById('videoCanvas');
            if (canvas) canvas.style.display = 'none';
        }

        try {
            if (this.player) this.disconnect();

            this.player = mpegts.createPlayer({
                type: 'mpegts',
                isLive: true,
                url: this.wsUrl
            }, {
                enableStashBuffer: false,
                stashInitialSize: 128,
                liveBufferLatencyChasing: true,
                liveBufferLatencyChasingThreshold: 0.1,
                autoCleanupSourceBuffer: true,
                enableWorker: true
            });

            this.player.attachMediaElement(this.videoElement);
            this.player.load();
            
            // Promise-based play to handle browser restrictions
            const playPromise = this.videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Autoplay prevented, waiting for interaction');
                });
            }

            this.player.on(mpegts.Events.ERROR, (type, detail, info) => {
                console.error('MPEG-TS Player Error:', type, detail, info);
                this.handleReconnect();
            });

            // Monitor for "stuck" video
            this.setupHealthCheck();

            this.isConnected = true;
            this.onConnected();

        } catch (error) {
            console.error('Failed to initialize mpegts.js:', error);
            this.onError(error);
        }
    }

    setupHealthCheck() {
        if (this.healthCheck) clearInterval(this.healthCheck);
        let lastTime = 0;
        let stuckCount = 0;

        this.healthCheck = setInterval(() => {
            if (this.videoElement && !this.videoElement.paused) {
                if (this.videoElement.currentTime === lastTime) {
                    stuckCount++;
                    if (stuckCount > 5) {
                        console.warn('Stream appears stuck, attempting recovery...');
                        this.handleReconnect();
                    }
                } else {
                    stuckCount = 0;
                }
                lastTime = this.videoElement.currentTime;
            }
        }, 1000);
    }

    handleReconnect() {
        console.log('Reconnecting stream...');
        this.disconnect();
        setTimeout(() => this.connect(), 1000);
    }

    /**
     * Stop and disconnect
     */
    disconnect() {
        if (this.healthCheck) {
            clearInterval(this.healthCheck);
            this.healthCheck = null;
        }
        if (this.player) {
            try {
                this.player.pause();
                this.player.unload();
                this.player.detachMediaElement();
                this.player.destroy();
            } catch (e) {
                console.error('Cleanup error:', e);
            }
            this.player = null;
        }
        this.isConnected = false;
    }

    pause() {
        if (this.videoElement) this.videoElement.pause();
        this.isPaused = true;
    }

    play() {
        if (this.videoElement) this.videoElement.play();
        this.isPaused = false;
    }

    onConnected() {
        if (typeof isPlaying !== 'undefined') isPlaying = true;
        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');
        if (playIcon) playIcon.className = 'fas fa-pause';
        if (playText) playText.textContent = 'Pause';

        if (typeof updateConnectionStatus === 'function') {
            updateConnectionStatus('connected', 'Live Stream');
        }
        if (typeof showNotification === 'function') {
            showNotification('✅ Stream Connected (MPEG-TS)');
        }
    }

    onDisconnected() {
        if (typeof updateConnectionStatus === 'function') {
            updateConnectionStatus('disconnected', 'Disconnected');
        }
    }

    onError(error) {
        if (typeof updateConnectionStatus === 'function') {
            updateConnectionStatus('disconnected', `Stream Error: ${error}`);
        }
    }
}

/**
 * Demo Video Player (Fallback when WebSocket is not available)
 */
class DemoVideoPlayer {
    constructor(videoElementId) {
        this.video = document.getElementById(videoElementId);
        this.canvas = document.getElementById('videoCanvas');
    }

    /**
     * Load demo video
     */
    loadDemo(videoUrl) {
        if (!this.video) return;

        // Use a demo video URL (Big Buck Bunny or other public domain video)
        const demoUrl = videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        
        this.video.src = demoUrl;
        this.video.style.display = 'block';
        this.canvas.style.display = 'none';
        
        this.video.play().then(() => {
            console.log('Demo video playing');
            if (typeof updateConnectionStatus === 'function') {
                updateConnectionStatus('connected', 'Demo Mode');
            }
            if (typeof showNotification === 'function') {
                showNotification('🎬 Demo Mode Active');
            }
        }).catch(error => {
            console.error('Demo video playback failed:', error);
        });
    }

    /**
     * Pause demo video
     */
    pause() {
        if (this.video) {
            this.video.pause();
        }
    }

    /**
     * Play demo video
     */
    play() {
        if (this.video) {
            this.video.play();
        }
    }

    /**
     * Disconnect (stop) demo video
     */
    disconnect() {
        if (this.video) {
            this.video.pause();
            this.video.src = '';
        }
    }
}

/**
 * Initialize appropriate stream based on availability
 */
async function initializeStream(cameraConfig) {
    // Try WebSocket connection first
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:4000/stream`;
    const streamConnection = new StreamConnection(wsUrl, 'videoElement');
    
    // Test if backend is available with a proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch('http://localhost:4000/api/health', { 
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('Backend available, using WebSocket stream');
            streamConnection.connect();
            return streamConnection;
        }
    } catch (error) {
        console.log('Backend not available or timed out, using demo mode');
    }

    // Fallback to demo video
    const demoPlayer = new DemoVideoPlayer('videoElement');
    demoPlayer.loadDemo();
    return demoPlayer;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StreamConnection,
        DemoVideoPlayer,
        initializeStream
    };
}
