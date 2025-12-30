import { AppState, CONSTANTS, UI_CONSTANTS } from '../state/appState.js';
import { showCenteredWarning, showToast } from '../utils/index.js';
import {
  saveBoards,
  triggerAutosave,
  getActiveBoard,
  schedulePartialSidebarUpdate,
  getSidebarState,
  applySidebarState,
  cleanupOrphanedCards,
  renderSidebar,
  renderBoard,
  loadInitialData,
  restoreUIState as restoreStateUI
} from './index.js';
export function createImageThumbnail(imageData, maxSize = 150) {
  return new Promise((resolve, reject) => {
    try {
      if (!imageData || typeof imageData !== 'string') {
        reject(new Error('Invalid image data provided'));
        return;
      }
      if (typeof maxSize !== 'number' || maxSize <= 0) {
        maxSize = 150; // Default fallback
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate thumbnail dimensions
          let { width, height } = img;
          if (width <= 0 || height <= 0) {
            reject(new Error('Invalid image dimensions'));
            return;
          }
          const aspectRatio = width / height;
          if (width > height) {
            width = Math.min(width, maxSize);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxSize);
            width = height * aspectRatio;
          }
          // Ensure minimum dimensions
          width = Math.max(width, 1);
          height = Math.max(height, 1);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(new Error(`Error processing image: ${error.message}`));
        }
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = imageData;
    } catch (error) {
      reject(new Error(`Error creating thumbnail: ${error.message}`));
    }
  });
}
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    try {
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file provided'));
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        try {
          if (e.target && e.target.result) {
            resolve(e.target.result);
          } else {
            reject(new Error('No result from file reader'));
          }
        } catch (error) {
          reject(new Error(`Error processing file result: ${error.message}`));
        }
      };
      reader.onerror = error => {
        reject(
          new Error(`File read error: ${error.message || 'Unknown error'}`)
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Error setting up file reader: ${error.message}`));
    }
  });
}
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    try {
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file provided'));
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        try {
          if (e.target && e.target.result) {
            resolve(new Uint8Array(e.target.result));
          } else {
            reject(new Error('No result from file reader'));
          }
        } catch (error) {
          reject(new Error(`Error processing file result: ${error.message}`));
        }
      };
      reader.onerror = error => {
        reject(
          new Error(`File read error: ${error.message || 'Unknown error'}`)
        );
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      reject(new Error(`Error setting up file reader: ${error.message}`));
    }
  });
}
export function dataURLToBuffer(dataURL) {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
// Validate and cleanup missing images
async function validateAndCleanupImages(board) {
  if (!board || !board.images || !Array.isArray(board.images)) {
    return 0;
  }
  const validImages = [];
  let removedCount = 0;
  for (const image of board.images) {
    try {
      // Check if the image file exists
      const exists = await window.electronAPI.stat(image.path);
      if (exists) {
        validImages.push(image);
      } else {
        removedCount++;
      }
    } catch (error) {
      removedCount++;
    }
  }
  if (removedCount > 0) {
    board.images = validImages;
    await saveBoards();
    triggerAutosave();
    showToast(
      `Removed ${removedCount} missing image${removedCount === 1 ? '' : 's'}`,
      'info'
    );
  }
  return validImages.length;
}
// Reference image selection and display logic
export async function handleReferenceImageUpload() {
  if (!window.electronAPI || !window.electronAPI.openImageDialog) {
    showToast('File picker API not available', 'error');
    return;
  }
  const result = await window.electronAPI.openImageDialog();
  if (result.canceled || !result.filePaths || !result.filePaths.length) {
    return;
  }
  const activeBoard = getActiveBoard();
  if (!activeBoard) {
    showToast('Please select a board first', 'error');
    return;
  }
  if (!activeBoard.images) {
    activeBoard.images = [];
  }
  // Validate and cleanup missing images before checking count
  const validImageCount = await validateAndCleanupImages(activeBoard);
  const maxImages = 6;
  const newImageCount = result.filePaths.length;
  if (validImageCount >= maxImages) {
    showCenteredWarning(
      `This board already has the maximum of ${maxImages} images. Please remove one before adding more.`
    );
    return;
  }
  if (validImageCount + newImageCount > maxImages) {
    const remainingSlots = maxImages - validImageCount;
    showCenteredWarning(
      `You can only add ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} to this board (max ${maxImages} total). Please select fewer images or remove some existing ones first.`
    );
    return;
  }
  // Process each selected image
  for (const filePath of result.filePaths) {
    let loadingThumb = null;
    try {
      const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const originalFilename = filePath.split(/[/\\]/).pop();
      
      // Show loading indicator in the UI
      const container = document.getElementById('referenceImagesContainer');
      if (container) {
        loadingThumb = document.createElement('div');
        loadingThumb.className = 'reference-image-thumb loading-thumb';
        loadingThumb.style.width = '120px';
        loadingThumb.style.height = '120px';
        loadingThumb.style.minWidth = '120px';
        loadingThumb.style.minHeight = '120px';
        loadingThumb.style.maxWidth = '120px';
        loadingThumb.style.maxHeight = '120px';
        loadingThumb.style.overflow = 'hidden';
        loadingThumb.style.borderRadius = '8px';
        loadingThumb.style.display = 'flex';
        loadingThumb.style.alignItems = 'center';
        loadingThumb.style.justifyContent = 'center';
        loadingThumb.style.background = 'var(--bg-input)';
        loadingThumb.style.border = '1px solid var(--border-subtle)';
        loadingThumb.innerHTML = `
          <div style="text-align: center; color: var(--text-secondary);">
            <div style="width: 32px; height: 32px; border: 3px solid var(--border-subtle); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 8px;"></div>
            <div style="font-size: 11px;">Loading...</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${originalFilename}</div>
          </div>
        `;
        
        // Add to grid if it exists, otherwise append directly
        const imagesGrid = container.querySelector('.reference-images-grid');
        if (imagesGrid) {
          imagesGrid.appendChild(loadingThumb);
        } else {
          // Create grid if it doesn't exist
          const grid = document.createElement('div');
          grid.className = 'reference-images-grid';
          grid.appendChild(loadingThumb);
          container.appendChild(grid);
        }
      }
      
      // Read the image file
      showToast(`Processing image: ${originalFilename}...`, 'info');
      const imageBuffer = await window.electronAPI.loadImageFile(filePath);
      if (!imageBuffer) {
        if (loadingThumb) loadingThumb.remove();
        showToast(`Failed to read image: ${originalFilename}`, 'error');
        continue;
      }
      
      // Get file extension
      const extension = originalFilename.split('.').pop() || 'png';
      const newFilename = `${imageId}.${extension}`;
      
      // Copy image to app directory for portability
      showToast(`Saving image: ${originalFilename}...`, 'info');
      const saveResult = await window.electronAPI.saveBoardImage(
        activeBoard.id,
        Array.from(new Uint8Array(imageBuffer)),
        newFilename
      );
      
      if (!saveResult || !saveResult.success) {
        if (loadingThumb) loadingThumb.remove();
        showToast(`Failed to save image: ${originalFilename}`, 'error');
        continue;
      }
      
      // Create image object with relative path
      const imageObj = {
        id: imageId,
        filename: originalFilename,
        path: saveResult.relativePath, // Relative path for portability
        addedAt: new Date().toISOString()
      };
      
      activeBoard.images.push(imageObj);
      
      // Remove loading indicator - the image will appear when renderBoardImages is called
      if (loadingThumb) loadingThumb.remove();
      showToast(`Added reference image: ${originalFilename}`, 'success');
    } catch (error) {
      console.error('Error processing image:', error);
      showToast(`Error adding image: ${error.message}`, 'error');
      // Remove loading indicator on error
      if (loadingThumb) loadingThumb.remove();
    }
  }
  await saveBoards();
  triggerAutosave();
  // Re-render board images to show the newly added images
  await renderBoardImages();
  if (activeBoard) {
    schedulePartialSidebarUpdate(activeBoard.id);
  }
}
// Render reference image thumbnails for the current board
export async function renderBoardImages() {
  const activeBoard = getActiveBoard();
  const container = document.getElementById('referenceImagesContainer');
  if (!container) return;
  container.innerHTML = '';
  
  // Validate and cleanup missing images before rendering
  if (activeBoard && activeBoard.images && activeBoard.images.length > 0) {
    await validateAndCleanupImages(activeBoard);
  }
  
  // Show board images if any exist
  if (
    activeBoard &&
    Array.isArray(activeBoard.images) &&
    activeBoard.images.length > 0
  ) {
    // Create grid container for images
    const imagesGrid = document.createElement('div');
    imagesGrid.className = 'reference-images-grid';
    
    // Show up to 6 images
    for (const imageObj of activeBoard.images.slice(0, 6)) {
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'reference-image-thumb';
      thumbDiv.title = imageObj.filename;
      // Ensure thumbnail has fixed dimensions
      thumbDiv.style.width = '120px';
      thumbDiv.style.height = '120px';
      thumbDiv.style.minWidth = '120px';
      thumbDiv.style.minHeight = '120px';
      thumbDiv.style.maxWidth = '120px';
      thumbDiv.style.maxHeight = '120px';
      thumbDiv.style.overflow = 'hidden';
      thumbDiv.style.borderRadius = '8px';
      
      const img = document.createElement('img');
      // Handle both relative (new) and absolute (legacy) paths
      let imageSrc = '';
      if (imageObj.path && imageObj.path.startsWith('snippets/')) {
        // Relative path - load via IPC and create blob URL
        try {
          const imageData = await window.electronAPI.loadImage(imageObj.path);
          if (imageData && Array.isArray(imageData) && imageData.length > 0) {
            // Convert array to Uint8Array
            const uint8Array = new Uint8Array(imageData);
            // Determine MIME type from filename
            const ext = imageObj.filename.split('.').pop()?.toLowerCase() || 'png';
            const mimeTypes = {
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'webp': 'image/webp',
              'bmp': 'image/bmp'
            };
            const mimeType = mimeTypes[ext] || 'image/png';
            const blob = new Blob([uint8Array], { type: mimeType });
            imageSrc = URL.createObjectURL(blob);
          } else {
            // Fallback: try file:// protocol (may not work for relative paths)
            imageSrc = `file:///${imageObj.path.replace(/\\/g, '/')}`;
          }
        } catch (e) {
          console.warn('Error loading relative path image, trying fallback:', e);
          // Fallback: try file:// protocol
          imageSrc = `file:///${imageObj.path.replace(/\\/g, '/')}`;
        }
      } else {
        // Absolute path (legacy) - use as-is
        const path = imageObj.path || imageObj.imagePath || '';
        imageSrc = `file://${path.replace(/\\/g, '/')}`;
      }
      // Set image styling to ensure it fits within the thumbnail container
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      img.src = imageSrc;
      img.alt = imageObj.filename;
      img.onerror = () => {
        img.src = '';
        img.alt = 'Missing Image';
        thumbDiv.innerHTML =
          '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;font-size:12px;background:#eee;">Missing Image</div>';
      };
      thumbDiv.appendChild(img);
      // Add controls overlay
      const controlsOverlay = document.createElement('div');
      controlsOverlay.className = 'controls-overlay';
      // Expand button (top)
      const expandBtn = document.createElement('button');
      expandBtn.innerHTML = '<i data-feather="maximize-2"></i>';
      expandBtn.title = 'Expand image';
      expandBtn.onclick = e => {
        e.stopPropagation();
        viewFullImage(imageObj.id);
      };
      // Remove button (bottom)
      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '<i data-feather="trash-2"></i>';
      removeBtn.title = 'Remove image';
      removeBtn.className = 'remove-btn';
      removeBtn.onclick = async e => {
        e.stopPropagation();
        try {
          await removeReferenceImage(imageObj.id);
          await renderBoardImages(); // Re-render to update the UI
          showToast(`Removed image: ${imageObj.filename}`, 'success');
        } catch (error) {
          console.error('Error removing image:', error);
          showToast('Error removing image', 'error');
        }
      };
      controlsOverlay.appendChild(expandBtn);
      controlsOverlay.appendChild(removeBtn);
      thumbDiv.appendChild(controlsOverlay);
      imagesGrid.appendChild(thumbDiv);
    }
    
    // Add the grid to the container
    container.appendChild(imagesGrid);
  }
  // Add live preview thumbnail if monitoring a folder
  if (currentMonitoredFolder) {
    // Remove any existing live preview thumbnails first
    const existingLiveThumbs = document.querySelectorAll('.live-preview-thumb');
    existingLiveThumbs.forEach(thumb => thumb.remove());
    
    // Render live preview in the dedicated container
    const livePreviewContainer = document.getElementById('livePreviewContainer');
    if (livePreviewContainer) {
      await renderLivePreviewThumbnail(livePreviewContainer);
    }
  } else {
    // Clear live preview container if not monitoring
    const livePreviewContainer = document.getElementById('livePreviewContainer');
    if (livePreviewContainer) {
      livePreviewContainer.innerHTML = '';
    }
  }
  // Container visibility is now handled by CSS based on content
  // Replace Feather icons in the newly created controls
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}
async function renderLivePreviewThumbnail(container) {
  try {
    // Get the latest image from the monitored folder
    const files = await window.electronAPI.readdir(currentMonitoredFolder);
    // Filter for image files and get their stats
    const imageFiles = [];
    for (const file of files) {
      if (file.isFile) {
        const fileName = file.name.toLowerCase();
        if (
          fileName.endsWith('.png') ||
          fileName.endsWith('.jpg') ||
          fileName.endsWith('.jpeg') ||
          fileName.endsWith('.webp') ||
          fileName.endsWith('.gif') ||
          fileName.endsWith('.bmp')
        ) {
          const filePath = `${currentMonitoredFolder}/${file.name}`;
          const stats = await window.electronAPI.stat(filePath);
          if (stats) {
            imageFiles.push({
              name: file.name,
              path: filePath,
              mtime: new Date(stats.mtime),
              size: stats.size
            });
          }
        }
      }
    }
    // Sort by modification time (newest first)
    imageFiles.sort((a, b) => b.mtime - a.mtime);
    if (imageFiles.length > 0) {
      const latestImage = imageFiles[0];
      const imagePath = latestImage.path.replace(/\\/g, '/'); // Normalize path separators
      // Create live preview thumbnail
      const liveThumbDiv = document.createElement('div');
      liveThumbDiv.className = 'live-preview-thumb';
      liveThumbDiv.title = `Live: ${latestImage.name}`;
      liveThumbDiv.style.display = 'inline-block';
      liveThumbDiv.style.margin = '0'; // No extra margin needed in dedicated container
      liveThumbDiv.style.verticalAlign = 'top';
      liveThumbDiv.style.width = '96px';
      liveThumbDiv.style.height = '96px';
      liveThumbDiv.style.background = '#23272e';
      liveThumbDiv.style.borderRadius = '8px';
      liveThumbDiv.style.overflow = 'hidden';
      liveThumbDiv.style.position = 'relative';
      liveThumbDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      liveThumbDiv.style.border = '2px solid #7289da'; // Blue border to indicate live preview
      liveThumbDiv.style.borderLeft = '4px solid #7289da'; // Extra left border for separation
      const img = document.createElement('img');
      img.src = `file://${imagePath}`;
      img.alt = `Live: ${latestImage.name}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.onload = () => {
        // Image loaded successfully
      };
      img.onerror = () => {
        console.error('[Live Preview] Failed to load image:', imagePath);
        img.src = '';
        img.style.background = '#eee';
        img.style.color = '#888';
        img.style.display = 'flex';
        img.style.alignItems = 'center';
        img.style.justifyContent = 'center';
        img.style.fontSize = '12px';
        img.style.fontWeight = 'bold';
        img.alt = 'Live Preview Error';
        liveThumbDiv.innerHTML =
          '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;font-size:12px;">Live Preview Error</div>';
      };
      liveThumbDiv.appendChild(img);
      // Add live indicator
      const liveIndicator = document.createElement('div');
      liveIndicator.style.position = 'absolute';
      liveIndicator.style.top = '4px';
      liveIndicator.style.left = '4px';
      liveIndicator.style.background = '#7289da';
      liveIndicator.style.color = 'white';
      liveIndicator.style.padding = '2px 6px';
      liveIndicator.style.borderRadius = '4px';
      liveIndicator.style.fontSize = '10px';
      liveIndicator.style.fontWeight = 'bold';
      liveIndicator.textContent = 'LIVE';
      liveThumbDiv.appendChild(liveIndicator);
      // Add "Newest Generation" label at the bottom
      const newestLabel = document.createElement('div');
      newestLabel.style.position = 'absolute';
      newestLabel.style.bottom = '0';
      newestLabel.style.left = '0';
      newestLabel.style.right = '0';
      newestLabel.style.background = 'rgba(0, 0, 0, 0.8)';
      newestLabel.style.color = 'white';
      newestLabel.style.padding = '4px 6px';
      newestLabel.style.fontSize = '10px';
      newestLabel.style.fontWeight = 'bold';
      newestLabel.style.textAlign = 'center';
      newestLabel.style.borderBottomLeftRadius = '6px';
      newestLabel.style.borderBottomRightRadius = '6px';
      newestLabel.textContent = 'NEWEST GENERATION';
      liveThumbDiv.appendChild(newestLabel);
      // Add click handler to the entire thumbnail as a fallback
      liveThumbDiv.onclick = e => {
        if (!e.target.closest('.controls-overlay')) {
          // Only trigger if not clicking on controls
          const imageData = {
            filename: latestImage.name,
            path: imagePath,
            mtime: latestImage.mtime,
            size: latestImage.size
          };

          window.electronAPI.openImageViewer(imageData);
        }
      };
      // Add controls overlay
      const controlsOverlay = document.createElement('div');
      controlsOverlay.className = 'controls-overlay';
      controlsOverlay.style.position = 'absolute';
      controlsOverlay.style.top = '4px';
      controlsOverlay.style.right = '4px';
      controlsOverlay.style.display = 'flex';
      controlsOverlay.style.flexDirection = 'column';
      controlsOverlay.style.gap = '4px';
      controlsOverlay.style.zIndex = '10';
      controlsOverlay.style.opacity = '0';
      controlsOverlay.style.transition = 'opacity 0.2s ease';
      
      // Expand button - opens in modal like other thumbnails
      const expandBtn = document.createElement('button');
      expandBtn.innerHTML = '<i data-feather="maximize-2"></i>';
      expandBtn.title = 'View full size';
      expandBtn.style.cursor = 'pointer';
      expandBtn.style.background = '#40444b';
      expandBtn.style.border = 'none';
      expandBtn.style.borderRadius = '4px';
      expandBtn.style.color = '#dcddde';
      expandBtn.style.padding = '4px';
      expandBtn.style.width = '24px';
      expandBtn.style.height = '24px';
      expandBtn.style.display = 'flex';
      expandBtn.style.alignItems = 'center';
      expandBtn.style.justifyContent = 'center';
      expandBtn.style.transition = 'all 0.2s ease';
      expandBtn.style.opacity = '0.8';
      expandBtn.onclick = e => {
        e.stopPropagation();
        e.preventDefault();
        // Open the live preview image in a modal
        viewLivePreviewImage(latestImage.name, imagePath);
      };
      expandBtn.onmouseenter = () => {
        expandBtn.style.background = '#5865f2';
        expandBtn.style.opacity = '1';
        expandBtn.style.transform = 'scale(1.1)';
      };
      expandBtn.onmouseleave = () => {
        expandBtn.style.background = '#40444b';
        expandBtn.style.opacity = '0.8';
        expandBtn.style.transform = 'scale(1)';
      };
      controlsOverlay.appendChild(expandBtn);
      
      // Show controls on hover
      liveThumbDiv.onmouseenter = () => {
        controlsOverlay.style.opacity = '1';
      };
      liveThumbDiv.onmouseleave = () => {
        controlsOverlay.style.opacity = '0';
      };
      
      liveThumbDiv.appendChild(controlsOverlay);
      container.appendChild(liveThumbDiv);
      // Initialize Feather icons for the new buttons
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } else {
      // Create placeholder thumbnail when no images found
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'live-preview-thumb-placeholder';
      placeholderDiv.title = 'No images found in monitored folder';
      placeholderDiv.style.display = 'inline-block';
      placeholderDiv.style.margin = '0 8px 8px 128px'; // Extra right margin to separate from regular thumbnails
      placeholderDiv.style.verticalAlign = 'top';
      placeholderDiv.style.width = '96px';
      placeholderDiv.style.height = '96px';
      placeholderDiv.style.background = '#ff4444'; // Red background
      placeholderDiv.style.borderRadius = '8px';
      placeholderDiv.style.overflow = 'hidden';
      placeholderDiv.style.position = 'relative';
      placeholderDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      placeholderDiv.style.border = '2px solid #ff6666';
      placeholderDiv.style.borderLeft = '4px solid #ff6666'; // Extra left border for separation
      placeholderDiv.style.display = 'flex';
      placeholderDiv.style.alignItems = 'center';
      placeholderDiv.style.justifyContent = 'center';
      placeholderDiv.style.color = 'white';
      placeholderDiv.style.fontSize = '12px';
      placeholderDiv.style.fontWeight = 'bold';
      placeholderDiv.style.textAlign = 'center';
      placeholderDiv.innerHTML = 'LIVE<br>NO IMAGES';
      // Add live indicator
      const liveIndicator = document.createElement('div');
      liveIndicator.style.position = 'absolute';
      liveIndicator.style.top = '4px';
      liveIndicator.style.left = '4px';
      liveIndicator.style.background = '#7289da';
      liveIndicator.style.color = 'white';
      liveIndicator.style.padding = '2px 6px';
      liveIndicator.style.borderRadius = '4px';
      liveIndicator.style.fontSize = '10px';
      liveIndicator.style.fontWeight = 'bold';
      liveIndicator.textContent = 'LIVE';
      placeholderDiv.appendChild(liveIndicator);
      // Add "Newest Generation" label at the bottom
      const newestLabel = document.createElement('div');
      newestLabel.style.position = 'absolute';
      newestLabel.style.bottom = '0';
      newestLabel.style.left = '0';
      newestLabel.style.right = '0';
      newestLabel.style.background = 'rgba(0, 0, 0, 0.8)';
      newestLabel.style.color = 'white';
      newestLabel.style.padding = '4px 6px';
      newestLabel.style.fontSize = '10px';
      newestLabel.style.fontWeight = 'bold';
      newestLabel.style.textAlign = 'center';
      newestLabel.style.borderBottomLeftRadius = '6px';
      newestLabel.style.borderBottomRightRadius = '6px';
      newestLabel.textContent = 'NEWEST GENERATION';
      placeholderDiv.appendChild(newestLabel);
      // No controls overlay for placeholder - just the live indicator
      placeholderDiv.appendChild(liveIndicator);
      container.appendChild(placeholderDiv);
      // Initialize Feather icons for the new buttons
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }
  } catch (error) {
    console.error('Error rendering live preview thumbnail:', error);
    // Create error placeholder thumbnail
    const errorDiv = document.createElement('div');
    errorDiv.className = 'live-preview-thumb-error';
    errorDiv.title = 'Error monitoring folder';
    errorDiv.style.display = 'inline-block';
    errorDiv.style.margin = '0 8px 8px 128px'; // Extra right margin to separate from regular thumbnails
    errorDiv.style.verticalAlign = 'top';
    errorDiv.style.width = '96px';
    errorDiv.style.height = '96px';
    errorDiv.style.background = '#ff4444'; // Red background
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.overflow = 'hidden';
    errorDiv.style.position = 'relative';
    errorDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    errorDiv.style.border = '2px solid #ff6666';
    errorDiv.style.borderLeft = '4px solid #ff6666'; // Extra left border for separation
    errorDiv.style.display = 'flex';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.justifyContent = 'center';
    errorDiv.style.color = 'white';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.fontWeight = 'bold';
    errorDiv.style.textAlign = 'center';
    errorDiv.innerHTML = 'LIVE<br>ERROR';
    // Add live indicator
    const liveIndicator = document.createElement('div');
    liveIndicator.style.position = 'absolute';
    liveIndicator.style.top = '4px';
    liveIndicator.style.left = '4px';
    liveIndicator.style.background = '#7289da';
    liveIndicator.style.color = 'white';
    liveIndicator.style.padding = '2px 6px';
    liveIndicator.style.borderRadius = '4px';
    liveIndicator.style.fontSize = '10px';
    liveIndicator.style.fontWeight = 'bold';
    liveIndicator.textContent = 'LIVE';
    errorDiv.appendChild(liveIndicator);
    // Add "Newest Generation" label at the bottom
    const newestLabel = document.createElement('div');
    newestLabel.style.position = 'absolute';
    newestLabel.style.bottom = '0';
    newestLabel.style.left = '0';
    newestLabel.style.right = '0';
    newestLabel.style.background = 'rgba(0, 0, 0, 0.8)';
    newestLabel.style.color = 'white';
    newestLabel.style.padding = '4px 6px';
    newestLabel.style.fontSize = '10px';
    newestLabel.style.fontWeight = 'bold';
    newestLabel.style.textAlign = 'center';
    newestLabel.style.borderBottomLeftRadius = '6px';
    newestLabel.style.borderBottomRightRadius = '6px';
    newestLabel.textContent = 'NEWEST GENERATION';
    errorDiv.appendChild(newestLabel);
    // No controls overlay for error - just the live indicator
    errorDiv.appendChild(liveIndicator);
    container.appendChild(errorDiv);
    // Initialize Feather icons for the new buttons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
}
// Ensure thumbnails are rendered when switching boards
export async function onBoardSwitch() {
  // renderBoardImages() is already called by renderBoard() in setCurrentBoard()
  // No need to call it again here to prevent duplication
}
export function viewLivePreviewImage(filename, imagePath) {
  // Create modal overlay for live preview image
  const overlay = document.createElement('div');
  overlay.className = 'image-viewer-overlay';
  overlay.innerHTML = `
      <div class="image-viewer-content">
        <div class="image-viewer-header">
          <h3>${filename} (Live Preview)</h3>
          <button data-action="close" title="Close">
            <i data-feather="x"></i>
            </button>
          </div>
        <div class="image-viewer-loading">Loading...</div>
        <div class="image-viewer-info">
          Path: ${imagePath}
        </div>
      </div>
    `;
  document.body.appendChild(overlay);
  // Load image using the path property
  let imageSrc = '';
  try {
    // Normalize the path for file:// protocol
    let normalizedPath = imagePath;
    normalizedPath = normalizedPath.replace(/\\/g, '/');
    // For Windows paths, we need to handle the drive letter properly
    if (normalizedPath.match(/^[a-zA-Z]:/)) {
      imageSrc = `file:///${normalizedPath}`;
    } else {
      imageSrc = `file://${normalizedPath}`;
    }
    // Test if the image loads successfully
    const testImg = new Image();
    testImg.onload = () => {
      // Image loaded successfully, replace loading text
      const loadingDiv = overlay.querySelector('.image-viewer-loading');
      loadingDiv.innerHTML = `<img src="${imageSrc}" alt="${filename}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">`;
    };
    testImg.onerror = () => {
      // Image failed to load, show error
      console.warn('Failed to load live preview image:', imagePath);
      const loadingDiv = overlay.querySelector('.image-viewer-loading');
      loadingDiv.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #888; font-size: 16px;">
            <div style="text-align: center;">
              <div style="margin-bottom: 10px;">⚠️</div>
              <div>Image not found</div>
              <div style="font-size: 12px; margin-top: 5px;">${filename}</div>
            </div>
          </div>
        `;
    };
    testImg.src = imageSrc;
  } catch (error) {
    console.warn(
      'Error loading live preview image for',
      filename,
      ':',
      error.message
    );
    const loadingDiv = overlay.querySelector('.image-viewer-loading');
    loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #888; font-size: 16px;">
          <div style="text-align: center;">
            <div style="margin-bottom: 10px;">❌</div>
            <div>Error loading image</div>
            <div style="font-size: 12px; margin-top: 5px;">${filename}</div>
          </div>
        </div>
      `;
  }
  // Add close button event listener
  const closeBtn = overlay.querySelector('[data-action="close"]');
  closeBtn.onclick = () => {
    overlay.remove();
  };
  // Close on background click
  overlay.onclick = e => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
  feather.replace();
}
async function updateLivePreviewThumbnail(latestImage) {
  try {
    // Find the existing live preview thumbnail
    const existingThumb = document.querySelector('.live-preview-thumb');
    if (!existingThumb) {
      await renderBoardImages();
      return;
    }
    if (latestImage) {
      // Update the existing thumbnail with new image
      const imagePath = latestImage.path.replace(/\\/g, '/');
      // Update the image source
      const img = existingThumb.querySelector('img');
      if (img) {
        img.src = `file://${imagePath}`;
        img.alt = `Live: ${latestImage.name}`;
        img.title = `Live: ${latestImage.name}`;
      }
      // Update the title
      existingThumb.title = `Live: ${latestImage.name}`;
      // Update the newest generation label
      const newestLabel = existingThumb.querySelector(
        'div[style*="NEWEST GENERATION"]'
      );
      if (newestLabel) {
        newestLabel.textContent = 'NEWEST GENERATION';
      }
      // Update the expand button click handler with new image data
      const expandBtn = existingThumb.querySelector('.controls-overlay button');
      if (expandBtn) {
        expandBtn.onclick = e => {
          e.stopPropagation();
          // Open the live preview image in a modal with updated data
          viewLivePreviewImage(latestImage.name, imagePath);
        };
      }
    } else {
      // No image found, show placeholder
      const img = existingThumb.querySelector('img');
      if (img) {
        img.src = '';
        img.style.background = '#ff4444';
        img.style.display = 'flex';
        img.style.alignItems = 'center';
        img.style.justifyContent = 'center';
        img.style.color = 'white';
        img.style.fontSize = '12px';
        img.style.fontWeight = 'bold';
        img.alt = 'Live Preview Error';
        existingThumb.innerHTML =
          '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">LIVE<br>NO IMAGES</div>';
      }
      // Add back the live indicator and controls
      const liveIndicator = document.createElement('div');
      liveIndicator.style.position = 'absolute';
      liveIndicator.style.top = '4px';
      liveIndicator.style.left = '4px';
      liveIndicator.style.background = '#7289da';
      liveIndicator.style.color = 'white';
      liveIndicator.style.padding = '2px 6px';
      liveIndicator.style.borderRadius = '4px';
      liveIndicator.style.fontSize = '10px';
      liveIndicator.style.fontWeight = 'bold';
      liveIndicator.textContent = 'LIVE';
      existingThumb.appendChild(liveIndicator);
    }
  } catch (error) {
    console.error('[Live Preview] Error updating thumbnail:', error);
    // Fallback to full re-render if there's an error
    await renderBoardImages();
  }
}
export async function viewFullImage(imageId) {
  const activeBoard = getActiveBoard();
  const image = activeBoard.images?.find(img => img.id === imageId);
  if (!image) return;
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'image-viewer-overlay';
  overlay.innerHTML = `
      <div class="image-viewer-content">
        <div class="image-viewer-header">
          <h3>${image.filename}</h3>
          <button data-action="close" title="Close">
            <i data-feather="x"></i>
          </button>
        </div>
        <div class="image-viewer-loading">Loading...</div>
        <div class="image-viewer-info">
          Path: ${image.path}
        </div>
      </div>
    `;
  document.body.appendChild(overlay);
  // Load image using the path property
  let imageSrc = '';
  let blobUrl = null;
  try {
    // Handle both relative (new) and absolute (legacy) paths
    if (image.path && image.path.startsWith('snippets/')) {
      // Relative path - load via IPC and create blob URL
      try {
        const imageData = await window.electronAPI.loadImage(image.path);
        if (imageData && Array.isArray(imageData) && imageData.length > 0) {
          // Convert array to Uint8Array
          const uint8Array = new Uint8Array(imageData);
          const ext = image.filename.split('.').pop()?.toLowerCase() || 'png';
          const mimeTypes = {
            'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
            'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp'
          };
          const mimeType = mimeTypes[ext] || 'image/png';
          const blob = new Blob([uint8Array], { type: mimeType });
          blobUrl = URL.createObjectURL(blob);
          imageSrc = blobUrl;
        } else {
          imageSrc = `file:///${image.path.replace(/\\/g, '/')}`;
        }
      } catch (e) {
        console.warn('Error loading relative path image:', e);
        imageSrc = `file:///${image.path.replace(/\\/g, '/')}`;
      }
    } else {
      // Absolute path (legacy) - use as-is
      const path = image.path || image.imagePath || '';
      imageSrc = `file://${path.replace(/\\/g, '/')}`;
    }
    // Test if the image loads successfully
    const testImg = new Image();
    testImg.onload = () => {
      // Image loaded successfully, replace loading text
      const loadingDiv = overlay.querySelector('.image-viewer-loading');
      loadingDiv.innerHTML = `<img src="${imageSrc}" alt="${image.filename}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">`;
    };
    testImg.onerror = () => {
      // Clean up blob URL if created
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
      // Image failed to load, show error
      console.warn('Failed to load image:', image.path);
      const loadingDiv = overlay.querySelector('.image-viewer-loading');
      loadingDiv.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #888; font-size: 16px;">
            <div style="text-align: center;">
              <div style="margin-bottom: 10px;">⚠️</div>
              <div>Image not found</div>
              <div style="font-size: 12px; margin-top: 5px;">${image.filename}</div>
            </div>
          </div>
        `;
    };
    testImg.onload = () => {
      // Image loaded successfully, replace loading text
      const loadingDiv = overlay.querySelector('.image-viewer-loading');
      loadingDiv.innerHTML = `<img src="${imageSrc}" alt="${image.filename}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">`;
    };
    testImg.src = imageSrc;
    
    // Clean up blob URL when overlay is removed
    overlay.addEventListener('remove', () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    });
  } catch (error) {
    console.warn('Error loading image for', image.filename, ':', error.message);
    const loadingDiv = overlay.querySelector('.image-viewer-loading');
    loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #888; font-size: 16px;">
          <div style="text-align: center;">
            <div style="margin-bottom: 10px;">❌</div>
            <div>Error loading image</div>
            <div style="font-size: 12px; margin-top: 5px;">${image.filename}</div>
          </div>
        </div>
      `;
  }
  // Add close button event listener
  const closeBtn = overlay.querySelector('[data-action="close"]');
  closeBtn.onclick = () => {
    overlay.remove();
  };
  // Close on background click
  overlay.onclick = e => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
  feather.replace();
}
export async function removeReferenceImage(imageId) {
  const activeBoard = getActiveBoard();
  if (!activeBoard || !activeBoard.images) {
    return;
  }

  const imageIndex = activeBoard.images.findIndex(img => img.id === imageId);
  if (imageIndex === -1) {
    return;
  }

  const image = activeBoard.images[imageIndex];
  
  // Delete image file from app directory if it's a relative path (new format)
  if (image.path && image.path.startsWith('snippets/')) {
    try {
      await window.electronAPI.deleteBoardImage(image.path);
    } catch (error) {
      console.error('Error deleting board image file:', error);
      // Continue with removal even if file deletion fails
    }
  } else if (image.imagePath) {
    // Legacy absolute path handling
    try {
      await window.electronAPI.deleteImage(image.imagePath);
    } catch (error) {
      console.error('Error deleting legacy image file:', error);
    }
  }

  // Remove from board images array
  activeBoard.images.splice(imageIndex, 1);
  await saveBoards();
  triggerAutosave();
  await renderBoardImages();
  // Schedule partial sidebar update for better performance
  schedulePartialSidebarUpdate(activeBoard.id);
  showToast(`Removed image: ${image.filename}`, 'success');
}
export function addImagePreviewToSidebar() {
  // This will be called during sidebar rendering
  document.querySelectorAll('.board-element').forEach(boardElement => {
    const boardId = boardElement.dataset.boardId;
    const board = boards.find(b => b.id === boardId);
    if (board && board.images && board.images.length > 0) {
      // Add image indicator
      const imageIndicator = document.createElement('span');
      imageIndicator.className = 'board-image-indicator';
      imageIndicator.innerHTML = '<i data-feather="image"></i>';
      imageIndicator.title = `${board.images.length} reference image(s)`;
      const boardHeader = boardElement.querySelector('.board-header-left');
      if (boardHeader) {
        boardHeader.appendChild(imageIndicator);
      }
      // Add hover preview
      let previewTimeout;
      boardElement.addEventListener('mouseenter', () => {
        previewTimeout = setTimeout(async () => {
          await showImagePreview(board.images, boardElement);
        }, 500); // 500ms delay
      });
      boardElement.addEventListener('mouseleave', () => {
        clearTimeout(previewTimeout);
        hideImagePreview();
      });
    }
  });
  feather.replace();
}
export async function showImagePreview(images, targetElement) {
  // Remove any existing preview
  hideImagePreview();
  if (!images || images.length === 0) return;
  const preview = document.createElement('div');
  preview.className = 'image-preview-tooltip';
  preview.id = 'imagePreviewTooltip';
  // Create preview container for horizontal layout
  const previewContainer = document.createElement('div');
  previewContainer.className = 'preview-images horizontal-preview';
  // Load thumbnails for all images
  for (const image of images) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'preview-image-wrapper';
    const imgElement = document.createElement('img');
    imgElement.className = 'preview-thumbnail';
    imgElement.alt = image.filename;
    imgElement.title = `${image.filename} - Click to view full size`;
    let imageLoaded = false;
    try {
      // Try to load the full-size original image first for maximum quality
      if (image.imagePath && !imageLoaded) {
        try {
          const originalExists = await window.electronAPI.imageExists(
            image.imagePath
          );
          if (originalExists) {
            try {
              const imageBuffer = await window.electronAPI.loadImage(
                image.imagePath
              );
              const blob = new Blob([imageBuffer], { type: image.type });
              imgElement.src = URL.createObjectURL(blob);
              imageLoaded = true;
            } catch (loadError) {
              console.warn(
                'Failed to load original image for preview:',
                image.filename
              );
            }
          }
        } catch (checkError) {
          console.warn(
            'Could not check if original image exists for preview:',
            image.filename
          );
        }
      }
      // Fall back to thumbnail if original didn't load
      if (image.thumbnailPath && !imageLoaded) {
        try {
          const thumbnailExists = await window.electronAPI.imageExists(
            image.thumbnailPath
          );
          if (thumbnailExists) {
            try {
              const thumbnailBuffer = await window.electronAPI.loadImage(
                image.thumbnailPath
              );
              const blob = new Blob([thumbnailBuffer], { type: image.type });
              imgElement.src = URL.createObjectURL(blob);
              imageLoaded = true;
            } catch (loadError) {
              console.warn(
                'Failed to load thumbnail for preview:',
                image.filename
              );
            }
          }
        } catch (checkError) {
          console.warn(
            'Could not check if thumbnail exists for preview:',
            image.filename
          );
        }
      }
      // Fallback to old data URL format
      if (image.thumbnail && !imageLoaded) {
        imgElement.src = image.thumbnail;
        imageLoaded = true;
      }
      // Final fallback to placeholder
      if (!imageLoaded) {
        console.warn(
          'No valid image source found for preview:',
          image.filename
        );
        imgElement.src =
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2Y4ZjlmYSIgc3Ryb2tlPSIjZGVlMmU2IiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxMjUiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZTwvdGV4dD48dGV4dCB4PSIxMjUiIHk9IjEzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+';
      }
    } catch (error) {
      console.warn(
        'Unexpected error loading image for preview:',
        image.filename,
        ':',
        error.message
      );
      imgElement.src =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2ZmZTZlNiIgc3Ryb2tlPSIjZmJiZGJkIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxMjUiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZDk1MzRmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcnJvcjwvdGV4dD48dGV4dCB4PSIxMjUiIHk9IjEzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZDk1MzRmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2FkaW5nPC90ZXh0Pjx0ZXh0IHg9IjEyNSIgeT0iMTU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNkOTUzNGYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPic=';
    }
    // Add click handler to view full image
    imgElement.style.cursor = 'pointer';
    imgElement.addEventListener('click', e => {
      e.stopPropagation();
      hideImagePreview(); // Hide the preview first
      viewFullImage(image.id); // Then show the full image
    });
    imgWrapper.appendChild(imgElement);
    previewContainer.appendChild(imgWrapper);
  }
  preview.appendChild(previewContainer);
  // Add image count info
  const imageInfo = document.createElement('div');
  imageInfo.className = 'preview-image-info horizontal-info';
  imageInfo.innerHTML = `
      <div class="preview-count-info">${images.length} image${images.length > 1 ? 's' : ''}</div>
    `;
  preview.appendChild(imageInfo);
  // Position the preview
  const rect = targetElement.getBoundingClientRect();
  preview.style.left = `${rect.right + 10}px`;
  preview.style.top = `${rect.top}px`;
  document.body.appendChild(preview);
}
export function hideImagePreview() {
  const preview = document.getElementById('imagePreviewTooltip');
  if (preview) {
    // Clean up object URLs to prevent memory leaks
    const images = preview.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
    preview.remove();
  }
}
export function updateCardColorsButtonState() {
  const toggleColorBtn = document.getElementById('toggleColorBtn');
  if (toggleColorBtn) {
    const showColors = AppState.getShowCompiledColors();
    if (showColors) {
      toggleColorBtn.classList.add('active');
    } else {
      toggleColorBtn.classList.remove('active');
    }
  }
}
export async function refreshUI() {
  try {
    const state = getSidebarState();
    hideImagePreview();
    await loadInitialData();
    applySidebarState(state);
    cleanupOrphanedCards();
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer) {
      renderSidebar(window.sidebarTree, foldersContainer);
    }
    renderBoard();
  } catch (error) {
    console.error('Error refreshing UI:', error);
    showToast('Error refreshing UI. Please try again.', 'error');
  }
}
export function handleSearch(event) {
  const searchTerm = event.target.value;
  AppState.setCurrentSearchTerm(searchTerm);
  const snippets = AppState.getSnippets();

  // Preserve the current expanded state of folders
  const currentState = getSidebarState();
  // Re-render the sidebar with the new search term
  const foldersContainer = document.getElementById('foldersContainer');
  if (foldersContainer && window.sidebarTree) {
    renderSidebar(window.sidebarTree, foldersContainer);
    // Restore the expanded state
    applySidebarState(currentState);
  }
}
// Live Image Preview functionality
let livePreviewInterval = null;
export let currentMonitoredFolder = null;
let lastLivePreviewImage = null; // Track the last image to detect changes
export async function handleFolderSelection() {
  // If already monitoring a folder, stop monitoring
  if (currentMonitoredFolder) {
    await stopLivePreview();
    showToast('Stopped monitoring folder', 'success');
    return;
  }
  // Otherwise, start monitoring a new folder
  if (!window.electronAPI || !window.electronAPI.openFolderDialog) {
    showToast('Folder picker API not available', 'error');
    return;
  }
  const result = await window.electronAPI.openFolderDialog();
  if (result.canceled || !result.filePaths || !result.filePaths.length) {
    return;
  }
  const folderPath = result.filePaths[0];
  await startLivePreview(folderPath);
}
export async function startLivePreview(folderPath) {
  try {
    // Stop any existing monitoring
    if (livePreviewInterval) {
      clearInterval(livePreviewInterval);
    }
    currentMonitoredFolder = folderPath;
    lastLivePreviewImage = null; // Reset the last image tracking
    // Save the monitored folder to app state
    AppState.setMonitoredFolder(folderPath);
    // Trigger autosave to persist the monitored folder
    try {
      const { triggerAutosave } = await import('./state.js');
      triggerAutosave();
    } catch (error) {
      console.error('Failed to trigger autosave:', error);
    }
    // Update the folder button to show current folder
    const setFolderBtn = document.getElementById('setFolderBtn');
    if (setFolderBtn) {
      const folderName = folderPath.split(/[/\\]/).pop();
      setFolderBtn.innerHTML = `<i data-feather="folder"></i>${folderName}`;
      setFolderBtn.title = `Monitoring: ${folderPath}`;
      setFolderBtn.classList.add('monitoring');
      // Update the description to show monitoring status
      const description = setFolderBtn.parentElement.querySelector(
        '.folder-monitor-description'
      );
      if (description) {
        description.textContent = `Monitoring: ${folderName}`;
        description.style.color = '#57f287';
      }
    }
    // Start monitoring and render the live preview thumbnail
    await updateLivePreview();
    livePreviewInterval = setInterval(updateLivePreview, 3000); // Check every 3 seconds
    showToast(
      `Started monitoring folder: ${folderPath.split(/[/\\]/).pop()}`,
      'success'
    );
    // Replace Feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  } catch (error) {
    console.error('Error starting live preview:', error);
    showToast('Error starting live preview', 'error');
  }
}
async function updateLivePreview() {
  if (!currentMonitoredFolder) return;
  try {
    // Get all files in the folder
    const files = await window.electronAPI.readdir(currentMonitoredFolder);
    // Filter for image files and get their stats
    const imageFiles = [];
    for (const file of files) {
      if (file.isFile) {
        const fileName = file.name.toLowerCase();
        if (
          fileName.endsWith('.png') ||
          fileName.endsWith('.jpg') ||
          fileName.endsWith('.jpeg') ||
          fileName.endsWith('.webp') ||
          fileName.endsWith('.gif') ||
          fileName.endsWith('.bmp')
        ) {
          const filePath = `${currentMonitoredFolder}/${file.name}`;
          const stats = await window.electronAPI.stat(filePath);
          if (stats) {
            imageFiles.push({
              name: file.name,
              path: filePath,
              mtime: new Date(stats.mtime),
              size: stats.size
            });
          }
        }
      }
    }
    // Sort by modification time (newest first)
    imageFiles.sort((a, b) => b.mtime - a.mtime);
    // Check if there's a new image
    if (imageFiles.length > 0) {
      const latestImage = imageFiles[0];
      const imageKey = `${latestImage.name}-${latestImage.mtime.getTime()}`;
      // Only update if the image has changed
      if (lastLivePreviewImage !== imageKey) {
        lastLivePreviewImage = imageKey;
        // Update only the live preview thumbnail, not the entire board images
        await updateLivePreviewThumbnail(latestImage);
      }
    } else {
      // No images found, clear the last image
      if (lastLivePreviewImage !== null) {
        lastLivePreviewImage = null;
        await updateLivePreviewThumbnail(null);
      }
    }
  } catch (error) {
    console.error('Error updating live preview:', error);
  }
}
export async function stopLivePreview() {
  if (livePreviewInterval) {
    clearInterval(livePreviewInterval);
    livePreviewInterval = null;
  }
  currentMonitoredFolder = null;
  lastLivePreviewImage = null; // Reset the last image tracking
  // Clear the monitored folder from app state
  AppState.setMonitoredFolder(null);
  // Trigger autosave to persist the change
  try {
    const { triggerAutosave } = await import('./state.js');
    triggerAutosave();
  } catch (error) {
    console.error('Failed to trigger autosave:', error);
  }
  // Remove any existing live preview thumbnails
  const existingLiveThumbs = document.querySelectorAll('.live-preview-thumb');
  existingLiveThumbs.forEach(thumb => thumb.remove());
  // Close the floating image viewer window
  try {
    window.electronAPI.closeImageViewer();
  } catch (error) {
    console.error('Error closing image viewer:', error);
  }
  // Reset the folder button
  const setFolderBtn = document.getElementById('setFolderBtn');
  if (setFolderBtn) {
    setFolderBtn.innerHTML = '<i data-feather="folder"></i>Set Folder';
    setFolderBtn.title = 'Set folder to monitor';
    setFolderBtn.classList.remove('monitoring');
    // Reset the description
    const description = setFolderBtn.parentElement.querySelector(
      '.folder-monitor-description'
    );
    if (description) {
      description.textContent = 'Monitor a folder for new AI-generated images';
      description.style.color = '#72767d';
    }
  }
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}
// Background Color Picker functionality - now uses unified color picker
export function openBackgroundColorPicker() {
  try {
    // Get current background color from the board
    const promptBoard = document.getElementById('promptBoard');
    let currentColor = '#2F3136'; // Default color
    if (promptBoard) {
      const computedStyle = window.getComputedStyle(promptBoard);
      const backgroundColor = computedStyle.backgroundColor;
      // Convert RGB to hex if needed
      if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        currentColor = rgbToHex(backgroundColor);
      }
    }
    // Import and use the unified color picker
    import('../ui/menus/color.js')
      .then(colorModule => {
        colorModule.showBoardBackgroundColorPicker(
          currentColor,
          applyBackgroundColor
        );
      })
      .catch(error => {
        console.error('Error importing color picker:', error);
        showToast('Error opening color picker', 'error');
      });
  } catch (error) {
    console.error('Error opening background color picker:', error);
    showToast('Error opening color picker', 'error');
  }
}
function rgbToHex(rgb) {
  // Convert rgb(r, g, b) to hex
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#2F3136';
}
function isValidHexColor(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}
async function applyBackgroundColor(color) {
  try {
    if (!color || typeof color !== 'string') {
      console.error('Invalid color provided to applyBackgroundColor:', color);
      return;
    }
    if (!isValidHexColor(color)) {
      showToast('Invalid color format', 'error');
      return;
    }
    // Apply the background color to the board
    const promptBoard = document.getElementById('promptBoard');
    if (promptBoard) {
      promptBoard.style.backgroundColor = color;
      // Save the background color to app state
      AppState.setBoardBackgroundColor(color);
      // Trigger autosave
      try {
        const { triggerAutosave } = await import('./state.js');
        triggerAutosave();
      } catch (error) {
        console.error('Failed to trigger autosave:', error);
      }
      showToast(`Background color applied: ${color}`, 'success');
    }
  } catch (error) {
    console.error('Error applying background color:', error);
    showToast('Error applying background color', 'error');
  }
}
