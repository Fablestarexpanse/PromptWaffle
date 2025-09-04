/**
 * Security Monitor for PromptWaffle
 * Provides real-time security monitoring and reporting
 */

import { getSecurityStats, logSecurityEvent } from './security.js';

class SecurityMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.securityEvents = [];
    this.vulnerabilityChecks = [];
    this.lastCheck = null;
    
    this.init();
  }

  init() {
    // Set up periodic security checks
    this.startMonitoring();
    
    // Listen for security events
    this.setupEventListeners();
    
    // Run initial security audit
    this.runSecurityAudit();
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => {
      this.runSecurityChecks();
    }, 30000); // Check every 30 seconds
    
    console.log('[Security] Monitoring started');
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('[Security] Monitoring stopped');
  }

  setupEventListeners() {
    // Listen for security-related events
    window.addEventListener('security-event', (event) => {
      this.handleSecurityEvent(event.detail);
    });

    // Monitor for suspicious DOM changes
    this.setupDOMMonitoring();
    
    // Monitor for suspicious network requests
    this.setupNetworkMonitoring();
  }

  setupDOMMonitoring() {
    // Monitor for dangerous innerHTML usage
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        if (typeof value === 'string' && SecurityMonitor.isDangerousHTML(value)) {
          logSecurityEvent('dangerous_innerhtml_usage', {
            value: value.substring(0, 100),
            stack: new Error().stack
          });
        }
        return originalInnerHTML.set.call(this, value);
      },
      get: function() {
        return originalInnerHTML.get.call(this);
      }
    });
  }

  setupNetworkMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      if (typeof url === 'string' && SecurityMonitor.isSuspiciousURL(url)) {
        logSecurityEvent('suspicious_network_request', { url });
      }
      return originalFetch.apply(this, args);
    };

    // Monitor XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && SecurityMonitor.isSuspiciousURL(url)) {
        logSecurityEvent('suspicious_xhr_request', { method, url });
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
  }

  static isDangerousHTML(html) {
    const dangerousPatterns = [
      /<script\b/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe\b/i,
      /<object\b/i,
      /<embed\b/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(html));
  }

  static isSuspiciousURL(url) {
    try {
      const urlObj = new URL(url);
      return ['data:', 'javascript:', 'file:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  async runSecurityChecks() {
    try {
      this.lastCheck = new Date();
      
      // Check for common vulnerabilities
      await this.checkForVulnerabilities();
      
      // Check security statistics
      const stats = getSecurityStats();
      if (stats.totalEvents > 0) {
        this.updateSecurityStatus(stats);
      }
      
    } catch (error) {
      console.error('[Security] Error running security checks:', error);
    }
  }

  async checkForVulnerabilities() {
    const checks = [
      this.checkLocalStorageSecurity(),
      this.checkSessionStorageSecurity(),
      this.checkCookieSecurity(),
      this.checkWindowProperties(),
      this.checkEvalUsage(),
      this.checkFunctionConstructor()
    ];

    const results = await Promise.allSettled(checks);
    this.vulnerabilityChecks = results.map((result, index) => ({
      check: checks[index].name || `Check ${index}`,
      status: result.status === 'fulfilled' ? 'passed' : 'failed',
      result: result.status === 'fulfilled' ? result.value : result.reason
    }));
  }

  async checkLocalStorageSecurity() {
    try {
      // Check if localStorage is accessible
      const testKey = '__security_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return { accessible: true, secure: true };
    } catch (error) {
      return { accessible: false, secure: false, error: error.message };
    }
  }

  async checkSessionStorageSecurity() {
    try {
      const testKey = '__security_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return { accessible: true, secure: true };
    } catch (error) {
      return { accessible: false, secure: false, error: error.message };
    }
  }

  async checkCookieSecurity() {
    try {
      // Check if cookies are accessible
      document.cookie = 'test=value; path=/';
      const hasCookie = document.cookie.includes('test=value');
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      return { accessible: true, secure: !hasCookie };
    } catch (error) {
      return { accessible: false, secure: false, error: error.message };
    }
  }

  async checkWindowProperties() {
    const dangerousProps = ['eval', 'Function', 'setTimeout', 'setInterval'];
    const results = {};
    
    dangerousProps.forEach(prop => {
      try {
        results[prop] = typeof window[prop] === 'function';
      } catch {
        results[prop] = false;
      }
    });
    
    return results;
  }

  async checkEvalUsage() {
    try {
      // Check if eval is accessible
      return { accessible: typeof eval === 'function', secure: false };
    } catch {
      return { accessible: false, secure: true };
    }
  }

  async checkFunctionConstructor() {
    try {
      // Check if Function constructor is accessible
      return { accessible: typeof Function === 'function', secure: false };
    } catch {
      return { accessible: false, secure: true };
    }
  }

  updateSecurityStatus(stats) {
    const securityStatus = {
      totalEvents: stats.totalEvents,
      eventsByType: stats.eventsByType,
      lastCheck: this.lastCheck,
      vulnerabilityChecks: this.vulnerabilityChecks,
      riskLevel: this.calculateRiskLevel(stats)
    };

    // Dispatch security status update event
    window.dispatchEvent(new CustomEvent('security-status-update', {
      detail: securityStatus
    }));
  }

  calculateRiskLevel(stats) {
    let riskScore = 0;
    
    // High risk events
    if (stats.eventsByType['path_traversal_attempt']) riskScore += 10;
    if (stats.eventsByType['dangerous_url_protocol']) riskScore += 8;
    if (stats.eventsByType['dangerous_innerhtml_usage']) riskScore += 6;
    
    // Medium risk events
    if (stats.eventsByType['invalid_file_path']) riskScore += 3;
    if (stats.eventsByType['file_too_large']) riskScore += 2;
    
    // Low risk events
    if (stats.eventsByType['invalid_url']) riskScore += 1;
    
    if (riskScore >= 15) return 'HIGH';
    if (riskScore >= 8) return 'MEDIUM';
    if (riskScore >= 3) return 'LOW';
    return 'NONE';
  }

  handleSecurityEvent(eventDetail) {
    this.securityEvents.push({
      timestamp: new Date(),
      ...eventDetail
    });

    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents.splice(0, this.securityEvents.length - 100);
    }

    // Update security status
    this.updateSecurityStatus(getSecurityStats());
  }

  getSecurityReport() {
    const stats = getSecurityStats();
    return {
      summary: {
        totalEvents: stats.totalEvents,
        riskLevel: this.calculateRiskLevel(stats),
        lastCheck: this.lastCheck,
        monitoringStatus: this.isMonitoring ? 'active' : 'inactive'
      },
      events: stats.recentEvents,
      vulnerabilities: this.vulnerabilityChecks,
      recommendations: this.getSecurityRecommendations(stats)
    };
  }

  getSecurityRecommendations(stats) {
    const recommendations = [];

    if (stats.eventsByType['path_traversal_attempt']) {
      recommendations.push('Implement stricter path validation and sanitization');
    }

    if (stats.eventsByType['dangerous_url_protocol']) {
      recommendations.push('Strengthen URL validation to block dangerous protocols');
    }

    if (stats.eventsByType['dangerous_innerhtml_usage']) {
      recommendations.push('Replace innerHTML usage with secure alternatives');
    }

    if (stats.eventsByType['invalid_file_path']) {
      recommendations.push('Add comprehensive file path validation');
    }

    if (stats.totalEvents === 0) {
      recommendations.push('No security issues detected. Continue monitoring.');
    }

    return recommendations;
  }

  // Public API methods
  start() {
    this.startMonitoring();
  }

  stop() {
    this.stopMonitoring();
  }

  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastCheck: this.lastCheck,
      totalEvents: this.securityEvents.length
    };
  }

  getReport() {
    return this.getSecurityReport();
  }
}

// Create global instance
const securityMonitor = new SecurityMonitor();

// Export for use in other modules
export default securityMonitor;

// Also export the class for testing
export { SecurityMonitor };
