/**
 * WiFi Security Enforcer - Emergency Security Patch
 * Forces immediate timer stop when WiFi validation fails
 * NO BYPASSES ALLOWED - Production Security
 */

import { Alert } from 'react-native';

class WiFiSecurityEnforcer {
  constructor() {
    this.isEnforcing = false;
    this.validationInterval = null;
    this.onTimerStop = null;
  }

  /**
   * Start enforcing WiFi security - NO BYPASSES
   */
  startEnforcement(timerState, stopTimerCallback, wifiValidationCallback) {
    if (this.isEnforcing) return;
    
    console.log('🔒 SECURITY ENFORCER: Starting strict WiFi enforcement');
    this.isEnforcing = true;
    this.onTimerStop = stopTimerCallback;
    
    // Immediate validation
    this.validateWiFiStrict(timerState, wifiValidationCallback);
    
    // Continuous validation every 5 seconds (strict)
    this.validationInterval = setInterval(() => {
      this.validateWiFiStrict(timerState, wifiValidationCallback);
    }, 5000);
  }

  /**
   * Stop enforcement
   */
  stopEnforcement() {
    console.log('🔒 SECURITY ENFORCER: Stopping enforcement');
    this.isEnforcing = false;
    
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Strict WiFi validation - NO BYPASSES ALLOWED
   */
  async validateWiFiStrict(timerState, wifiValidationCallback) {
    // Only validate when timer is running
    if (!timerState.isRunning) return;

    try {
      console.log('🔒 SECURITY ENFORCER: Validating WiFi (STRICT MODE)');
      
      // Call the WiFi validation function
      const isWiFiValid = await wifiValidationCallback();
      
      if (!isWiFiValid) {
        console.error('🚨 SECURITY ENFORCER: WiFi validation FAILED - STOPPING TIMER IMMEDIATELY');
        
        // FORCE STOP - NO GRACE PERIOD
        if (this.onTimerStop) {
          await this.onTimerStop('wifi_security_enforcement');
        }
        
        // Alert user
        Alert.alert(
          '🚨 Security Enforcement',
          'Timer stopped due to WiFi validation failure. You must be connected to the authorized classroom WiFi to track attendance.',
          [{ text: 'OK' }]
        );
        
        // Stop enforcement since timer is now stopped
        this.stopEnforcement();
      } else {
        console.log('✅ SECURITY ENFORCER: WiFi validation passed');
      }
      
    } catch (error) {
      console.error('🚨 SECURITY ENFORCER: WiFi validation error - STOPPING TIMER FOR SECURITY');
      
      // On any error, stop timer for security
      if (this.onTimerStop) {
        await this.onTimerStop('wifi_security_error');
      }
      
      Alert.alert(
        '🚨 Security Error',
        'Timer stopped due to WiFi validation error. Please restart the app and try again.',
        [{ text: 'OK' }]
      );
      
      this.stopEnforcement();
    }
  }
}

// Export singleton instance
export default new WiFiSecurityEnforcer();