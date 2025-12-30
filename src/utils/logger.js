/**
 * Production Logging Utility
 * 
 * Provides environment-aware logging that uses electron-log in production
 * and console methods in development mode.
 * 
 * Usage:
 *   import { log, logError, logWarn, logInfo } from './utils/logger.js';
 *   log('Message');
 *   logError('Error message', error);
 */

// Check if we're in development mode
const isDev = typeof window !== 'undefined' 
  ? window.location?.search?.includes('dev=true') || false
  : process.argv.includes('--dev');

// Try to use electron-log in production, fallback to console
let electronLog = null;
if (!isDev && typeof window !== 'undefined' && window.require) {
  try {
    electronLog = window.require('electron-log');
  } catch (e) {
    // electron-log not available, will use console
  }
}

// If electron-log is available in main process
if (!isDev && typeof window === 'undefined' && typeof require !== 'undefined') {
  try {
    electronLog = require('electron-log');
  } catch (e) {
    // electron-log not available
  }
}

/**
 * Log a message (info level)
 * @param {...any} args - Arguments to log
 */
export function log(...args) {
  if (isDev) {
    console.log(...args);
  } else if (electronLog) {
    electronLog.info(...args);
  } else {
    // Fallback to console if electron-log not available
    console.log(...args);
  }
}

/**
 * Log an error
 * @param {...any} args - Arguments to log
 */
export function logError(...args) {
  if (isDev) {
    console.error(...args);
  } else if (electronLog) {
    electronLog.error(...args);
  } else {
    console.error(...args);
  }
}

/**
 * Log a warning
 * @param {...any} args - Arguments to log
 */
export function logWarn(...args) {
  if (isDev) {
    console.warn(...args);
  } else if (electronLog) {
    electronLog.warn(...args);
  } else {
    console.warn(...args);
  }
}

/**
 * Log an info message
 * @param {...any} args - Arguments to log
 */
export function logInfo(...args) {
  if (isDev) {
    console.info(...args);
  } else if (electronLog) {
    electronLog.info(...args);
  } else {
    console.info(...args);
  }
}

/**
 * Log a debug message (only in development)
 * @param {...any} args - Arguments to log
 */
export function logDebug(...args) {
  if (isDev) {
    console.debug(...args);
  }
  // Debug messages are not logged in production
}

/**
 * Create a scoped logger with a prefix
 * @param {string} scope - Scope/prefix for log messages
 * @returns {Object} Logger object with log, error, warn, info, debug methods
 */
export function createLogger(scope) {
  const prefix = `[${scope}]`;
  return {
    log: (...args) => log(prefix, ...args),
    error: (...args) => logError(prefix, ...args),
    warn: (...args) => logWarn(prefix, ...args),
    info: (...args) => logInfo(prefix, ...args),
    debug: (...args) => logDebug(prefix, ...args)
  };
}

// Export default logger instance
export default {
  log,
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  createLogger
};

