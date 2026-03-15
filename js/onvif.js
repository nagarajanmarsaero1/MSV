/**
 * ONVIF SOAP Protocol Client
 * Handles ONVIF camera communication and PTZ control
 */

class ONVIFClient {
    constructor(cameraConfig) {
        this.ip = cameraConfig.cameraIp;
        this.port = cameraConfig.httpPort || 80;
        this.username = cameraConfig.username;
        this.password = cameraConfig.password;
        this.serviceUrl = `http://${this.ip}:${this.port}/onvif/device_service`;
        this.ptzUrl = `http://${this.ip}:${this.port}/onvif/ptz`;
        this.mediaUrl = `http://${this.ip}:${this.port}/onvif/media`;
        this.profileToken = null;
    }

    /**
     * Generate WS-Security header for SOAP authentication
     */
    generateSecurityHeader() {
        const created = new Date().toISOString();
        const nonce = this.generateNonce();
        const nonceBase64 = btoa(nonce);
        
        // Generate password digest: Base64(SHA1(nonce + created + password))
        const digest = this.generatePasswordDigest(nonce, created, this.password);
        
        return `
            <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
                           xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken>
                    <wsse:Username>${this.username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${digest}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonceBase64}</wsse:Nonce>
                    <wsu:Created>${created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        `;
    }

    /**
     * Generate random nonce for authentication
     */
    generateNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        for (let i = 0; i < 16; i++) {
            nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return nonce;
    }

    /**
     * Generate password digest for WS-Security
     */
    async generatePasswordDigest(nonce, created, password) {
        const message = nonce + created + password;
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
        return hashBase64;
    }

    /**
     * Send SOAP request to ONVIF service
     */
    async sendSOAPRequest(url, body) {
        const securityHeader = this.generateSecurityHeader();
        
        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
            <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
                        xmlns:tds="http://www.onvif.org/ver10/device/wsdl"
                        xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl"
                        xmlns:tt="http://www.onvif.org/ver10/schema">
                <s:Header>
                    ${securityHeader}
                </s:Header>
                <s:Body>
                    ${body}
                </s:Body>
            </s:Envelope>`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                },
                body: envelope
            });

            const text = await response.text();
            return this.parseSOAPResponse(text);
        } catch (error) {
            console.error('SOAP request failed:', error);
            throw error;
        }
    }

    /**
     * Parse SOAP XML response
     */
    parseSOAPResponse(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for SOAP fault
        const fault = xmlDoc.querySelector('Fault');
        if (fault) {
            const faultString = fault.querySelector('Reason Text')?.textContent || 'Unknown error';
            throw new Error(`SOAP Fault: ${faultString}`);
        }
        
        return xmlDoc;
    }

    /**
     * Get device information
     */
    async getDeviceInformation() {
        const body = `<tds:GetDeviceInformation/>`;
        return await this.sendSOAPRequest(this.serviceUrl, body);
    }

    /**
     * Get media profiles
     */
    async getProfiles() {
        const body = `<trt:GetProfiles xmlns:trt="http://www.onvif.org/ver10/media/wsdl"/>`;
        const response = await this.sendSOAPRequest(this.mediaUrl, body);
        
        // Extract profile token
        const profile = response.querySelector('Profiles');
        if (profile) {
            this.profileToken = profile.getAttribute('token');
        }
        
        return response;
    }

    /**
     * PTZ Continuous Move - Zoom In
     */
    async zoomIn(speed = 0.5) {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <tptz:ContinuousMove>
                <tptz:ProfileToken>${this.profileToken}</tptz:ProfileToken>
                <tptz:Velocity>
                    <tt:Zoom x="${speed}" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                </tptz:Velocity>
            </tptz:ContinuousMove>
        `;

        return await this.sendSOAPRequest(this.ptzUrl, body);
    }

    /**
     * PTZ Continuous Move - Zoom Out
     */
    async zoomOut(speed = 0.5) {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <tptz:ContinuousMove>
                <tptz:ProfileToken>${this.profileToken}</tptz:ProfileToken>
                <tptz:Velocity>
                    <tt:Zoom x="${-speed}" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                </tptz:Velocity>
            </tptz:ContinuousMove>
        `;

        return await this.sendSOAPRequest(this.ptzUrl, body);
    }

    /**
     * PTZ Stop - Stop all movements including zoom
     */
    async stop() {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <tptz:Stop>
                <tptz:ProfileToken>${this.profileToken}</tptz:ProfileToken>
                <tptz:PanTilt>true</tptz:PanTilt>
                <tptz:Zoom>true</tptz:Zoom>
            </tptz:Stop>
        `;

        return await this.sendSOAPRequest(this.ptzUrl, body);
    }

    /**
     * PTZ Continuous Move - Pan and Tilt
     */
    async move(panSpeed = 0, tiltSpeed = 0, zoomSpeed = 0) {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <tptz:ContinuousMove>
                <tptz:ProfileToken>${this.profileToken}</tptz:ProfileToken>
                <tptz:Velocity>
                    <tt:PanTilt x="${panSpeed}" y="${tiltSpeed}" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                    <tt:Zoom x="${zoomSpeed}" xmlns:tt="http://www.onvif.org/ver10/schema"/>
                </tptz:Velocity>
            </tptz:ContinuousMove>
        `;

        return await this.sendSOAPRequest(this.ptzUrl, body);
    }

    /**
     * Get PTZ Status
     */
    async getStatus() {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <tptz:GetStatus>
                <tptz:ProfileToken>${this.profileToken}</tptz:ProfileToken>
            </tptz:GetStatus>
        `;

        return await this.sendSOAPRequest(this.ptzUrl, body);
    }

    /**
     * Get Stream URI
     */
    async getStreamUri() {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <trt:GetStreamUri xmlns:trt="http://www.onvif.org/ver10/media/wsdl">
                <trt:StreamSetup>
                    <tt:Stream>RTP-Unicast</tt:Stream>
                    <tt:Transport>
                        <tt:Protocol>RTSP</tt:Protocol>
                    </tt:Transport>
                </trt:StreamSetup>
                <trt:ProfileToken>${this.profileToken}</trt:ProfileToken>
            </trt:GetStreamUri>
        `;

        return await this.sendSOAPRequest(this.mediaUrl, body);
    }

    /**
     * Get Snapshot URI
     */
    async getSnapshotUri() {
        if (!this.profileToken) {
            await this.getProfiles();
        }

        const body = `
            <trt:GetSnapshotUri xmlns:trt="http://www.onvif.org/ver10/media/wsdl">
                <trt:ProfileToken>${this.profileToken}</trt:ProfileToken>
            </trt:GetSnapshotUri>
        `;

        return await this.sendSOAPRequest(this.mediaUrl, body);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ONVIFClient;
}
