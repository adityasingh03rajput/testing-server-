#!/usr/bin/env node

/**
 * List All API Endpoints - Azure Server
 * 
 * This script discovers and lists all available API endpoints from the Azure server.
 * 
 * Usage: node list-azure-endpoints.js
 */

const axios = require('axios');

// Azure Server URL
const BASE_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function getMethodColor(method) {
    switch (method) {
        case 'GET': return 'green';
        case 'POST': return 'yellow';
        case 'PUT': return 'blue';
        case 'DELETE': return 'red';
        default: return 'white';
    }
}

async function testEndpoint(path, method = 'GET') {
    try {
        const url = `${BASE_URL}${path}`;
        console.log(colorize(`   Testing: ${method} ${path}`, 'dim'));
        
        let response;
        switch (method.toLowerCase()) {
            case 'get':
                response = await axios.get(url, { timeout: 10000 });
                break;
            case 'post':
                response = await axios.post(url, {}, { timeout: 10000 });
                break;
            case 'put':
                response = await axios.put(url, {}, { timeout: 10000 });
                break;
            case 'delete':
                response = await axios.delete(url, { timeout: 10000 });
                break;
            default:
                response = await axios.get(url, { timeout: 10000 });
        }
        
        return { 
            status: response.status, 
            success: true, 
            data: response.data,
            headers: response.headers
        };
    } catch (error) {
        if (error.response) {
            return { 
                status: error.response.status, 
                success: false,
                data: error.response.data,
                headers: error.response.headers
            };
        }
        return { 
            status: 'ERROR', 
            success: false, 
            reason: error.message 
        };
    }
}

async function discoverEndpoints() {
    console.log(colorize('\n🔍 Discovering API Endpoints...', 'bright'));
    
    const discoveredEndpoints = [];
    
    // Common API endpoint patterns to test
    const commonPaths = [
        '/',
        '/api',
        '/api/health',
        '/api/status',
        '/api/info',
        '/api/version',
        '/api/config',
        '/api/time',
        '/health',
        '/status',
        '/info',
        '/version',
        '/ping',
        '/docs',
        '/swagger',
        '/api-docs',
        '/openapi.json',
        '/swagger.json',
        '/api/v1',
        '/api/v2',
        '/api/users',
        '/api/auth',
        '/api/login',
        '/api/register',
        '/api/data',
        '/api/search',
        '/api/list',
        '/api/get',
        '/api/post',
        '/api/update',
        '/api/delete',
        '/robots.txt',
        '/sitemap.xml',
        '/favicon.ico'
    ];
    
    console.log(colorize(`Testing ${commonPaths.length} common endpoint patterns...`, 'cyan'));
    
    for (const path of commonPaths) {
        const result = await testEndpoint(path);
        
        if (result.success || (result.status >= 200 && result.status < 500)) {
            const statusColor = result.success ? 'green' : 
                               result.status >= 400 ? 'yellow' : 'green';
            
            console.log(`   ${colorize('✓', 'green')} ${colorize('GET'.padEnd(6), 'green')} ${path.padEnd(30)} ${colorize(result.status, statusColor)}`);
            
            discoveredEndpoints.push({
                method: 'GET',
                path: path,
                status: result.status,
                success: result.success,
                data: result.data,
                headers: result.headers
            });
            
            // If we get JSON response, try to extract more endpoints
            if (result.data && typeof result.data === 'object') {
                console.log(colorize(`      Response type: ${typeof result.data}`, 'dim'));
                if (Array.isArray(result.data)) {
                    console.log(colorize(`      Array with ${result.data.length} items`, 'dim'));
                } else {
                    const keys = Object.keys(result.data);
                    console.log(colorize(`      Object with keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`, 'dim'));
                }
            }
        } else {
            console.log(`   ${colorize('✗', 'red')} ${colorize('GET'.padEnd(6), 'green')} ${path.padEnd(30)} ${colorize(result.status || 'ERROR', 'red')}`);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return discoveredEndpoints;
}

async function analyzeServer() {
    console.log(colorize('\n📊 Analyzing Server Response...', 'bright'));
    
    // Test root endpoint for server info
    const rootResult = await testEndpoint('/');
    if (rootResult.success && rootResult.data) {
        console.log(colorize('Root endpoint response:', 'cyan'));
        console.log(JSON.stringify(rootResult.data, null, 2));
    }
    
    // Check for common API documentation endpoints
    const docEndpoints = ['/docs', '/api-docs', '/swagger', '/openapi.json'];
    for (const endpoint of docEndpoints) {
        const result = await testEndpoint(endpoint);
        if (result.success) {
            console.log(colorize(`\n📚 Found documentation at: ${endpoint}`, 'green'));
            if (result.data && typeof result.data === 'object') {
                console.log('Documentation preview:');
                console.log(JSON.stringify(result.data, null, 2).substring(0, 500) + '...');
            }
        }
    }
    
    // Check server headers for additional info
    const healthResult = await testEndpoint('/api/health');
    if (healthResult.headers) {
        console.log(colorize('\n🔧 Server Headers:', 'cyan'));
        const interestingHeaders = ['server', 'x-powered-by', 'content-type', 'x-api-version'];
        interestingHeaders.forEach(header => {
            if (healthResult.headers[header]) {
                console.log(`   ${header}: ${healthResult.headers[header]}`);
            }
        });
    }
}

async function main() {
    console.log(colorize('\n🌐 AZURE SERVER ENDPOINT DISCOVERY', 'bright'));
    console.log(colorize(`📍 Server: ${BASE_URL}`, 'cyan'));
    console.log('='.repeat(80));

    // Test server connectivity first
    console.log(colorize('\n🔍 Testing Server Connectivity...', 'bright'));
    try {
        const connectivityTest = await testEndpoint('/');
        if (connectivityTest.success || connectivityTest.status < 500) {
            console.log(colorize(`✅ Server is reachable! Status: ${connectivityTest.status}`, 'green'));
            if (connectivityTest.data) {
                console.log(colorize(`📋 Response preview: ${JSON.stringify(connectivityTest.data).substring(0, 200)}...`, 'dim'));
            }
        } else {
            console.log(colorize(`⚠️  Server responded with status: ${connectivityTest.status}`, 'yellow'));
        }
    } catch (error) {
        console.log(colorize(`❌ Server connectivity issue: ${error.message}`, 'red'));
        console.log(colorize('⚠️  Continuing with endpoint discovery...', 'yellow'));
    }

    // Discover endpoints
    const discoveredEndpoints = await discoverEndpoints();
    
    // Analyze server
    await analyzeServer();
    
    // Summary
    console.log(colorize('\n📈 DISCOVERY SUMMARY', 'bright'));
    console.log('='.repeat(40));
    console.log(`🌐 Server URL: ${BASE_URL}`);
    console.log(`📊 Discovered Endpoints: ${discoveredEndpoints.length}`);
    
    if (discoveredEndpoints.length > 0) {
        console.log(colorize('\n📋 Working Endpoints:', 'bright'));
        discoveredEndpoints.forEach(endpoint => {
            const statusColor = endpoint.success ? 'green' : 'yellow';
            console.log(`   ${colorize(endpoint.method, getMethodColor(endpoint.method))} ${endpoint.path.padEnd(30)} ${colorize(endpoint.status, statusColor)}`);
        });
        
        // Group by status
        const statusGroups = {};
        discoveredEndpoints.forEach(ep => {
            const status = ep.status.toString();
            if (!statusGroups[status]) statusGroups[status] = 0;
            statusGroups[status]++;
        });
        
        console.log(colorize('\n📊 Status Code Distribution:', 'bright'));
        Object.entries(statusGroups).forEach(([status, count]) => {
            const color = status.startsWith('2') ? 'green' : 
                         status.startsWith('3') ? 'blue' :
                         status.startsWith('4') ? 'yellow' : 'red';
            console.log(`   ${colorize(status, color)}: ${count} endpoint${count !== 1 ? 's' : ''}`);
        });
    } else {
        console.log(colorize('❌ No working endpoints discovered', 'red'));
        console.log(colorize('💡 The server might be down, require authentication, or use non-standard paths', 'yellow'));
    }

    console.log(colorize('\n✅ Endpoint discovery complete!', 'green'));
    
    // Save results to file
    const results = {
        serverUrl: BASE_URL,
        timestamp: new Date().toISOString(),
        discoveredEndpoints: discoveredEndpoints,
        summary: {
            totalEndpoints: discoveredEndpoints.length,
            workingEndpoints: discoveredEndpoints.filter(ep => ep.success).length,
            statusDistribution: discoveredEndpoints.reduce((acc, ep) => {
                const status = ep.status.toString();
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {})
        }
    };
    
    require('fs').writeFileSync('azure-endpoints-discovery.json', JSON.stringify(results, null, 2));
    console.log(colorize('💾 Results saved to: azure-endpoints-discovery.json', 'cyan'));
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error(colorize(`❌ Error: ${error.message}`, 'red'));
        process.exit(1);
    });
}

module.exports = { BASE_URL, testEndpoint };