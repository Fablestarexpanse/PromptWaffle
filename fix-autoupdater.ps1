#!/usr/bin/env pwsh
# PowerShell script to apply the autoUpdater lazy-load fix

Write-Host "Applying autoUpdater lazy-load fix..." -ForegroundColor Green

$mainPath = "main.js"
$content = Get-Content $mainPath -Raw

# Step 1: Comment out autoUpdater import line
$content = $content -replace "const \{ autoUpdater \} = require\('electron-updater'\);", "// const { autoUpdater } = require('electron-updater'); // Will lazy-load instead"

# Step 2: Make security utilities global (find and replace the try block)
$oldSecurityBlock = @"
// Security utilities
console.log('[Main] Loading security utilities...');
try {
  const { validateAndSanitizePath, validateFileSize, logSecurityEvent } = require('./src/utils/security.js');
  console.log('[Main] Security utilities loaded successfully');
} catch (error) {
  console.error('[Main] Failed to load security utilities:', error);
  process.exit(1);
}
"@

$newSecurityBlock = @"
// Security utilities - globally accessible for IPC handlers
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
}
"@

$content = $content -replace [regex]::Escape($oldSecurityBlock), $newSecurityBlock

# Step 3: Replace autoUpdater initialization with lazy-load function
$content = $content -replace "let mainWindow;`r`nlet imageViewerWindow = null;`r`n`r`n// Auto-updater configuration", "let mainWindow;`r`nlet imageViewerWindow = null;`r`nlet autoUpdater = null;`r`n`r`n// Lazy-load autoUpdater to avoid initialization before app is ready`r`nfunction initAutoUpdater() {`r`n  if (autoUpdater) return autoUpdater;`r`n  const { autoUpdater: updater } = require('electron-updater');`r`n  autoUpdater = updater;`r`n  // Auto-updater configuration"

# Step 4: Close the initAutoUpdater function after event handlers
$content = $content -replace "  mainWindow\.webContents\.send\('update-downloaded', info\);`r`n  }`r`n}\);", "  mainWindow.webContents.send('update-downloaded', info);`r`n  }`r`n});`r`n  return autoUpdater;`r`n}"

# Step 5: Update IPC handlers to use initAutoUpdater()
$content = $content -replace "const result = await autoUpdater\.checkForUpdates\(\);", "const result = await initAutoUpdater().checkForUpdates();"
$content = $content -replace "await autoUpdater\.downloadUpdate\(\);", "await initAutoUpdater().downloadUpdate();"
$content = $content -replace "ipcMain\.handle\('install-update', \(\) => \{`r`n  autoUpdater\.quitAndInstall\(\);", "ipcMain.handle('install-update', () => {`r`n  initAutoUpdater().quitAndInstall();"

Set-Content $mainPath $content -NoNewline

Write-Host "✅ AutoUpdater lazy-load fix applied!" -ForegroundColor Green
Write-Host "Testing with npm start..." -ForegroundColor Yellow
