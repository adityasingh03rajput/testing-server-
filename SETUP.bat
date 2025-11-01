@echo off
title College Attendance System - Complete Setup
color 0A

echo ========================================
echo   COLLEGE ATTENDANCE SYSTEM SETUP
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

:: Check if MongoDB is installed
echo [2/6] Checking MongoDB installation...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB is not installed or not in PATH!
    echo Please install MongoDB from https://w