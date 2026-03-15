/**
 * Viewer Page Main Script
 * Initializes the camera viewer and manages the stream
 */

(function() {
    'use strict';

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', initializeViewer);

    /**
     * Main initialization function
     */
    async function initializeViewer() {
        console.log('Initializing camera viewer...');

        // Load camera configuration
        if (!initializeCameraConfig()) {
            showNotification('❌ No camera configuration found');
            setTimeout(() => {
                window.location.href = 'config.html';
            }, 2000);
            return;
        }

        // Display camera info
        displayCameraInfo();

        // Update connection status
        updateConnectionStatus('connecting', 'Connecting...');

        // Initialize ONVIF client
        try {
            onvifClient = new ONVIFClient(cameraConfig);
            console.log('ONVIF client initialized');
        } catch (error) {
            console.error('Failed to initialize ONVIF client:', error);
        }

        // Connect to backend
        try {
            const backendStatus = await connectToBackend();
            console.log('Backend status:', backendStatus);
        } catch (error) {
            console.log('Backend not available, will use demo mode');
        }

        // Initialize stream
        try {
            streamConnection = await initializeStream(cameraConfig);
            console.log('Stream initialized');

            // Hide loading overlay
            setTimeout(() => {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
            }, 2000);

            // Auto-play
            setTimeout(() => {
                if (!isPlaying) {
                    togglePlayPause();
                }
            }, 3000);

        } catch (error) {
            console.error('Failed to initialize stream:', error);
            updateConnectionStatus('disconnected', 'Connection Failed');
            
            // Hide loading overlay
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }

        // Enter fullscreen automatically
        setTimeout(() => {
            enterFullscreenAutomatically();
        }, 1000);

        // Setup keyboard shortcuts
        setupKeyboardShortcuts();

        // Setup fullscreen change listener
        document.addEventListener('fullscreenchange', handleFullscreenChange);
    }

    /**
     * Display camera information
     */
    function displayCameraInfo() {
        const cameraIpDisplay = document.getElementById('cameraIpDisplay');
        if (cameraIpDisplay && cameraConfig) {
            cameraIpDisplay.textContent = `${cameraConfig.cameraIp}:${cameraConfig.httpPort}`;
        }
    }

    /**
     * Enter fullscreen automatically
     */
    function enterFullscreenAutomatically() {
        const container = document.querySelector('.viewer-container');
        if (container && !document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.log('Auto-fullscreen failed (user interaction may be required):', err);
                showNotification('Press F11 for fullscreen');
            });
        }
    }

    /**
     * Handle fullscreen change
     */
    function handleFullscreenChange() {
        const fullscreenIcon = document.getElementById('fullscreenIcon');
        const fullscreenText = document.getElementById('fullscreenText');
        
        if (document.fullscreenElement) {
            if (fullscreenIcon) fullscreenIcon.className = 'fas fa-compress';
            if (fullscreenText) fullscreenText.textContent = 'Exit Fullscreen';
        } else {
            if (fullscreenIcon) fullscreenIcon.className = 'fas fa-expand';
            if (fullscreenText) fullscreenText.textContent = 'Fullscreen';
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default for control keys
            switch(e.key.toLowerCase()) {
                case ' ': // Space - Play/Pause
                    e.preventDefault();
                    togglePlayPause();
                    break;
                
                case 'f': // F - Fullscreen
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                
                case 'r': // R - Record
                    e.preventDefault();
                    toggleRecord();
                    break;
                
                case 's': // S - Snapshot
                    e.preventDefault();
                    takeSnapshot();
                    break;
                
                case '+': // + - Zoom In
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                
                case '-': // - - Zoom Out
                case '_':
                    e.preventDefault();
                    zoomOut();
                    break;
                
                case '0': // 0 - Zoom Stop
                    e.preventDefault();
                    zoomStop();
                    break;
                
                case 'escape': // ESC - Exit fullscreen
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
            }
        });
    }

    /**
     * Cleanup on page unload
     */
    window.addEventListener('beforeunload', () => {
        if (streamConnection) {
            streamConnection.disconnect();
        }
        if (isRecording) {
            toggleRecord();
        }
    });

    /**
     * Handle visibility change (pause when tab is hidden)
     */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Page hidden, pausing stream');
            // Optionally pause stream when tab is hidden
            // if (isPlaying && streamConnection) {
            //     streamConnection.pause();
            // }
        } else {
            console.log('Page visible, resuming stream');
            // if (isPlaying && streamConnection) {
            //     streamConnection.play();
            // }
        }
    });

})();
