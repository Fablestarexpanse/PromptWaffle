/**
 * Security utilities for PromptWaffle
 * Handles input validation, path sanitization, and HTML sanitization
 */

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = {
  snippets: ['.txt', '.json'],
  images: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
  exports: ['.txt', '.json', '.md'],
  characters: ['.json'],
  all: ['.txt', '.json', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.md']
};

// Maximum file path length to prevent buffer overflow attacks
const MAX_PATH_LENGTH = 1000;

// Maximum file content size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates and sanitizes file paths
 * @param {string} filePath - The file path to validate
 * @param {string} allowedExtensions - Array of allowed file extensions (with or without dots)
 * @returns {string|null} - Sanitized path or null if invalid
 */
function validateAndSanitizePath(filePath, allowedExtensions = ALLOWED_EXTENSIONS.all) {
  try {
    // Check if path is a string
    if (typeof filePath !== 'string') {
      console.warn('[Security] Invalid file path type:', typeof filePath);
      return null;
    }

    // Check path length
    if (filePath.length > MAX_PATH_LENGTH) {
      console.warn('[Security] File path too long:', filePath.length);
      return null;
    }

    // Check for null bytes (potential null byte injection)
    if (filePath.includes('\0')) {
      console.warn('[Security] Null byte detected in path');
      return null;
    }

    // Remove directory traversal attempts
    let sanitizedPath = filePath
      .replace(/^(\.\.(\/|\\|$))+/, '') // Remove leading ../
      .replace(/[<>:"|?*]/g, '') // Remove invalid Windows characters
      .replace(/\/{2,}/g, '/') // Normalize multiple slashes
      .replace(/\\{2,}/g, '\\'); // Normalize multiple backslashes

    // Check file extension if specified
    if (allowedExtensions && allowedExtensions.length > 0) {
      const ext = sanitizedPath.toLowerCase().substring(sanitizedPath.lastIndexOf('.'));
      // Normalize extensions to include dots for comparison
      const normalizedExtensions = allowedExtensions.map(ext => ext.startsWith('.') ? ext : '.' + ext);
      if (!normalizedExtensions.includes(ext)) {
        console.warn('[Security] File extension not allowed:', ext);
        return null;
      }
    }

    return sanitizedPath;
  } catch (error) {
    console.error('[Security] Error validating path:', error);
    return null;
  }
}

/**
 * Validates file content size
 * @param {string|Buffer} content - File content to validate
 * @returns {boolean} - True if content size is acceptable
 */
function validateFileSize(content) {
  try {
    const size = typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : content.length;
    return size <= MAX_FILE_SIZE;
  } catch (error) {
    console.error('[Security] Error validating file size:', error);
    return false;
  }
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }

  // Remove potentially dangerous HTML tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '');
}

/**
 * Validates URL to prevent open redirect attacks
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
function validateURL(url) {
  try {
    if (typeof url !== 'string') {
      return false;
    }

    // Check for data: URLs (potential XSS)
    if (url.startsWith('data:')) {
      return false;
    }

    // Check for javascript: URLs
    if (url.startsWith('javascript:')) {
      return false;
    }

    // Check for file: URLs
    if (url.startsWith('file:')) {
      return false;
    }

    // Basic URL validation
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch (error) {
    console.warn('[Security] Invalid URL:', url);
    return false;
  }
}

/**
 * Rate limiting utility for IPC handlers
 */
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Global rate limiter instance
const ipcRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

// Cleanup rate limiter every minute
// Commented out to prevent initialization issues - can be re-enabled after app is ready
// setInterval(() => ipcRateLimiter.cleanup(), 60000);

/**
 * Validates IPC request parameters
 * @param {any} params - Parameters to validate
 * @param {Object} schema - Validation schema
 * @returns {boolean} - True if parameters are valid
 */
function validateIPCParams(params, schema) {
  try {
    for (const [key, validator] of Object.entries(schema)) {
      if (!validator(params[key])) {
        console.warn(`[Security] Invalid IPC parameter: ${key}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('[Security] Error validating IPC parameters:', error);
    return false;
  }
}

/**
 * Common validation schemas for IPC handlers
 */
const IPC_SCHEMAS = {
  filePath: (value) => typeof value === 'string' && value.length > 0 && value.length <= MAX_PATH_LENGTH,
  content: (value) => typeof value === 'string' && validateFileSize(value),
  url: (value) => typeof value === 'string' && validateURL(value),
  number: (value) => typeof value === 'number' && !isNaN(value) && isFinite(value),
  boolean: (value) => typeof value === 'boolean'
};

/**
 * Logs security events for monitoring
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 */
function logSecurityEvent(event, details = {}) {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    details,
    process: process.platform,
    nodeVersion: process.version
  };

  console.warn('[Security Event]', securityLog);
  
  // Store in console for debugging (main process doesn't have localStorage)
  try {
    // In main process, just log to console
    console.log('[Security Event]', securityLog);
  } catch (error) {
    console.error('[Security] Error logging security event:', error);
  }
}

/**
 * Gets security statistics
 * @returns {Object} - Security statistics
 */
function getSecurityStats() {
  try {
    // In main process, return basic stats
    return { 
      totalEvents: 0, 
      eventsByType: {}, 
      recentEvents: [] 
    };
  } catch (error) {
    console.error('[Security] Error getting security stats:', error);
    return { totalEvents: 0, eventsByType: {}, recentEvents: [] };
  }
}

module.exports = {
  validateAndSanitizePath,
  validateFileSize,
  sanitizeHTML,
  validateURL,
  ipcRateLimiter,
  validateIPCParams,
  IPC_SCHEMAS,
  logSecurityEvent,
  getSecurityStats,
  ALLOWED_EXTENSIONS,
  MAX_PATH_LENGTH,
  MAX_FILE_SIZE
};
