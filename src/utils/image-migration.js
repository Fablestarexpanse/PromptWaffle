/**
 * Image Migration Utility
 * Migrates board images from absolute paths to relative paths (app directory)
 */

import { AppState } from '../state/appState.js';
import { showToast } from './index.js';
import { saveBoards, triggerAutosave } from '../bootstrap/state.js';

/**
 * Migrate board images from absolute paths to app directory
 * @returns {Promise<Object>} Migration result
 */
export async function migrateBoardImages() {
  const boards = AppState.getBoards();
  let migratedCount = 0;
  let failedCount = 0;
  const errors = [];

  try {
    for (const board of boards) {
      if (!board.images || !Array.isArray(board.images)) {
        continue;
      }

      for (const image of board.images) {
        // Skip if already using relative path
        if (image.path && image.path.startsWith('snippets/')) {
          continue;
        }

        // Skip if no path
        if (!image.path && !image.imagePath) {
          continue;
        }

        const sourcePath = image.path || image.imagePath;
        
        // Skip if path is already relative or doesn't exist
        if (sourcePath.startsWith('snippets/')) {
          continue;
        }

        try {
          // Check if source file exists
          const exists = await window.electronAPI.stat(sourcePath);
          if (!exists) {
            errors.push(`Source image not found: ${sourcePath} (board: ${board.name})`);
            failedCount++;
            continue;
          }

          // Read the image file
          const imageBuffer = await window.electronAPI.loadImageFile(sourcePath);
          if (!imageBuffer) {
            errors.push(`Failed to read image: ${sourcePath} (board: ${board.name})`);
            failedCount++;
            continue;
          }

          // Get file extension
          const filename = sourcePath.split(/[/\\]/).pop();
          const extension = filename.split('.').pop() || 'png';
          const newFilename = `${image.id}.${extension}`;

          // Copy to app directory
          const saveResult = await window.electronAPI.saveBoardImage(
            board.id,
            Array.from(new Uint8Array(imageBuffer)),
            newFilename
          );

          if (!saveResult || !saveResult.success) {
            errors.push(`Failed to save image: ${filename} (board: ${board.name})`);
            failedCount++;
            continue;
          }

          // Update image path to relative
          image.path = saveResult.relativePath;
          delete image.imagePath; // Remove legacy property if exists

          migratedCount++;
        } catch (error) {
          console.error(`Error migrating image ${sourcePath}:`, error);
          errors.push(`Error migrating ${sourcePath}: ${error.message}`);
          failedCount++;
        }
      }
    }

    // Save boards if any were migrated
    if (migratedCount > 0) {
      await saveBoards();
      triggerAutosave();
    }

    return {
      success: migratedCount > 0 || failedCount === 0,
      migratedCount,
      failedCount,
      errors
    };
  } catch (error) {
    console.error('Error during image migration:', error);
    return {
      success: false,
      migratedCount,
      failedCount,
      errors: [...errors, `Migration error: ${error.message}`]
    };
  }
}

/**
 * Check if migration is needed
 * @returns {Promise<boolean>} True if migration is needed
 */
export async function needsImageMigration() {
  const boards = AppState.getBoards();
  
  for (const board of boards) {
    if (!board.images || !Array.isArray(board.images)) {
      continue;
    }

    for (const image of board.images) {
      const path = image.path || image.imagePath;
      if (path && !path.startsWith('snippets/')) {
        // Found an absolute path, migration needed
        return true;
      }
    }
  }

  return false;
}

/**
 * Prompt user to migrate images
 * @returns {Promise<void>}
 */
export async function promptImageMigration() {
  const needsMigration = await needsImageMigration();
  
  if (!needsMigration) {
    return;
  }

  const confirmed = confirm(
    'Some board images use absolute paths and may not work after moving or reinstalling.\n\n' +
    'Would you like to migrate them to the app directory for better portability?\n\n' +
    'This will copy images to the app directory and update references.'
  );

  if (!confirmed) {
    return;
  }

  showToast('Migrating board images...', 'info');

  const result = await migrateBoardImages();

  if (result.success && result.migratedCount > 0) {
    showToast(`Migrated ${result.migratedCount} image(s) successfully`, 'success');
    if (result.failedCount > 0) {
      console.warn('Some images failed to migrate:', result.errors);
    }
  } else if (result.failedCount > 0) {
    showToast(`Migration completed with ${result.failedCount} error(s)`, 'warning');
    console.error('Migration errors:', result.errors);
  } else {
    showToast('No images needed migration', 'info');
  }
}

