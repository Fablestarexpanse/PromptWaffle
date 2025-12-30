/**
 * ComfyUI Integration Utilities
 * Handles saving compiled prompts from PromptWaffle to a text file for ComfyUI
 */

import { getCompiledPrompt } from './utils.js';
import { showToast } from './index.js';

/**
 * Gets the plain text compiled prompt (without HTML formatting)
 * @returns {string} The compiled prompt as plain text
 */
export function getPlainTextPrompt() {
  try {
    const prompt = getCompiledPrompt();
    if (!prompt || prompt.trim() === '') {
      return null;
    }
    // Remove any remaining HTML entities and normalize whitespace
    return prompt
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('Error getting plain text prompt:', error);
    return null;
  }
}

/**
 * Saves the compiled prompt to a text file for ComfyUI
 * @param {string} folderPath - Path to the folder where the file should be saved
 * @param {string} filename - Name of the text file (default: promptwaffle_prompt.txt)
 * @returns {Promise<boolean>} Success status
 */
export async function savePromptToFile(folderPath = null, filename = 'promptwaffle_prompt.txt') {
  try {
    // Get the compiled prompt
    const prompt = getPlainTextPrompt();
    
    if (!prompt) {
      showToast('No compiled prompt to save', 'error');
      return false;
    }

    // Check if Electron API is available
    if (!window.electronAPI || typeof window.electronAPI.savePromptToFile !== 'function') {
      showToast('File save not available', 'error');
      console.error('savePromptToFile method not available in electronAPI');
      return false;
    }

    // Show loading toast
    showToast('Saving prompt to file...', 'info');

    // Save via IPC
    const result = await window.electronAPI.savePromptToFile(prompt, folderPath, filename);

    if (result.success) {
      showToast(`Prompt saved to ${result.filePath}`, 'success');
      console.log('[ComfyUI] Prompt saved to:', result.filePath);
      return true;
    } else {
      const errorMsg = result.error || 'Unknown error';
      showToast(`Failed to save: ${errorMsg}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('Error saving prompt to file:', error);
    showToast(`Error: ${error.message || 'Failed to save prompt'}`, 'error');
    return false;
  }
}

/**
 * Gets the default ComfyUI folder path (in PromptWaffle directory)
 * @returns {Promise<string>} The default folder path
 */
async function getDefaultComfyUIFolder() {
  try {
    // Use the dedicated IPC handler to get the ComfyUI folder
    if (window.electronAPI && typeof window.electronAPI.getComfyUIFolder === 'function') {
      return await window.electronAPI.getComfyUIFolder();
    }
    // Fallback: construct path manually
    const dataPath = await window.electronAPI.openDataPath();
    // Get parent directory and create comfyui subfolder
    // dataPath is usually something like "C:\...\PromptWaffle\snippets"
    // We want "C:\...\PromptWaffle\comfyui"
    const pathSeparator = dataPath.includes('\\') ? '\\' : '/';
    const pathParts = dataPath.split(pathSeparator);
    pathParts[pathParts.length - 1] = 'comfyui';
    return pathParts.join(pathSeparator);
  } catch (error) {
    console.error('Error getting default ComfyUI folder:', error);
    // Fallback: use 'comfyui' folder
    return 'comfyui';
  }
}

/**
 * Saves prompt to default ComfyUI folder in PromptWaffle directory
 * @returns {Promise<boolean>} Success status
 */
export async function savePromptToComfyUI() {
  try {
    // Get the compiled prompt
    const prompt = getPlainTextPrompt();
    
    if (!prompt) {
      showToast('No compiled prompt to save', 'error');
      return false;
    }

    // Check if Electron API is available
    if (!window.electronAPI || typeof window.electronAPI.savePromptToFile !== 'function') {
      showToast('File save not available', 'error');
      return false;
    }

    // Get default folder path
    const folderPath = await getDefaultComfyUIFolder();

    // Show loading toast
    showToast('Saving prompt to file...', 'info');

    // Save to the default folder (will overwrite existing file)
    const filename = 'promptwaffle_prompt.txt';
    const result = await window.electronAPI.savePromptToFile(prompt, folderPath, filename);

    if (result.success) {
      showToast(`Prompt saved to ${filename}`, 'success');
      console.log('[ComfyUI] Prompt saved to:', result.filePath);
      return true;
    } else {
      const errorMsg = result.error || 'Unknown error';
      showToast(`Failed to save: ${errorMsg}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('Error saving prompt to ComfyUI:', error);
    showToast(`Error: ${error.message || 'Failed to save prompt'}`, 'error');
    return false;
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use savePromptToComfyUI instead
 * @deprecated This function will be removed in v2.0.0
 * 
 * Note: The legacy API-based ComfyUI integration (WebSocket/HTTP) has been
 * replaced with a more reliable file-based approach. This function redirects
 * to the new implementation.
 */
export async function sendPromptToComfyUI(nodeId = null, comfyuiUrl = 'http://127.0.0.1:8188') {
  console.warn('[ComfyUI] DEPRECATED: sendPromptToComfyUI() is deprecated. Use savePromptToComfyUI() instead.');
  console.warn('[ComfyUI] This function will be removed in v2.0.0.');
  // Redirect to new file-based approach
  return savePromptToComfyUI();
}

