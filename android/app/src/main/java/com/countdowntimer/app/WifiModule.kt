package com.countdowntimer.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
<<<<<<< HEAD
import android.net.wifi.WifiManager
=======
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.net.wifi.WifiNetworkSpecifier
>>>>>>> origin/main
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
<<<<<<< HEAD
=======
import java.lang.reflect.Method
>>>>>>> origin/main

class WifiModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WifiModule"
    }

    @ReactMethod
    fun getBSSID(promise: Promise) {
        try {
            val context = reactApplicationContext
            
<<<<<<< HEAD
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

=======
            // Enhanced permission check for Android 13+ and MIUI
            if (!hasEnhancedLocationPermission()) {
                val permissionDetails = getPermissionDetails()
                promise.reject("PERMISSION_DENIED", 
                    "Enhanced location permission required for BSSID access on Android ${Build.VERSION.SDK_INT}. Details: $permissionDetails")
                return
            }

            // Multiple methods to get BSSID for different Android versions and OEMs
            val bssidResult = getBSSIDMultipleWays()
            
            if (bssidResult.success) {
                promise.resolve(bssidResult.data)
            } else {
                promise.reject("BSSID_FETCH_FAILED", bssidResult.error)
            }
            
        } catch (e: Exception) {
            promise.reject("WIFI_ERROR", "Critical error getting WiFi info: ${e.message}", e)
        }
    }

    /**
     * Enhanced BSSID fetching with multiple fallback methods
     * Specifically handles Android 13+ and MIUI restrictions
     */
    private fun getBSSIDMultipleWays(): BSSIDResult {
        val context = reactApplicationContext
        
        // Method 1: Standard WifiManager (works on older Android versions)
        try {
            val standardResult = getStandardBSSID(context)
            if (standardResult.success) {
                return standardResult
            }
        } catch (e: Exception) {
            // Continue to next method
        }

        // Method 2: ConnectivityManager approach (Android 10+)
        try {
            val connectivityResult = getConnectivityManagerBSSID(context)
            if (connectivityResult.success) {
                return connectivityResult
            }
        } catch (e: Exception) {
            // Continue to next method
        }

        // Method 3: Reflection-based approach (for MIUI and other OEMs)
        try {
            val reflectionResult = getReflectionBSSID(context)
            if (reflectionResult.success) {
                return reflectionResult
            }
        } catch (e: Exception) {
            // Continue to next method
        }

        // Method 4: Network callback approach (Android 11+)
        try {
            val callbackResult = getNetworkCallbackBSSID(context)
            if (callbackResult.success) {
                return callbackResult
            }
        } catch (e: Exception) {
            // All methods failed
        }

        return BSSIDResult(
            success = false,
            error = "All BSSID detection methods failed. Device: ${Build.MANUFACTURER} ${Build.MODEL}, Android: ${Build.VERSION.SDK_INT}, Security Patch: ${Build.VERSION.SECURITY_PATCH}",
            data = null
        )
    }

    /**
     * Method 1: Standard WifiManager approach
     */
    private fun getStandardBSSID(context: Context): BSSIDResult {
        val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        
        if (!wifiManager.isWifiEnabled) {
            return BSSIDResult(false, "WiFi is disabled", null)
        }

        val wifiInfo = wifiManager.connectionInfo ?: return BSSIDResult(false, "No WiFi connection info", null)
        
        val bssid = wifiInfo.bssid
        val ssid = wifiInfo.ssid
        
        if (bssid == null || bssid == "02:00:00:00:00:00" || bssid == "<unknown ssid>" || bssid.isEmpty()) {
            return BSSIDResult(false, "Standard method: BSSID not available", null)
        }

        val result = Arguments.createMap().apply {
            putString("bssid", bssid.lowercase())
            putString("ssid", ssid?.replace("\"", "") ?: "unknown")
            putInt("rssi", wifiInfo.rssi)
            putInt("linkSpeed", wifiInfo.linkSpeed)
            putInt("frequency", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) wifiInfo.frequency else -1)
            putString("macAddress", wifiInfo.macAddress ?: "unknown")
            putInt("networkId", wifiInfo.networkId)
            putString("method", "standard")
        }
        
        return BSSIDResult(true, null, result)
    }

    /**
     * Method 2: ConnectivityManager approach for Android 10+
     */
    private fun getConnectivityManagerBSSID(context: Context): BSSIDResult {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return BSSIDResult(false, "ConnectivityManager method requires Android 10+", null)
        }

        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork ?: return BSSIDResult(false, "No active network", null)
        
        val networkCapabilities = connectivityManager.getNetworkCapabilities(activeNetwork)
            ?: return BSSIDResult(false, "No network capabilities", null)
        
        if (!networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return BSSIDResult(false, "Active network is not WiFi", null)
        }

        // Try to get WiFi info from network capabilities
        try {
            val wifiInfo = networkCapabilities.transportInfo as? WifiInfo
            if (wifiInfo != null) {
                val bssid = wifiInfo.bssid
                if (bssid != null && bssid != "02:00:00:00:00:00" && bssid.isNotEmpty()) {
                    val result = Arguments.createMap().apply {
                        putString("bssid", bssid.lowercase())
                        putString("ssid", wifiInfo.ssid?.replace("\"", "") ?: "unknown")
                        putInt("rssi", wifiInfo.rssi)
                        putInt("linkSpeed", wifiInfo.linkSpeed)
                        putInt("frequency", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) wifiInfo.frequency else -1)
                        putString("macAddress", wifiInfo.macAddress ?: "unknown")
                        putInt("networkId", wifiInfo.networkId)
                        putString("method", "connectivity_manager")
                    }
                    return BSSIDResult(true, null, result)
                }
            }
        } catch (e: Exception) {
            // Fall through to failure
        }

        return BSSIDResult(false, "ConnectivityManager method failed", null)
    }

    /**
     * Method 3: Reflection-based approach for MIUI and other OEMs
     */
    private fun getReflectionBSSID(context: Context): BSSIDResult {
        try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            
            // Try different reflection methods
            val methods = listOf(
                "getConnectionInfo",
                "getCurrentWifiConfiguration",
                "getWifiInfo"
            )
            
            for (methodName in methods) {
                try {
                    val method: Method = wifiManager.javaClass.getDeclaredMethod(methodName)
                    method.isAccessible = true
                    val result = method.invoke(wifiManager)
                    
                    if (result is WifiInfo) {
                        val bssid = result.bssid
                        if (bssid != null && bssid != "02:00:00:00:00:00" && bssid.isNotEmpty()) {
                            val resultMap = Arguments.createMap().apply {
                                putString("bssid", bssid.lowercase())
                                putString("ssid", result.ssid?.replace("\"", "") ?: "unknown")
                                putInt("rssi", result.rssi)
                                putInt("linkSpeed", result.linkSpeed)
                                putInt("frequency", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) result.frequency else -1)
                                putString("macAddress", result.macAddress ?: "unknown")
                                putInt("networkId", result.networkId)
                                putString("method", "reflection_$methodName")
                            }
                            return BSSIDResult(true, null, resultMap)
                        }
                    }
                } catch (e: Exception) {
                    // Try next method
                    continue
                }
            }
        } catch (e: Exception) {
            // Reflection failed
        }

        return BSSIDResult(false, "Reflection methods failed", null)
    }

    /**
     * Method 4: Network callback approach for Android 11+
     */
    private fun getNetworkCallbackBSSID(context: Context): BSSIDResult {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            return BSSIDResult(false, "Network callback method requires Android 11+", null)
        }

        try {
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            
            // Get all networks and find WiFi
            val networks = connectivityManager.allNetworks
            for (network in networks) {
                val capabilities = connectivityManager.getNetworkCapabilities(network)
                if (capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true) {
                    val wifiInfo = capabilities.transportInfo as? WifiInfo
                    if (wifiInfo != null) {
                        val bssid = wifiInfo.bssid
                        if (bssid != null && bssid != "02:00:00:00:00:00" && bssid.isNotEmpty()) {
                            val result = Arguments.createMap().apply {
                                putString("bssid", bssid.lowercase())
                                putString("ssid", wifiInfo.ssid?.replace("\"", "") ?: "unknown")
                                putInt("rssi", wifiInfo.rssi)
                                putInt("linkSpeed", wifiInfo.linkSpeed)
                                putInt("frequency", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) wifiInfo.frequency else -1)
                                putString("macAddress", wifiInfo.macAddress ?: "unknown")
                                putInt("networkId", wifiInfo.networkId)
                                putString("method", "network_callback")
                            }
                            return BSSIDResult(true, null, result)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            // Network callback failed
        }

        return BSSIDResult(false, "Network callback method failed", null)
    }

    /**
     * Enhanced permission check for Android 13+ and MIUI
     */
    private fun hasEnhancedLocationPermission(): Boolean {
        val context = reactApplicationContext
        
        // Basic location permissions
        val fineLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val coarseLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        // For Android 13+, we need additional checks
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Check for nearby WiFi devices permission (Android 13+)
            val nearbyWifiDevices = try {
                ContextCompat.checkSelfPermission(
                    context, "android.permission.NEARBY_WIFI_DEVICES"
                ) == PackageManager.PERMISSION_GRANTED
            } catch (e: Exception) {
                false
            }
            
            return (fineLocation || coarseLocation) && nearbyWifiDevices
        }
        
        return fineLocation || coarseLocation
    }

    /**
     * Get detailed permission information for debugging
     */
    private fun getPermissionDetails(): String {
        val context = reactApplicationContext
        val details = mutableListOf<String>()
        
        details.add("Android: ${Build.VERSION.SDK_INT}")
        details.add("Manufacturer: ${Build.MANUFACTURER}")
        details.add("Model: ${Build.MODEL}")
        
        val permissions = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_WIFI_STATE,
            "android.permission.NEARBY_WIFI_DEVICES"
        )
        
        for (permission in permissions) {
            val granted = try {
                ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
            } catch (e: Exception) {
                false
            }
            details.add("$permission: $granted")
        }
        
        return details.joinToString(", ")
    }

    /**
     * Data class for BSSID fetch results
     */
    private data class BSSIDResult(
        val success: Boolean,
        val error: String?,
        val data: WritableMap?
    )

>>>>>>> origin/main
    @ReactMethod
    fun getWifiState(promise: Promise) {
        try {
            val context = reactApplicationContext
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            
            val result = Arguments.createMap().apply {
                putBoolean("isWifiEnabled", wifiManager.isWifiEnabled)
                putBoolean("hasLocationPermission", hasLocationPermission())
<<<<<<< HEAD
                putString("androidVersion", Build.VERSION.RELEASE)
                putInt("sdkVersion", Build.VERSION.SDK_INT)
=======
                putBoolean("hasEnhancedLocationPermission", hasEnhancedLocationPermission())
                putString("androidVersion", Build.VERSION.RELEASE)
                putInt("sdkVersion", Build.VERSION.SDK_INT)
                putString("manufacturer", Build.MANUFACTURER)
                putString("model", Build.MODEL)
                putString("securityPatch", Build.VERSION.SECURITY_PATCH)
                putString("permissionDetails", getPermissionDetails())
>>>>>>> origin/main
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("WIFI_STATE_ERROR", "Error getting WiFi state: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestLocationPermission(promise: Promise) {
        try {
<<<<<<< HEAD
            if (hasLocationPermission()) {
=======
            if (hasEnhancedLocationPermission()) {
>>>>>>> origin/main
                promise.resolve(true)
                return
            }
            
<<<<<<< HEAD
            // We can't directly request permissions from a native module
            // The JavaScript side needs to handle permission requests
            val result = Arguments.createMap().apply {
                putBoolean("hasPermission", false)
                putString("message", "Location permission required. Please request from JavaScript side.")
                putArray("requiredPermissions", Arguments.createArray().apply {
                    pushString(Manifest.permission.ACCESS_FINE_LOCATION)
                    pushString(Manifest.permission.ACCESS_COARSE_LOCATION)
                })
=======
            // Enhanced permission requirements for Android 13+
            val requiredPermissions = Arguments.createArray().apply {
                pushString(Manifest.permission.ACCESS_FINE_LOCATION)
                pushString(Manifest.permission.ACCESS_COARSE_LOCATION)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    pushString("android.permission.NEARBY_WIFI_DEVICES")
                }
            }
            
            val result = Arguments.createMap().apply {
                putBoolean("hasPermission", false)
                putString("message", "Enhanced location permissions required for Android ${Build.VERSION.SDK_INT} on ${Build.MANUFACTURER} ${Build.MODEL}")
                putArray("requiredPermissions", requiredPermissions)
                putString("androidVersion", Build.VERSION.RELEASE)
                putString("manufacturer", Build.MANUFACTURER)
                putString("model", Build.MODEL)
>>>>>>> origin/main
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Error checking permissions: ${e.message}", e)
        }
    }

<<<<<<< HEAD
=======
    @ReactMethod
    fun testAllBSSIDMethods(promise: Promise) {
        try {
            val context = reactApplicationContext
            val results = Arguments.createArray()
            
            // Test Method 1: Standard
            try {
                val standardResult = getStandardBSSID(context)
                val testResult = Arguments.createMap().apply {
                    putString("method", "standard")
                    putBoolean("success", standardResult.success)
                    putString("error", standardResult.error)
                    if (standardResult.success && standardResult.data != null) {
                        putMap("data", standardResult.data)
                    }
                }
                results.pushMap(testResult)
            } catch (e: Exception) {
                val errorResult = Arguments.createMap().apply {
                    putString("method", "standard")
                    putBoolean("success", false)
                    putString("error", "Exception: ${e.message}")
                }
                results.pushMap(errorResult)
            }
            
            // Test Method 2: ConnectivityManager
            try {
                val connectivityResult = getConnectivityManagerBSSID(context)
                val testResult = Arguments.createMap().apply {
                    putString("method", "connectivity_manager")
                    putBoolean("success", connectivityResult.success)
                    putString("error", connectivityResult.error)
                    if (connectivityResult.success && connectivityResult.data != null) {
                        putMap("data", connectivityResult.data)
                    }
                }
                results.pushMap(testResult)
            } catch (e: Exception) {
                val errorResult = Arguments.createMap().apply {
                    putString("method", "connectivity_manager")
                    putBoolean("success", false)
                    putString("error", "Exception: ${e.message}")
                }
                results.pushMap(errorResult)
            }
            
            // Test Method 3: Reflection
            try {
                val reflectionResult = getReflectionBSSID(context)
                val testResult = Arguments.createMap().apply {
                    putString("method", "reflection")
                    putBoolean("success", reflectionResult.success)
                    putString("error", reflectionResult.error)
                    if (reflectionResult.success && reflectionResult.data != null) {
                        putMap("data", reflectionResult.data)
                    }
                }
                results.pushMap(testResult)
            } catch (e: Exception) {
                val errorResult = Arguments.createMap().apply {
                    putString("method", "reflection")
                    putBoolean("success", false)
                    putString("error", "Exception: ${e.message}")
                }
                results.pushMap(errorResult)
            }
            
            // Test Method 4: Network Callback
            try {
                val callbackResult = getNetworkCallbackBSSID(context)
                val testResult = Arguments.createMap().apply {
                    putString("method", "network_callback")
                    putBoolean("success", callbackResult.success)
                    putString("error", callbackResult.error)
                    if (callbackResult.success && callbackResult.data != null) {
                        putMap("data", callbackResult.data)
                    }
                }
                results.pushMap(testResult)
            } catch (e: Exception) {
                val errorResult = Arguments.createMap().apply {
                    putString("method", "network_callback")
                    putBoolean("success", false)
                    putString("error", "Exception: ${e.message}")
                }
                results.pushMap(errorResult)
            }
            
            val finalResult = Arguments.createMap().apply {
                putArray("methodResults", results)
                putString("deviceInfo", "Android ${Build.VERSION.SDK_INT}, ${Build.MANUFACTURER} ${Build.MODEL}")
                putString("permissionStatus", getPermissionDetails())
            }
            
            promise.resolve(finalResult)
            
        } catch (e: Exception) {
            promise.reject("TEST_ERROR", "Error testing BSSID methods: ${e.message}", e)
        }
    }

>>>>>>> origin/main
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
<<<<<<< HEAD
=======
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    putBoolean("NEARBY_WIFI_DEVICES", try {
                        ContextCompat.checkSelfPermission(
                            context, "android.permission.NEARBY_WIFI_DEVICES"
                        ) == PackageManager.PERMISSION_GRANTED
                    } catch (e: Exception) {
                        false
                    })
                }
                
                putBoolean("hasEnhancedPermission", hasEnhancedLocationPermission())
                putString("deviceInfo", "${Build.MANUFACTURER} ${Build.MODEL} (Android ${Build.VERSION.SDK_INT})")
>>>>>>> origin/main
            }
            
            promise.resolve(result)
            
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", "Error checking permissions: ${e.message}", e)
        }
    }
}