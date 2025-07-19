import { versionChecker } from './version-checker.js';
import { showToast } from './index.js';
class UpdateUI {
  constructor() {
    this.modal = null;
    this.isModalOpen = false;
  }
  /**
   * Initialize the update UI
   */
  init() {
    this.modal = document.getElementById('updateModal');
    if (!this.modal) {
      console.error('Update modal not found');
      return;
    }
    this.setupEventListeners();
  }
  /**
   * Setup event listeners for the update modal
   */
  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('closeUpdateModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    // Download button
    const downloadBtn = document.getElementById('downloadUpdateBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadUpdate());
    }
    // Remind later button
    const remindBtn = document.getElementById('remindLaterBtn');
    if (remindBtn) {
      remindBtn.addEventListener('click', () => this.remindLater());
    }
    // Close on backdrop click
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    // Close on escape key
    document.addEventListener('keydown', e => {
      if (this.isModalOpen && e.key === 'Escape') {
        this.closeModal();
      }
    });
  }
  /**
   * Show the update modal with release information
   * @param {Object} updateInfo - Update check result
   */
  showUpdateModal(updateInfo) {
    if (!this.modal || !updateInfo.success || !updateInfo.isOutdated) {
      return;
    }
    const release = updateInfo.releaseInfo;
    // Update version displays
    const currentVersionDisplay = document.getElementById(
      'currentVersionDisplay'
    );
    const latestVersionDisplay = document.getElementById(
      'latestVersionDisplay'
    );
    if (currentVersionDisplay) {
      currentVersionDisplay.textContent = updateInfo.currentVersion;
    }
    if (latestVersionDisplay) {
      latestVersionDisplay.textContent = updateInfo.latestVersion;
    }
    // Update release info
    const releaseName = document.getElementById('releaseName');
    const releaseDate = document.getElementById('releaseDate');
    if (releaseName) {
      releaseName.textContent = release.name || `Version ${release.version}`;
    }
    if (releaseDate) {
      const date = new Date(release.published_at);
      releaseDate.textContent = `Released on ${date.toLocaleDateString()}`;
    }
    // Update changelog
    const changelogContent = document.getElementById('changelogContent');
    if (changelogContent) {
      if (release.body) {
        changelogContent.textContent = release.body;
      } else {
        changelogContent.textContent =
          'No changelog available for this release.';
      }
    }
    // Show modal
    this.modal.style.display = 'flex';
    this.isModalOpen = true;
    // Ensure feather icons are rendered
    try {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (error) {
      console.warn('Error replacing feather icons:', error);
    }
  }
  /**
   * Close the update modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isModalOpen = false;
    }
  }
  /**
   * Handle download update button click
   */
  downloadUpdate() {
    const latestRelease = versionChecker.getLatestRelease();
    if (latestRelease && latestRelease.html_url) {
      // Open the release page in the default browser
      try {
        // Use Electron's shell to open external URL
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(latestRelease.html_url);
        } else {
          // Fallback to window.open
          window.open(latestRelease.html_url, '_blank');
        }
        showToast('Opening download page...', 'success');
        this.closeModal();
      } catch (error) {
        console.error('Error opening download page:', error);
        showToast('Error opening download page', 'error');
      }
    } else {
      showToast('Download link not available', 'error');
    }
  }
  /**
   * Handle remind later button click
   */
  remindLater() {
    // Store a reminder timestamp (remind in 7 days)
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 7);
      localStorage.setItem(
        'promptwaffle_update_reminder',
        reminderDate.toISOString()
      );
      showToast('Reminder set for 7 days from now', 'info');
    } catch (error) {
      console.warn('Could not set update reminder:', error);
    }
    this.closeModal();
  }
  /**
   * Check if update reminder is due
   * @returns {boolean} True if reminder is due
   */
  isReminderDue() {
    try {
      const reminderDate = localStorage.getItem('promptwaffle_update_reminder');
      if (!reminderDate) return true;
      const reminder = new Date(reminderDate);
      const now = new Date();
      return now >= reminder;
    } catch (error) {
      console.warn('Error checking update reminder:', error);
      return true;
    }
  }
  /**
   * Clear update reminder
   */
  clearReminder() {
    try {
      localStorage.removeItem('promptwaffle_update_reminder');
    } catch (error) {
      console.warn('Could not clear update reminder:', error);
    }
  }
  /**
   * Show update notification based on stored info
   */
  showStoredUpdateNotification() {
    const storedInfo = versionChecker.getStoredUpdateInfo();
    if (storedInfo && storedInfo.isOutdated && this.isReminderDue()) {
      this.showUpdateModal(storedInfo);
      return true;
    }
    return false;
  }
}
// Create and export singleton instance
const updateUI = new UpdateUI();
export { updateUI };
