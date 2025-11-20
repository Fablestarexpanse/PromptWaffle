import { showToast } from './index.js';

// Configuration
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'Fablestarexpanse'; // Update this to your actual GitHub username/org
const REPO_NAME = 'PromptWaffle'; // Update this to your actual repository name
const CURRENT_VERSION = '1.4.2'; // This should match package.json version

class VersionChecker {
  constructor() {
    this.latestRelease = null;
    this.isChecking = false;
  }

  /**
   * Parse version string to comparable numbers
   * @param {string} version - Version string (e.g., "1.2.1")
   * @returns {number[]} Array of version numbers
   */
  parseVersion(version) {
    return version.split('.').map(num => parseInt(num, 10) || 0);
  }

  /**
   * Compare two version strings
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  compareVersions(version1, version2) {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);
    const maxLength = Math.max(v1.length, v2.length);

    for (let i = 0; i < maxLength; i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    return 0;
  }

  /**
   * Fetch the latest release from GitHub
   * @returns {Promise<Object|null>} Latest release data or null if failed
   */
  async fetchLatestRelease() {
    try {
      // Use Electron's main process to make the API call (avoids CSP issues)
      if (window.electronAPI && window.electronAPI.fetchLatestRelease) {
        const release = await window.electronAPI.fetchLatestRelease(
          REPO_OWNER,
          REPO_NAME
        );
        return release;
      }
      throw new Error('Electron API not available for GitHub API calls');
    } catch (error) {
      console.error('Error fetching latest release:', error);
      return null;
    }
  }

  /**
   * Get current version
   * @returns {Promise<string>} Current version
   */
  async getCurrentVersion() {
    try {
      if (window.autoUpdaterAPI) {
        const version = await window.autoUpdaterAPI.getAppVersion();
        if (version) return version;
      }
    } catch (error) {
      console.warn('Failed to get version from autoUpdaterAPI:', error);
    }
    return CURRENT_VERSION; // Fallback to constant if API fails
  }

  /**
   * Check if current version is outdated
   * @returns {Promise<Object>} Version check result
   */
  async checkForUpdates() {
    if (this.isChecking) {
      return { isChecking: true };
    }
    this.isChecking = true;

    try {
      const currentVersion = await this.getCurrentVersion();

      // Try auto-updater first
      if (window.autoUpdaterAPI) {
        const result = await window.autoUpdaterAPI.checkForUpdates();
        if (result.success) {
          // Auto-updater will handle the rest via events
          return {
            success: true,
            usingAutoUpdater: true,
            currentVersion: currentVersion
          };
        } else {
          console.warn('Auto-updater failed, falling back to GitHub API:', result.error);
        }
      }

      // Fallback to existing GitHub API method
      const latestRelease = await this.fetchLatestRelease();
      if (!latestRelease) {
        return {
          success: false,
          error: 'Could not fetch release information',
          currentVersion: currentVersion
        };
      }

      this.latestRelease = latestRelease;
      const comparison = this.compareVersions(
        currentVersion,
        latestRelease.version
      );

      const isOutdated = comparison < 0;
      const isNewer = comparison > 0;

      return {
        success: true,
        currentVersion: currentVersion,
        latestVersion: latestRelease.version,
        isOutdated,
        isNewer,
        isPrerelease: latestRelease.prerelease,
        releaseInfo: latestRelease
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        success: false,
        error: error.message,
        currentVersion: await this.getCurrentVersion()
      };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Display update notification
   * @param {Object} updateInfo - Update check result
   */
  displayUpdateNotification(updateInfo) {
    if (!updateInfo.success) {
      return;
    }

    if (updateInfo.isOutdated) {
      const release = updateInfo.releaseInfo;
      const message = `New version available: ${updateInfo.latestVersion}`;

      // Show toast notification
      showToast(message, 'info');

      // Log changelog if available
      if (release.body) {
        // console.log('Changelog:', release.body);
      }

      // Store update info for potential UI display
      this.storeUpdateInfo(updateInfo);
    }
  }

  /**
   * Store update information for UI access
   * @param {Object} updateInfo - Update check result
   */
  storeUpdateInfo(updateInfo) {
    try {
      // Store in localStorage for persistence across sessions
      localStorage.setItem(
        'promptwaffle_update_info',
        JSON.stringify({
          ...updateInfo,
          checkedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      console.warn('Could not store update info:', error);
    }
  }

  /**
   * Get stored update information
   * @returns {Object|null} Stored update info or null
   */
  getStoredUpdateInfo() {
    try {
      const stored = localStorage.getItem('promptwaffle_update_info');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Could not retrieve stored update info:', error);
      return null;
    }
  }

  /**
   * Clear stored update information
   */
  clearStoredUpdateInfo() {
    try {
      localStorage.removeItem('promptwaffle_update_info');
    } catch (error) {
      console.warn('Could not clear stored update info:', error);
    }
  }

  /**
   * Check if update check is needed (not checked recently)
   * @returns {boolean} True if update check is needed
   */
  shouldCheckForUpdates() {
    try {
      const stored = this.getStoredUpdateInfo();
      if (!stored) return true;

      const checkedAt = new Date(stored.checkedAt);
      const now = new Date();
      const hoursSinceLastCheck = (now - checkedAt) / (1000 * 60 * 60);

      // Check once per day
      return hoursSinceLastCheck >= 24;
    } catch (error) {
      console.warn('Error checking if update check is needed:', error);
      return true;
    }
  }

  /**
   * Get latest release info
   * @returns {Object|null} Latest release info
   */
  getLatestRelease() {
    return this.latestRelease;
  }
}

// Create and export singleton instance
const versionChecker = new VersionChecker();
export { versionChecker, CURRENT_VERSION };
