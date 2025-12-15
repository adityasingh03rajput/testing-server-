package com.countdowntimer.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WifiModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context: Context = reactContext
    private val wifiManager: WifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    private val connectivityManager: ConnectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    override fun getName(): String {
        return "WifiModule"
    }

    @ReactMethod
    fun getBSSID(promise: Promise) {
        try {
            // Check if WiFi is enabled
            if (!wifiManager.isWifiEnabled) {
                val error = WritableNativeMap()
                error.putString("code", "WIFI_DISABLED")
                error.putString("message", "WiFi is disabled on device")
                promise.reject("WIFI_DISABLED", "WiFi is disabled", error)
                return
            }

            // Check location permissions (required for BSSID access on Android 6+)
            if (!hasLocationPermission()) {
                val error = WritableNativeMap()
                error.putString("code", "PERMISSION_DENIED")
                error.putString("message", "Location permission required for BSSID access")
                promise.reject("PERMISSION_DENIED", "Location permission required", error)
                return
            }

            // Get WiFi info
            val wifiInfo = wifiManager.connectionInfo
            
            if (wifiInfo == null) {
                val error = WritableNativeMap()
                error.putString("code", "NO_WIFI_INFO")
                error.putString("message", "Unable to get WiFi connection info")
                promise.reject("NO_WIFI_INFO", "No WiFi info available", error)
                return
            }

            // Get BSSID
            val bssid = wifiInfo.bssid
            
            if (bssid == null || bssid == "02:00:00:00:00:00" || bssid == "<unknown ssid>") {
                val error = WritableNativeMap()
                error.putString("code", "NO_BSSID")
                error.putString("message", "No BSSID available - not connected to WiFi or permission denied")
                promise.reject("NO_BSSID", "BSSID not available", error)
                return
            }

            // Create result object
            val result = WritableNativeMap()
            result.putString("bssid", bssid)
            result.putString("ssid", wifiInfo.ssid?.replace("\"", "") ?: "Unknown")
            result.putInt("rssi", wifiInfo.rssi)
            result.putInt("linkSpeed", wifiInfo.linkSpeed)
            result.putInt("frequency", wifiInfo.frequency)
            result.putString("macAddress", wifiInfo.macAddress ?: "Unknown")
            result.putInt("networkId", wifiInfo.networkId)
            result.putBoolean("success", true)

            promise.resolve(result)

        } catch (e: Exception) {
            val error = WritableNativeMap()
            error.putString("code", "UNKNOWN_ERROR")
            error.putString("message", e.message ?: "Unknown error occurred")
            promise.reject("UNKNOWN_ERROR", e.message, error)
        }
    }

    @ReactMethod
    fun getWifiState(promise: Promise) {
        try {
            val result = WritableNativeMap()
            result.putBoolean("isWifiEnabled", wifiManager.isWifiEnabled)
            result.putBoolean("hasLocationPermission", hasLocationPermission())
            
            // Check if connected to WiFi
            var isConnectedToWifi = false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork
                val capabilities = connectivityManager.getNetworkCapabilities(network)
                isConnectedToWifi = capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                isConnectedToWifi = networkInfo?.type == ConnectivityManager.TYPE_WIFI && networkInfo.isConnected
            }
            
            result.putBoolean("isConnectedToWifi", isConnectedToWifi)
            result.putBoolean("success", true)
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            val error = WritableNativeMap()
            error.putString("code", "WIFI_STATE_ERROR")
            error.putString("message", e.message ?: "Failed to get WiFi state")
            promise.reject("WIFI_STATE_ERROR", e.message, error)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val result = WritableNativeMap()
            
            result.putBoolean("ACCESS_FINE_LOCATION", hasPermission(Manifest.permission.ACCESS_FINE_LOCATION))
            result.putBoolean("ACCESS_COARSE_LOCATION", hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION))
            result.putBoolean("ACCESS_WIFI_STATE", hasPermission(Manifest.permission.ACCESS_WIFI_STATE))
            result.putBoolean("CHANGE_WIFI_STATE", hasPermission(Manifest.permission.CHANGE_WIFI_STATE))
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun testConnection(promise: Promise) {
        try {
            val result = WritableNativeMap()
            result.putString("module", "WifiModule")
            result.putString("version", "1.0.0")
            result.putBoolean("success", true)
            result.putString("message", "Native WiFi module is working correctly")
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("TEST_ERROR", e.message)
        }
    }

    private fun hasLocationPermission(): Boolean {
        return hasPermission(Manifest.permission.ACCESS_FINE_LOCATION) || 
               hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
    }

    private fun hasPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }
}