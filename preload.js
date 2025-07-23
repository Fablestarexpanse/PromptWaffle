const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  readdir: path => ipcRenderer.invoke('fs-readdir', path),
  createFolder: path => ipcRenderer.invoke('fs-mkdir', path),
  writeFile: (filePath, content) => {
    // Ensure parent directory exists before writing - this will be handled in main process
    return ipcRenderer.invoke('fs-writeFile', filePath, content);
  },
  readFile: path => ipcRenderer.invoke('fs-readFile', path),
  rename: (oldPath, newPath) =>
    ipcRenderer.invoke('fs-rename', oldPath, newPath),
  rm: path => ipcRenderer.invoke('fs-rm', path),
  exists: path => ipcRenderer.invoke('fs-exists', path),
  stat: path => ipcRenderer.invoke('fs-stat', path),
  openDataPath: () => ipcRenderer.invoke('open-data-path'),
  openExternal: url => ipcRenderer.invoke('openExternal', url),
  // Image handling APIs
  saveImage: (imageId, imageBuffer, filename) =>
    ipcRenderer.invoke('save-image', imageId, imageBuffer, filename),
  saveThumbnail: (imageId, thumbnailBuffer, filename) =>
    ipcRenderer.invoke('save-thumbnail', imageId, thumbnailBuffer, filename),
  loadImage: imagePath => ipcRenderer.invoke('load-image', imagePath),
  loadImageFile: imagePath => ipcRenderer.invoke('load-image-file', imagePath),
  loadThumbnail: thumbnailPath =>
    ipcRenderer.invoke('load-thumbnail', thumbnailPath),
  deleteImage: imagePath => ipcRenderer.invoke('delete-image', imagePath),
  deleteThumbnail: thumbnailPath =>
    ipcRenderer.invoke('delete-thumbnail', thumbnailPath),
  imageExists: imagePath => ipcRenderer.invoke('image-exists', imagePath),
  // Clipboard operations
  writeText: text => clipboard.writeText(text),
  readText: () => clipboard.readText(),

  listFiles: dir => ipcRenderer.invoke('fs-listFiles', dir),
  deleteFolder: path => ipcRenderer.invoke('fs-rm', path),
  deleteFolderRecursive: path =>
    ipcRenderer.invoke('fs-rm', path, { recursive: true, force: true }),
  openImageDialog: () => ipcRenderer.invoke('open-image-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  // Image viewer window APIs
  openImageViewer: imageData =>
    ipcRenderer.invoke('open-image-viewer', imageData),
  closeImageViewer: () => ipcRenderer.invoke('close-image-viewer'),
  minimizeImageViewer: () => ipcRenderer.invoke('minimize-image-viewer'),
  maximizeImageViewer: () => ipcRenderer.invoke('maximize-image-viewer'),
  setImageViewerPosition: (x, y) =>
    ipcRenderer.invoke('set-image-viewer-position', x, y),
  setImageViewerSize: (width, height) =>
    ipcRenderer.invoke('set-image-viewer-size', width, height),
  getCurrentPosition: () => ipcRenderer.invoke('get-current-position'),
  moveImageViewer: (deltaX, deltaY) =>
    ipcRenderer.invoke('move-image-viewer', deltaX, deltaY),
  fetchLatestRelease: (repoOwner, repoName) =>
    ipcRenderer.invoke('fetchLatestRelease', repoOwner, repoName)
});

// Auto-updater IPC bridge
contextBridge.exposeInMainWorld('autoUpdaterAPI', {
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateChecking: (callback) => ipcRenderer.on('update-checking', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
  onUpdateError: (callback) => ipcRenderer.on('update-error', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
