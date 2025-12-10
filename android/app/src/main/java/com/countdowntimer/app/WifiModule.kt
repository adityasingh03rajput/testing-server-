package com.countdowntimer.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WifiModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WifiModule"
    }

    @ReactMethod
    fun getBSSID(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // Check if we have the required permissions
            if (!hasLocationPermission()) {
                promise.reject("PERMISSION_DENIED", "Location permission is required to access BSSID")
                return
            }

            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            
            // Check if WiFi is enabled
            if (!wifiManager.isWifiEnabled) {
                promise.reject("WIFI_DISABLED", "WiFi is not enabled")
                return
            }

            val wifiInfo = wifiManager.connectionInfo
            
            if (wifiInfo == null) {
                promise.reject("NO_WIFI_INFO", "Could not get WiFi connection info")
                return
            }

            val bssid = wifiInfo.bssid
            val ssid = wifiInfo.ssid
            
            if (bssid == null || bssid == "02:00:00:00:00:00" || bssid == "<unknown ssid>") {
                promise.reject("NO_BSSID", "BSSID not available - may need location permission or WiFi not connected")
                return
            }

            // Create result object with detailed WiFi info
            val result = Arguments.createMap().apply {
                putString("bssid", bssid.lowercase())
                putString("ssid", ssid?.replace("\"", "") ?: "unknown")
                putInt("rssi", wifiInfo.rssi)
                putInt("linkSpeed", wifiInfo.linkSpeed)
                putInt("frequency", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) wifiInfo.frequency else -1)
                putString("macAddress", wifiInfo.macAddress ?: "unknown")
                putInt("networkId", wifiInfo.networkId)
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("WIFI_ERROR", "Error getting WiFi info: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getWifiState(promise: Promise) {
        try {
            val context = reactApplicationContext
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            
            val result = Arguments.createMap().apply {
                putBoolean("isWifiEnabled", wifiManager.isWifiEnabled)
                putBoolean("hasLocationPermission", hasLocationPermission())
                putString("androidVersion", Build.VERSION.RELEASE)
                putInt("sdkVersion", Build.VERSION.SDK_INT)
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("WIFI_STATE_ERROR", "Error getting WiFi state: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestLocationPermission(promise: Promise) {
        try {
            if (hasLocationPermission()) {
                promise.resolve(true)
                return
            }
            
            // We can't directly request permissions from a native module
            // The JavaScript side needs to handle permission requests
            val result = Arguments.createMap().apply {
                putBoolean("hasPermission", false)
                putString("message", "Location permission required. Please request from JavaScript side.")
                putArray("requiredPermissions", Arguments.createArray().apply {
                    pushString(Manifest.permission.ACCESS_FINE_LOCATION)
                    pushString(Manifest.permission.ACCESS_COARSE_LOCATION)
                })
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Error checking permissions: ${e.message}", e)
        }
    }

    private fun hasLocationPermission(): Boolean {
        val context = reactApplicationContext
        
        val fineLocation = ContextCompat.checkSelfPermission(
            context, 
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val coarseLocation = ContextCompat.checkSelfPermission(
            context, 
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        return fineLocation || coarseLocation
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            val result = Arguments.createMap().apply {
                putBoolean("ACCESS_FINE_LOCATION", ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED)
                
                putBoolean("ACCESS_COARSE_LOCATION", ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED)
                
                putBoolean("ACCESS_WIFI_STATE", ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_WIFI_STATE
                ) == PackageManager.PERMISSION_GRANTED)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    putBoolean("ACCESS_BACKGROUND_LOCATION", ContextCompat.checkSelfPermission(
                        context, Manifest.permission.ACCESS_BACKGROUND_LOCATION
                    ) == PackageManager.PERMISSION_GRANTED)
                }
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", "Error checking permissions: ${e.message}", e)
        }
    }
}