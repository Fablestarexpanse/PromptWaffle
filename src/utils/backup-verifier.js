/**
 * Backup Verification Utility
 * Verifies backup completeness and integrity
 */

import { showToast } from './index.js';

/**
 * Verify backup structure and integrity
 * @param {string} backupPath - Path to backup directory
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBackup(backupPath) {
  const issues = [];
  const warnings = [];
  const summary = {
    snippets: 0,
    boards: 0,
    characters: 0,
    characterImages: 0,
    boardImages: 0,
    profiles: 0,
    wildcards: 0
  };

  try {
    // Check required folders
    const requiredFolders = ['snippets', 'boards'];
    for (const folder of requiredFolders) {
      const exists = await window.electronAPI.exists(`${backupPath}/${folder}`);
      if (!exists) {
        issues.push(`Missing required folder: ${folder}`);
      }
    }

    // Verify snippets folder
    if (await window.electronAPI.exists(`${backupPath}/snippets`)) {
      const snippets = await scanFolder(`${backupPath}/snippets`, ['.json', '.txt']);
      summary.snippets = snippets.length;

      // Check for invalid JSON files
      for (const snippet of snippets) {
        if (snippet.endsWith('.json')) {
          try {
            const content = await window.electronAPI.readFile(snippet);
            JSON.parse(content);
          } catch (e) {
            issues.push(`Invalid JSON file: ${snippet}`);
          }
        }
      }

      // Check for characters
      if (await window.electronAPI.exists(`${backupPath}/snippets/characters`)) {
        const characters = await scanFolder(`${backupPath}/snippets/characters`, ['.json']);
        summary.characters = characters.length;

        // Check for character images
        if (await window.electronAPI.exists(`${backupPath}/snippets/characters/images`)) {
          const images = await scanFolder(`${backupPath}/snippets/characters/images`, ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
          summary.characterImages = images.length;
        }
      }

      // Check for board images
      if (await window.electronAPI.exists(`${backupPath}/snippets/boards/images`)) {
        const images = await scanFolder(`${backupPath}/snippets/boards/images`, ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'], true);
        summary.boardImages = images.length;
      }
    }

    // Verify boards folder
    if (await window.electronAPI.exists(`${backupPath}/boards`)) {
      const boardFiles = await scanFolder(`${backupPath}/boards`, ['.json']);
      summary.boards = boardFiles.length;

      // Verify app-state.json if it exists
      const appStatePath = `${backupPath}/boards/app-state.json`;
      if (await window.electronAPI.exists(appStatePath)) {
        try {
          const content = await window.electronAPI.readFile(appStatePath);
          const state = JSON.parse(content);
          
          // Check for orphaned card references
          if (state.boards && Array.isArray(state.boards)) {
            for (const board of state.boards) {
              if (board.cards && Array.isArray(board.cards)) {
                for (const card of board.cards) {
                  if (card.snippetPath) {
                    const snippetExists = await window.electronAPI.exists(`${backupPath}/${card.snippetPath}`);
                    if (!snippetExists) {
                      warnings.push(`Orphaned card reference: ${card.snippetPath} in board "${board.name}"`);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          issues.push(`Invalid app-state.json: ${e.message}`);
        }
      }
    }

    // Check optional folders
    if (await window.electronAPI.exists(`${backupPath}/profiles`)) {
      const profiles = await scanFolder(`${backupPath}/profiles`, ['.json']);
      summary.profiles = profiles.length;
    }

    if (await window.electronAPI.exists(`${backupPath}/wildcards`)) {
      const wildcards = await scanFolder(`${backupPath}/wildcards`, ['.txt'], true);
      summary.wildcards = wildcards.length;
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      summary
    };
  } catch (error) {
    console.error('Error verifying backup:', error);
    return {
      valid: false,
      issues: [`Verification error: ${error.message}`],
      warnings: [],
      summary
    };
  }
}

/**
 * Scan folder recursively for files with specific extensions
 * @param {string} folderPath - Path to folder
 * @param {string[]} extensions - Array of extensions to include
 * @param {boolean} recursive - Whether to scan recursively
 * @returns {Promise<string[]>} Array of file paths
 */
async function scanFolder(folderPath, extensions, recursive = false) {
  const files = [];
  try {
    const items = await window.electronAPI.listFiles(folderPath);
    if (!Array.isArray(items)) {
      return files;
    }

    for (const item of items) {
      const itemPath = `${folderPath}/${item.name}`;
      if (item.isFile) {
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (extensions.includes(`.${ext}`)) {
          files.push(itemPath);
        }
      } else if (item.isDirectory && recursive) {
        const subFiles = await scanFolder(itemPath, extensions, true);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error);
  }
  return files;
}

/**
 * Display verification results to user
 * @param {Object} result - Verification result
 */
export function displayVerificationResults(result) {
  if (result.valid) {
    showToast('Backup verification passed!', 'success');
    console.log('Backup Summary:', result.summary);
  } else {
    showToast(`Backup verification found ${result.issues.length} issue(s)`, 'error');
    console.error('Backup Issues:', result.issues);
  }

  if (result.warnings.length > 0) {
    console.warn('Backup Warnings:', result.warnings);
  }

  return result;
}

