/**
 * Configuration Page JavaScript
 * Handles camera configuration form and settings management
 */

// Load saved configuration on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedConfig();
    loadRecentConfigs();
});

/**
 * Load saved configuration from localStorage
 */
function loadSavedConfig() {
    const savedConfig = localStorage.getItem('cameraConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        document.getElementById('cameraIp').value = config.cameraIp || '192.168.144.68';
        document.getElementById('httpPort').value = config.httpPort || '80';
        document.getElementById('rtspUrl').value = config.rtspUrl || 'rtsp://192.168.144.68:554/stream1';
        document.getElementById('username').value = config.username || 'admin';
        document.getElementById('password').value = config.password || 'marsaero123@';
    } else {
        // Use defaults requested by user
        document.getElementById('cameraIp').value = '192.168.144.68';
        document.getElementById('httpPort').value = '80';
        document.getElementById('rtspUrl').value = 'rtsp://192.168.144.68:554/stream1';
        document.getElementById('username').value = 'admin';
        document.getElementById('password').value = 'marsaero123@';
    }
}

/**
 * Load recent configurations
 */
function loadRecentConfigs() {
    const recentConfigs = JSON.parse(localStorage.getItem('recentConfigs') || '[]');
    const configList = document.getElementById('configList');
    
    if (recentConfigs.length === 0) {
        configList.innerHTML = '<p style="color: var(--text-gray); text-align: center;">No recent configurations</p>';
        return;
    }
    
    configList.innerHTML = '';
    recentConfigs.slice(0, 3).forEach((config, index) => {
        const item = document.createElement('div');
        item.className = 'config-item';
        item.innerHTML = `
            <div>
                <strong>${config.cameraIp}</strong>
                <small style="color: var(--text-gray); display: block;">${config.rtspUrl}</small>
            </div>
            <button onclick="loadConfig(${index})" style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                Load
            </button>
        `;
        configList.appendChild(item);
    });
}

/**
 * Load a specific configuration
 */
function loadConfig(index) {
    const recentConfigs = JSON.parse(localStorage.getItem('recentConfigs') || '[]');
    if (recentConfigs[index]) {
        const config = recentConfigs[index];
        
        document.getElementById('cameraIp').value = config.cameraIp;
        document.getElementById('httpPort').value = config.httpPort;
        document.getElementById('rtspUrl').value = config.rtspUrl;
        document.getElementById('username').value = config.username;
        document.getElementById('password').value = config.password;
        
        showStatusMessage('Configuration loaded', 'info');
    }
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

/**
 * Test camera connection
 */
async function testConnection() {
    const config = getFormData();
    
    showStatusMessage('Testing connection...', 'info');
    
    try {
        // Try to connect via backend API
        const response = await fetch('http://localhost:4000/api/test-connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        });
        
        if (response.ok) {
            const result = await response.json();
            showStatusMessage('✅ Connection successful!', 'success');
        } else {
            showStatusMessage('⚠️ Connection test unavailable (backend not running)', 'info');
        }
    } catch (error) {
        console.log('Backend not available, skipping connection test');
        showStatusMessage('⚠️ Connection test unavailable (backend not running). You can still proceed to viewer.', 'info');
    }
}

/**
 * Handle form submission
 */
document.getElementById('cameraConfigForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const config = getFormData();
    
    // Validate form
    if (!validateConfig(config)) {
        showStatusMessage('❌ Please fill in all required fields correctly', 'error');
        return;
    }
    
    // Save configuration
    saveConfiguration(config);
    
    // Navigate to viewer
    showStatusMessage('✅ Configuration saved. Redirecting to viewer...', 'success');
    
    setTimeout(() => {
        window.location.href = 'viewer.html';
    }, 1000);
});

/**
 * Get form data
 */
function getFormData() {
    return {
        cameraIp: document.getElementById('cameraIp').value.trim(),
        httpPort: document.getElementById('httpPort').value.trim(),
        rtspUrl: document.getElementById('rtspUrl').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };
}

/**
 * Validate configuration
 */
function validateConfig(config) {
    // Validate IP address format
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(config.cameraIp)) {
        return false;
    }
    
    // Validate port
    const port = parseInt(config.httpPort);
    if (isNaN(port) || port < 1 || port > 65535) {
        return false;
    }
    
    // Validate RTSP URL
    if (!config.rtspUrl.startsWith('rtsp://')) {
        return false;
    }
    
    // Validate username and password
    if (!config.username || !config.password) {
        return false;
    }
    
    return true;
}

/**
 * Save configuration to localStorage
 */
function saveConfiguration(config) {
    // Save current configuration
    localStorage.setItem('cameraConfig', JSON.stringify(config));
    
    // Add to recent configurations
    let recentConfigs = JSON.parse(localStorage.getItem('recentConfigs') || '[]');
    
    // Remove duplicate if exists
    recentConfigs = recentConfigs.filter(c => c.cameraIp !== config.cameraIp || c.rtspUrl !== config.rtspUrl);
    
    // Add to beginning
    recentConfigs.unshift({
        cameraIp: config.cameraIp,
        httpPort: config.httpPort,
        rtspUrl: config.rtspUrl,
        username: config.username,
        password: config.password,
        timestamp: Date.now()
    });
    
    // Keep only last 5
    recentConfigs = recentConfigs.slice(0, 5);
    
    localStorage.setItem('recentConfigs', JSON.stringify(recentConfigs));
}

/**
 * Show status message
 */
function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

/**
 * Go back to welcome page
 */
function goBack() {
    window.location.href = 'index.html';
}

// Auto-fill RTSP URL when IP changes
document.getElementById('cameraIp').addEventListener('blur', () => {
    const ip = document.getElementById('cameraIp').value.trim();
    const rtspUrl = document.getElementById('rtspUrl').value.trim();
    
    if (ip && !rtspUrl) {
        // Suggest a common RTSP URL format
        document.getElementById('rtspUrl').value = `rtsp://${ip}:554/stream1`;
    }
});
