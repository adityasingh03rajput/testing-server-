#!/usr/bin/env node

/**
 * Render Deployment Test Script
 * Tests all critical endpoints after deployment
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'https://letsbunk-server.onrender.com';
const TIMEOUT = 30000; // 30 seconds timeout for Render cold starts

// Test endpoints
const endpoints = [
    { name: 'Health Check', path: '/api/health', method: 'GET' },
    { name: 'Config API', path: '/api/config', method: 'GET' },
    { name: 'Students API', path: '/api/students', method: 'GET' },
    { name: 'Teachers API', path: '/api/teachers', method: 'GET' },
    { name: 'Server Time', path: '/api/time', method: 'GET' }
];

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint) {
    const url = `${BASE_URL}${endpoint.path}`;
    const startTime = Date.now();
    
    try {
        log(`Testing ${endpoint.name}...`, 'blue');
        
        const response = await axios({
            method: endpoint.method,
            url: url,
            timeout: TIMEOUT,
            validateStatus: () => true // Don't throw on HTTP errors
        });
        
        const duration = Date.now() - startTime;
        const status = response.status;
        
        if (status >= 200 && status < 300) {
            log(`✅ ${endpoint.name}: ${status} (${duration}ms)`, 'green');
            
            // Log response size
            const responseSize = JSON.stringify(response.data).length;
            log(`   Response size: ${responseSize} bytes`, 'blue');
            
            // Log specific data for key endpoints
            if (endpoint.path === '/api/health') {
                log(`   Status: ${response.data.status}`, 'blue');
                log(`   Database: ${response.data.database}`, 'blue');
            } else if (endpoint.path === '/api/students') {
                log(`   Students count: ${response.data.students?.length || 0}`, 'blue');
            } else if (endpoint.path === '/api/teachers') {
                log(`   Teachers count: ${response.data.teachers?.length || 0}`, 'blue');
            }
            
            return { success: true, status, duration, size: responseSize };
        } else {
            log(`❌ ${endpoint.name}: ${status} (${duration}ms)`, 'red');
            log(`   Error: ${response.data?.error || 'Unknown error'}`, 'red');
            return { success: false, status, duration, error: response.data?.error };
        }
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error.code === 'ECONNABORTED') {
            log(`⏰ ${endpoint.name}: Timeout after ${duration}ms`, 'yellow');
            return { success: false, timeout: true, duration };
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            log(`🔌 ${endpoint.name}: Connection failed - Server not deployed yet?`, 'yellow');
            return { success: false, connection: false, error: error.message };
        } else {
            log(`❌ ${endpoint.name}: ${error.message} (${duration}ms)`, 'red');
            return { success: false, duration, error: error.message };
        }
    }
}

async function runTests() {
    log('🚀 Testing Render Deployment', 'bold');
    log(`📡 Base URL: ${BASE_URL}`, 'blue');
    log(`⏱️  Timeout: ${TIMEOUT/1000}s (for cold starts)`, 'blue');
    log('', 'reset');
    
    const results = [];
    let successCount = 0;
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push({ endpoint: endpoint.name, ...result });
        
        if (result.success) {
            successCount++;
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    log('', 'reset');
    log('📊 Test Summary:', 'bold');
    log(`✅ Successful: ${successCount}/${endpoints.length}`, successCount === endpoints.length ? 'green' : 'yellow');
    
    if (successCount === endpoints.length) {
        log('🎉 All tests passed! Deployment is successful.', 'green');
    } else {
        log('⚠️  Some tests failed. Check the logs above.', 'yellow');
    }
    
    // Performance summary
    const successfulTests = results.filter(r => r.success);
    if (successfulTests.length > 0) {
        const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
        log(`⚡ Average response time: ${Math.round(avgDuration)}ms`, 'blue');
    }
    
    log('', 'reset');
    log('🔗 Next Steps:', 'bold');
    log('1. Update mobile app server URLs to point to Render', 'blue');
    log('2. Test face recognition and WiFi features', 'blue');
    log('3. Monitor server performance in Render dashboard', 'blue');
    
    return successCount === endpoints.length;
}

// Run tests
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        log(`💥 Test runner error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runTests, testEndpoint };