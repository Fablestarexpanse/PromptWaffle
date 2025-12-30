/**
 * Export/Import Utilities
 * Handles exporting all user data to ZIP and importing from ZIP
 */

import { showToast } from './index.js';

/**
 * Export all PromptWaffle data to a ZIP file
 * @returns {Promise<boolean>} Success status
 */
export async function exportAllData() {
  try {
    if (!window.electronAPI || typeof window.electronAPI.exportData !== 'function') {
      showToast('Export functionality not available', 'error');
      return false;
    }

    showToast('Preparing export...', 'info');

    const result = await window.electronAPI.exportData();

    if (result.success) {
      showToast(`Data exported successfully to ${result.filename}`, 'success');
      return true;
    } else {
      showToast(`Export failed: ${result.error || 'Unknown error'}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    showToast(`Export error: ${error.message || 'Failed to export'}`, 'error');
    return false;
  }
}

/**
 * Import PromptWaffle data from a ZIP file
 * @returns {Promise<boolean>} Success status
 */
export async function importData() {
  try {
    if (!window.electronAPI || typeof window.electronAPI.importData !== 'function') {
      showToast('Import functionality not available', 'error');
      return false;
    }

    showToast('Selecting import file...', 'info');

    const result = await window.electronAPI.importData();

    if (result.cancelled) {
      return false;
    }

    if (result.success) {
      showToast('Data imported successfully. Please restart the application.', 'success');
      // Optionally reload the application
      setTimeout(() => {
        if (confirm('Data imported successfully. Restart application to load imported data?')) {
          window.location.reload();
        }
      }, 1000);
      return true;
    } else {
      showToast(`Import failed: ${result.error || 'Unknown error'}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('Error importing data:', error);
    showToast(`Import error: ${error.message || 'Failed to import'}`, 'error');
    return false;
  }
}

/**
 * Verify a backup ZIP file
 * @param {string} zipPath - Path to ZIP file
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBackup(zipPath) {
  try {
    if (!window.electronAPI || typeof window.electronAPI.verifyBackup !== 'function') {
      return { valid: false, error: 'Verification functionality not available' };
    }

    const result = await window.electronAPI.verifyBackup(zipPath);

    return result;
  } catch (error) {
    console.error('Error verifying backup:', error);
    return { valid: false, error: error.message || 'Failed to verify backup' };
  }
}

