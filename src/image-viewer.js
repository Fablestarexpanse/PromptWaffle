const { ipcRenderer } = require('electron');
// DOM elements
const titleBar = document.getElementById('titleBar');
const imageTitle = document.getElementById('imageTitle');
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const imageLoading = document.getElementById('imageLoading');
const imageContainer = document.getElementById('imageContainer');
const imageElement = document.getElementById('imageElement');
const imageError = document.getElementById('imageError');
const errorFilename = document.getElementById('errorFilename');
// Window state
let isMaximized = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeWindowControls();
  initializeResizeHandles();
  initializeDragHandling();
  feather.replace();
});
// Window Controls
function initializeWindowControls() {
  minimizeBtn.addEventListener('click', () => {
    window.electronAPI.minimizeImageViewer();
  });
  maximizeBtn.addEventListener('click', () => {
    isMaximized = !isMaximized;
    window.electronAPI.maximizeImageViewer();
    updateMaximizeButton();
  });
}
function updateMaximizeButton() {
  const icon = maximizeBtn.querySelector('i');
  if (isMaximized) {
    icon.setAttribute('data-feather', 'minimize-2');
  } else {
    icon.setAttribute('data-feather', 'square');
  }
  feather.replace();
}
// Drag Handling
function initializeDragHandling() {
  titleBar.addEventListener('mousedown', e => {
    if (e.target.closest('.title-bar-controls')) {
      return; // Don't drag when clicking controls
    }
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  });
}
function handleDrag(e) {
  if (!isDragging) return;
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  // Update the drag start position for the next move
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  // Move the window by the delta
  window.electronAPI.moveImageViewer(deltaX, deltaY);
}
function stopDrag() {
  isDragging = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
}
// Resize Handles
function initializeResizeHandles() {
  const handles = {
    resizeN: 'n',
    resizeS: 's',
    resizeE: 'e',
    resizeW: 'w',
    resizeNE: 'ne',
    resizeNW: 'nw',
    resizeSE: 'se',
    resizeSW: 'sw'
  };
  Object.entries(handles).forEach(([id, direction]) => {
    const handle = document.getElementById(id);
    if (handle) {
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        startResize(direction, e);
      });
    }
  });
}
function startResize(direction, e) {
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = window.innerWidth;
  const startHeight = window.innerHeight;
  function handleResize(e) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    let newWidth = startWidth;
    let newHeight = startHeight;
    // Calculate new dimensions based on resize direction
    if (direction.includes('e')) {
      newWidth = Math.max(300, startWidth + deltaX);
    }
    if (direction.includes('w')) {
      newWidth = Math.max(300, startWidth - deltaX);
    }
    if (direction.includes('s')) {
      newHeight = Math.max(200, startHeight + deltaY);
    }
    if (direction.includes('n')) {
      newHeight = Math.max(200, startHeight - deltaY);
    }
    window.electronAPI.setImageViewerSize(newWidth, newHeight);
  }
  function stopResize() {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
}
// Image Loading
ipcRenderer.on('load-image', async (event, imageData) => {
  try {
    showLoading();
    imageTitle.textContent = imageData.filename || 'Live Image Preview';
    // Load image using the path property
    let imageSrc = '';
    try {
      // Normalize the path for file:// protocol
      let normalizedPath = imageData.path;
      // Convert backslashes to forward slashes for file:// protocol
      normalizedPath = normalizedPath.replace(/\\/g, '/');
      // For Windows paths, we need to handle the drive letter properly
      if (normalizedPath.match(/^[a-zA-Z]:/)) {
        // Windows path with drive letter - use file:/// (three slashes)
        imageSrc = `file:///${normalizedPath}`;
      } else if (normalizedPath.startsWith('/')) {
        // Unix-style path - use file:// (two slashes)
        imageSrc = `file://${normalizedPath}`;
      } else {
        // Relative path - use file:// (two slashes)
        imageSrc = `file://${normalizedPath}`;
      }
      // Test if the image loads successfully
      const testImg = new Image();
      testImg.onload = () => {
        // Image loaded successfully
        imageElement.src = imageSrc;
        imageElement.alt = imageData.filename;
        showImage();
      };
      testImg.onerror = async error => {
        // Image failed to load with file:// protocol, try alternative method
        console.error(
          '[Image Viewer] Failed to load image with file:// protocol:',
          imageSrc,
          error
        );
        try {
          // Try to load the image using the electronAPI
          const imageBuffer = await window.electronAPI.loadImageFile(
            imageData.path
          );
          if (imageBuffer) {
            const blob = new Blob([imageBuffer], { type: 'image/png' });
            const dataUrl = URL.createObjectURL(blob);
            imageElement.src = dataUrl;
            imageElement.alt = imageData.filename;
            showImage();
          } else {
            showError(imageData.filename);
          }
        } catch (altError) {
          console.error(
            '[Image Viewer] Alternative loading method also failed:',
            altError
          );
          showError(imageData.filename);
        }
      };
      testImg.src = imageSrc;
    } catch (error) {
      console.error(
        '[Image Viewer] Error loading image for',
        imageData.filename,
        ':',
        error.message
      );
      showError(imageData.filename);
    }
  } catch (error) {
    console.error('[Image Viewer] Error processing image data:', error);
    showError('Unknown image');
  }
});
function showLoading() {
  imageLoading.style.display = 'flex';
  imageContainer.style.display = 'none';
  imageError.style.display = 'none';
}
function showImage() {
  imageLoading.style.display = 'none';
  imageContainer.style.display = 'flex';
  imageError.style.display = 'none';
}
function showError(filename) {
  imageLoading.style.display = 'none';
  imageContainer.style.display = 'none';
  imageError.style.display = 'flex';
  errorFilename.textContent = filename || 'Unknown file';
}
// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'F11') {
    e.preventDefault();
    isMaximized = !isMaximized;
    window.electronAPI.maximizeImageViewer();
    updateMaximizeButton();
  }
});
// Prevent context menu
document.addEventListener('contextmenu', e => {
  e.preventDefault();
});
// Handle window focus/blur for visual feedback
window.addEventListener('focus', () => {
  document.body.classList.add('window-focused');
});
window.addEventListener('blur', () => {
  document.body.classList.remove('window-focused');
});
