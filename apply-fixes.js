#!/usr/bin/env node

/**
 * This script applies the autoUpdater lazy-load fix and security validation fixes to main.js
 * Run with: node apply-fixes.js
 */

const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, 'main.js');

console.log('Reading main.js...');
let content = fs.readFileSync(mainPath, 'utf8');

// Step 1: Remove autoUpdater import  
content = content.replace(
    "const { autoUpdater } = require('electron-updater');",
    "// autoUpdater will be lazy-loaded"
);

// Step 2: Make security utilities global
content = content.replace(
    `// Security utilities
console.log('[Main] Loading security utilities...');
try {
  const { validateAndSanitizePath, validateFileSize, logSecurityEvent } = require('./src/utils/security.js');
  console.log('[Main] Security utilities loaded successfully');
} catch (error) {
  console.error('[Main] Failed to load security utilities:', error);
  process.exit(1);
}`,
    `// Security utilities - declare globally so IPC handlers can access them
let validateAndSanitizePath, validateFileSize, logSecurityEvent;
console.log('[Main] Loading security utilities...');
try {
  const securityUtils = require('./src/utils/security.js');
  validateAndSanitizePath = securityUtils.validateAndSanitizePath;
  validateFileSize = securityUtils.validateFileSize;
  logSecurityEvent = securityUtils.logSecurityEvent;
  console.log('[Main] Security utilities loaded successfully');
} catch (error) {
  console.error('[Main] Failed to load security utilities:', error);
  process.exit(1);
}`
);

// Step 3: Replace autoUpdater configuration with lazy-load function
const autoUpdaterConfigStart = 'let mainWindow;\r\nlet imageViewerWindow = null;\r\n\r\n// Auto-updater configuration';
const autoUpdaterConfigEnd = '});\r\n\r\nfunction createWindow()';

const oldConfig = content.substring(
    content.indexOf(autoUpdaterConfigStart),
    content.indexOf(autoUpdaterConfigEnd) + '});\r\n'.length
);

const newConfig = `let mainWindow;
let imageViewerWindow = null;
let autoUpdater = null;

// Lazy-load autoUpdater to avoid initialization before app is ready
function initAutoUpdater() {
  if (autoUpdater) return autoUpdater;
  
  const { autoUpdater: updater } = require('electron-updater');
  autoUpdater = updater;
  
  // Auto-updater configuration
  autoUpdater.autoDownload = false; // Don't auto-download, let user choose
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (mainWindow) {
      mainWindow.webContents.send('update-checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });
  
  return autoUpdater;
}
`;

content = content.replace(oldConfig, newConfig);

console.log('Writing patched main.js...');
fs.writeFileSync(mainPath, content, 'utf8');

console.log('✅ AutoUpdater lazy-load fix applied successfully!');
console.log('Now run npm start to test');
