# Auto-Updater Documentation

## Overview

PromptWaffle uses `electron-updater` for automatic application updates with a dual update checking mechanism.

## Update Mechanisms

### 1. Primary: electron-updater (Recommended)

**Configuration:** [`main.js:26-71`](file:///f:/Promptwaffle%20google/PromptWaffle/main.js#L26-L71)

```javascript
autoUpdater.autoDownload = false; // User must approve downloads
autoUpdater.logger = require('electron-log');
```

**Update Flow:**
1. App checks for updates via GitHub releases API
2. If update found, shows notification to user
3. User can choose to download or skip
4. After download, user prompted to install
5. App quits and installs update

**Events:**
- `checking-for-update` - Sent when check starts
- `update-available` - New version found
- `update-not-available` - Already on latest
- `download-progress` - Download progress updates
- `update-downloaded` - Ready to install
- `error` - Update check/download failed

### 2. Fallback: GitHub API Direct

**Purpose:** Provides version info when electron-updater unavailable

**Handler:** [`main.js:922-985`](file:///f:/Promptwaffle%20google/PromptWaffle/main.js#L922-L985)

```javascript
ipcMain.handle('fetchLatestRelease', async (event, repoOwner, repoName) => {
  // Fetches from: https://api.github.com/repos/{owner}/{repo}/releases/latest
});
```

**Use Case:** Display "Update Available" notification without electron-updater

## UI Integration

### Update Dialog

**File:** [`update-dialog.html`](file:///f:/Promptwaffle%20google/PromptWaffle/update-dialog.html)

Displays update information and download progress

### Renderer Integration

**File:** [`src/utils/auto-updater-ui.js`](file:///f:/Promptwaffle%20google/PromptWaffle/src/utils/auto-updater-ui.js)

Handles UI for update notifications:
- Shows modal when update available
- Displays download progress
- Provides install/skip options

## Testing Updates

### Development Mode

```bash
npm run dev
```

Auto-updater is **disabled** in development mode (checks but won't download)

### Production Build

```bash
npm run build
```

Full update mechanism enabled

### Manual Update Check

From renderer process:
```javascript
await window.autoUpdaterAPI.checkForUpdates();
```

## Security Considerations

✅ **Good Practices:**
- Auto-download disabled (user consent required)
- HTTPS-only from GitHub
- Signed releases (when configured)

⚠️ **Recommendations:**
- Enable code signing for Windows/Mac builds
- Set up private GitHub token for higher rate limits
- Implement update signature verification

## Configuration

**package.json:**
```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "Fablestarexpanse",
    "repo": "PromptWaffle",
    "private": false
  }
}
```

## Why Two Mechanisms?

1. **electron-updater**: Full-featured, handles downloads, installation
2. **GitHub API**: Lightweight fallback for version checking only

**Recommendation:** Consider removing GitHub API fallback if electron-updater works reliably. Reduces code complexity and maintenance burden.

## Common Issues

### Update Check Fails

**Cause:** Rate limiting or network issues

**Solution:** Implement retry logic with exponential backoff

### Update Downloads But Won't Install

**Cause:** Permissions issues on Windows

**Solution:** Run as administrator or use different install location

### No Updates Detected

**Cause:** No releases tagged properly on GitHub

**Solution:** Ensure releases are created with semantic version tags (e.g., v1.4.1)

## Future Improvements

- [ ] Add automatic update checks on app startup
- [ ] Implement configurable update channel (stable/beta)
- [ ] Add release notes display in update UI
- [ ] Implement delta updates for smaller downloads
- [ ] Add telemetry for update success/failure rates
