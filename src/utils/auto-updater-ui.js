import { showToast } from './index.js';

class AutoUpdaterUI {
  constructor() {
    this.isDownloading = false;
    this.downloadProgress = 0;
    this.setupEventListeners();
  }

  /**
   * Setup auto-updater event listeners
   */
  setupEventListeners() {
    if (!window.autoUpdaterAPI) {
      console.warn('Auto-updater API not available');
      return;
    }

    // Update checking
    window.autoUpdaterAPI.onUpdateChecking(() => {
      console.log('Checking for updates...');
    });

    // Update available
    window.autoUpdaterAPI.onUpdateAvailable((event, info) => {
      console.log('Update available:', info);
      this.showUpdateAvailableModal(info);
    });

    // Update not available
    window.autoUpdaterAPI.onUpdateNotAvailable((event, info) => {
      console.log('Update not available:', info);
      showToast('You are running the latest version!', 'success');
    });

    // Update error
    window.autoUpdaterAPI.onUpdateError((event, error) => {
      console.error('Update error:', error);
      showToast(`Update error: ${error}`, 'error');
    });

    // Download progress
    window.autoUpdaterAPI.onDownloadProgress((event, progressObj) => {
      this.updateDownloadProgress(progressObj);
    });

    // Update downloaded
    window.autoUpdaterAPI.onUpdateDownloaded((event, info) => {
      console.log('Update downloaded:', info);
      this.showInstallUpdateModal(info);
    });
  }

  /**
   * Show modal when update is available
   */
  showUpdateAvailableModal(info) {
    const modal = document.getElementById('autoUpdateModal');
    if (!modal) {
      this.createAutoUpdateModal();
    }

    const modalElement = document.getElementById('autoUpdateModal');
    const versionInfo = document.getElementById('autoUpdateVersionInfo');
    const downloadBtn = document.getElementById('autoUpdateDownloadBtn');
    const skipBtn = document.getElementById('autoUpdateSkipBtn');

    if (versionInfo) {
      versionInfo.textContent = `Version ${info.version} is available`;
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => this.startDownload();
    }

    if (skipBtn) {
      skipBtn.onclick = () => this.closeAutoUpdateModal();
    }

    modalElement.style.display = 'flex';
  }

  /**
   * Show modal when update is downloaded and ready to install
   */
  showInstallUpdateModal(info) {
    const modal = document.getElementById('autoUpdateInstallModal');
    if (!modal) {
      this.createAutoUpdateInstallModal();
    }

    const modalElement = document.getElementById('autoUpdateInstallModal');
    const versionInfo = document.getElementById('autoUpdateInstallVersionInfo');
    const installBtn = document.getElementById('autoUpdateInstallBtn');
    const laterBtn = document.getElementById('autoUpdateLaterBtn');

    if (versionInfo) {
      versionInfo.textContent = `Version ${info.version} is ready to install`;
    }

    if (installBtn) {
      installBtn.onclick = () => this.installUpdate();
    }

    if (laterBtn) {
      laterBtn.onclick = () => this.closeAutoUpdateInstallModal();
    }

    modalElement.style.display = 'flex';
  }

  /**
   * Start downloading the update
   */
  async startDownload() {
    if (this.isDownloading) return;

    this.isDownloading = true;
    this.downloadProgress = 0;

    try {
      // Show download progress modal
      this.showDownloadProgressModal();

      const result = await window.autoUpdaterAPI.downloadUpdate();
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Download failed:', error);
      showToast(`Download failed: ${error.message}`, 'error');
      this.closeDownloadProgressModal();
      this.isDownloading = false;
    }
  }

  /**
   * Install the downloaded update
   */
  installUpdate() {
    try {
      window.autoUpdaterAPI.installUpdate();
    } catch (error) {
      console.error('Install failed:', error);
      showToast(`Install failed: ${error.message}`, 'error');
    }
  }

  /**
   * Update download progress
   */
  updateDownloadProgress(progressObj) {
    this.downloadProgress = progressObj.percent || 0;
    
    const progressBar = document.getElementById('autoUpdateProgressBar');
    const progressText = document.getElementById('autoUpdateProgressText');
    
    if (progressBar) {
      progressBar.style.width = `${this.downloadProgress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Downloading... ${Math.round(this.downloadProgress)}%`;
    }
  }

  /**
   * Create auto-update modal
   */
  createAutoUpdateModal() {
    const modal = document.createElement('div');
    modal.id = 'autoUpdateModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content update-modal-content">
        <div class="update-header">
          <h3>🔄 Update Available</h3>
          <button class="close-btn" onclick="this.closest('.modal').style.display='none'" title="Close">
            <i data-feather="x"></i>
          </button>
        </div>
        <div class="update-info">
          <p id="autoUpdateVersionInfo">A new version is available</p>
          <p>Would you like to download and install it now?</p>
        </div>
        <div class="update-actions">
          <button id="autoUpdateDownloadBtn" class="primary-btn">
            <i data-feather="download"></i>
            Download & Install
          </button>
          <button id="autoUpdateSkipBtn" class="secondary-btn">
            <i data-feather="x"></i>
            Skip for Now
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Create download progress modal
   */
  createDownloadProgressModal() {
    const modal = document.createElement('div');
    modal.id = 'autoUpdateDownloadModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content update-modal-content">
        <div class="update-header">
          <h3>📥 Downloading Update</h3>
        </div>
        <div class="update-info">
          <p>Downloading the latest version...</p>
          <div class="progress-container">
            <div class="progress-bar">
              <div id="autoUpdateProgressBar" class="progress-fill"></div>
            </div>
            <p id="autoUpdateProgressText">Downloading... 0%</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Create install update modal
   */
  createAutoUpdateInstallModal() {
    const modal = document.createElement('div');
    modal.id = 'autoUpdateInstallModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content update-modal-content">
        <div class="update-header">
          <h3>✅ Update Ready</h3>
          <button class="close-btn" onclick="this.closest('.modal').style.display='none'" title="Close">
            <i data-feather="x"></i>
          </button>
        </div>
        <div class="update-info">
          <p id="autoUpdateInstallVersionInfo">The update is ready to install</p>
          <p>The application will restart to complete the installation.</p>
        </div>
        <div class="update-actions">
          <button id="autoUpdateInstallBtn" class="primary-btn">
            <i data-feather="refresh-cw"></i>
            Install & Restart
          </button>
          <button id="autoUpdateLaterBtn" class="secondary-btn">
            <i data-feather="clock"></i>
            Install Later
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Show download progress modal
   */
  showDownloadProgressModal() {
    const modal = document.getElementById('autoUpdateDownloadModal');
    if (!modal) {
      this.createDownloadProgressModal();
    }
    
    const modalElement = document.getElementById('autoUpdateDownloadModal');
    modalElement.style.display = 'flex';
  }

  /**
   * Close download progress modal
   */
  closeDownloadProgressModal() {
    const modal = document.getElementById('autoUpdateDownloadModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Close auto-update modal
   */
  closeAutoUpdateModal() {
    const modal = document.getElementById('autoUpdateModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Close auto-update install modal
   */
  closeAutoUpdateInstallModal() {
    const modal = document.getElementById('autoUpdateInstallModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    if (window.autoUpdaterAPI) {
      window.autoUpdaterAPI.removeAllListeners('update-checking');
      window.autoUpdaterAPI.removeAllListeners('update-available');
      window.autoUpdaterAPI.removeAllListeners('update-not-available');
      window.autoUpdaterAPI.removeAllListeners('update-error');
      window.autoUpdaterAPI.removeAllListeners('download-progress');
      window.autoUpdaterAPI.removeAllListeners('update-downloaded');
    }
  }
}

export const autoUpdaterUI = new AutoUpdaterUI(); 