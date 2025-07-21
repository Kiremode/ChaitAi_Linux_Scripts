const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const CONFIG = {
    PORT: 3000,
    BACKEND_PORT: 5001,
    PUBLIC_DIR: path.join(__dirname, 'public'),
    TIMEOUT: 30000,
    MIME_TYPES: {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    },
    BACKEND_ENDPOINTS: ['/api/', '/download-tool', '/models/', '/chat/', '/health', '/status'],
    CORS_HEADERS: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
};

class ProxyServer {
    constructor() {
        this.backendAvailable = false;
        this.server = null;
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return CONFIG.MIME_TYPES[ext] || 'text/plain';
    }

    async checkBackendHealth() {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: CONFIG.BACKEND_PORT,
                path: '/health',
                method: 'GET',
                timeout: 5000
            }, (res) => {
                resolve(res.statusCode === 200 || res.statusCode === 404);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }

    serveStaticFile(req, res, filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }

            const content = fs.readFileSync(filePath);
            const mimeType = this.getMimeType(filePath);
            
            res.writeHead(200, { 
                'Content-Type': mimeType,
                ...CONFIG.CORS_HEADERS
            });
            res.end(content);
        } catch (error) {
            console.error('Error serving file:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }

    createMockResponse(requestData) {
        return {
            success: true,
            message: `Mock installation of ${requestData.toolName || 'unknown tool'} completed`,
            status: 'installed',
            details: {
                tool: requestData.toolName || 'unknown',
                action: requestData.action || 'install',
                timestamp: new Date().toISOString(),
                note: 'Backend unavailable - using mock response'
            }
        };
    }

    handleMockDownloadTool(req, res, body) {
        console.log('Using mock download-tool endpoint');
        
        try {
            const requestData = JSON.parse(body || '{}');
            const mockResponse = this.createMockResponse(requestData);
            
            res.writeHead(200, {
                'Content-Type': 'application/json',
                ...CONFIG.CORS_HEADERS
            });
            res.end(JSON.stringify(mockResponse, null, 2));
            
        } catch (error) {
            res.writeHead(400, {
                'Content-Type': 'application/json',
                ...CONFIG.CORS_HEADERS
            });
            res.end(JSON.stringify({
                error: 'Invalid JSON in request',
                details: error.message
            }));
        }
    }

    async proxyRequest(req, res) {
        const isDownloadTool = req.url.includes('download-tool');
        console.log(`Proxying ${req.method} ${req.url}`);

        // Collect request body
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }

        // Check backend availability for download-tool requests
        if (isDownloadTool && !this.backendAvailable) {
            const isAlive = await this.checkBackendHealth();
            if (!isAlive) {
                console.log('Backend unavailable, using mock response');
                this.handleMockDownloadTool(req, res, body);
                return;
            }
        }

        // Proxy to backend
        const options = {
            hostname: 'localhost',
            port: CONFIG.BACKEND_PORT,
            path: req.url,
            method: req.method,
            headers: {
                ...req.headers,
                'host': `localhost:${CONFIG.BACKEND_PORT}`,
                'content-length': Buffer.byteLength(body)
            },
            timeout: CONFIG.TIMEOUT
        };

        const proxyReq = http.request(options, (proxyRes) => {
            // Handle backend errors for download-tool
            if (proxyRes.statusCode >= 500 && isDownloadTool) {
                console.log('Backend error, switching to mock mode');
                this.handleMockDownloadTool(req, res, body);
                return;
            }

            // Forward response
            const headers = {
                ...proxyRes.headers,
                ...CONFIG.CORS_HEADERS
            };
            
            res.writeHead(proxyRes.statusCode, headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy error:', error.message);
            
            if (isDownloadTool) {
                this.handleMockDownloadTool(req, res, body);
            } else {
                res.writeHead(502, { 
                    'Content-Type': 'application/json',
                    ...CONFIG.CORS_HEADERS
                });
                res.end(JSON.stringify({ 
                    error: 'Backend connection failed',
                    details: error.message
                }));
            }
        });

        proxyReq.on('timeout', () => {
            console.error('Backend timeout');
            proxyReq.destroy();
            
            if (isDownloadTool) {
                this.handleMockDownloadTool(req, res, body);
            } else {
                res.writeHead(504, { 
                    'Content-Type': 'application/json',
                    ...CONFIG.CORS_HEADERS
                });
                res.end(JSON.stringify({ error: 'Backend timeout' }));
            }
        });

        if (body) {
            proxyReq.write(body);
        }
        proxyReq.end();
    }

    shouldProxy(pathname) {
        return CONFIG.BACKEND_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
    }

    handleRequest(req, res) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            console.log(`${req.method} ${url.pathname}`);
            
            // Handle CORS preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(200, CONFIG.CORS_HEADERS);
                res.end();
                return;
            }
            
            // Proxy backend requests
            if (this.shouldProxy(url.pathname)) {
                this.proxyRequest(req, res);
                return;
            }
            
            // Serve static files
            let staticPath;
            if (url.pathname === '/' || url.pathname === '/index.html') {
                staticPath = path.join(CONFIG.PUBLIC_DIR, 'index.html');
            } else {
                staticPath = path.join(CONFIG.PUBLIC_DIR, url.pathname);
            }
            
            // Check if file exists
            if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
                this.serveStaticFile(req, res, staticPath);
            } else {
                // SPA fallback - serve index.html
                const indexPath = path.join(CONFIG.PUBLIC_DIR, 'index.html');
                if (fs.existsSync(indexPath)) {
                    this.serveStaticFile(req, res, indexPath);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            }
        } catch (error) {
            console.error('Server error:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }

    async start() {
        console.log('Checking backend availability...');
        this.backendAvailable = await this.checkBackendHealth();
        
        if (!this.backendAvailable) {
            console.log('Warning: Backend server not responding - mock mode enabled');
        } else {
            console.log('Backend server is available');
        }
        
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        this.server.listen(CONFIG.PORT, () => {
            console.log(`ChatAI Proxy Server running at http://localhost:${CONFIG.PORT}`);
            console.log(`Proxying to backend: http://localhost:${CONFIG.BACKEND_PORT}`);
            console.log(`Serving static files from: ${CONFIG.PUBLIC_DIR}`);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down proxy server...');
            this.server.close(() => {
                console.log('Proxy server stopped');
                process.exit(0);
            });
        });
    }
}

// Start the server
const proxyServer = new ProxyServer();
proxyServer.start();