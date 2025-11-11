#!/bin/bash

echo "🔍 Testing Render Deployment Status..."
echo ""

# Test 1: Check if server is up
echo "Test 1: Server Health Check"
curl -s https://google-8j5x.onrender.com/api/health
echo ""
echo ""

# Test 2: Check if axios is available (will fail if old code)
echo "Test 2: Check Server Version"
echo "Looking for Cloudinary upload messages in recent activity..."
echo "(This would require checking Render logs manually)"
echo ""

# Test 3: Try to get students
echo "Test 3: Get Students List"
curl -s https://google-8j5x.onrender.com/api/students | head -c 200
echo "..."
echo ""

echo ""
echo "📊 Summary:"
echo "- If server responds, it's running"
echo "- Check Render dashboard logs for:"
echo "  ✅ '☁️  Uploading to Cloudinary...' = NEW CODE"
echo "  ❌ '✅ Photo saved: student_xxx.jpg' = OLD CODE"
