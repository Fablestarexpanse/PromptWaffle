import { CONSTANTS } from '../state/appState.js';
export function safeElementOperation(element, operation) {
  if (element && typeof operation === 'function') {
    try {
      operation(element);
      return true;
    } catch (error) {
      console.error('Error in safe element operation:', error);
      return false;
    }
  }
  return false;
}
export function safeJsonParse(jsonString, defaultValue = null) {
  if (typeof jsonString !== 'string') {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
}
export function parseSnippetTextFile(content) {
  if (typeof content !== 'string') {
    console.error('Invalid content for snippet parsing:', content);
    return null;
  }
  try {
    const parts = content.split('---\n');
    if (parts.length < 2) {
      return {
        text: content.trim(),
        tags: [],
        created: Date.now()
      };
    }
    const headerText = parts[0].trim();
    const bodyText = parts.slice(1).join('---\n').trim();
    const metadata = {};
    const headerLines = headerText.split('\n');
    for (const line of headerLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key === 'tags') {
          metadata[key] = value
            ? value
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean)
            : [];
        } else if (key === 'created') {
          metadata[key] = parseInt(value, 10) || Date.now();
        } else {
          metadata[key] = value;
        }
      }
    }
    return {
      text: bodyText,
      tags: metadata.tags || [],
      created: metadata.created || Date.now(),
      title: metadata.title || ''
    };
  } catch (error) {
    console.error('Error parsing snippet text file:', error);
    return null;
  }
}
// New JSON snippet handling functions
export function parseSnippetJsonFile(content) {
  if (typeof content !== 'string') {
    console.error('Invalid content for JSON snippet parsing:', content);
    return null;
  }
  try {
    const snippet = JSON.parse(content);
    // Validate required fields
    if (!snippet || typeof snippet.text !== 'string') {
      console.error('Invalid JSON snippet structure:', snippet);
      return null;
    }
    // Ensure all required fields exist with defaults
    return {
      text: snippet.text,
      negativeText: snippet.negativeText || '',
      tags: Array.isArray(snippet.tags) ? snippet.tags : [],
      created: snippet.created || snippet.createdAt || Date.now(),
      modified: snippet.modified || snippet.modifiedAt || Date.now(),
      title: snippet.title || snippet.text.substring(0, 50),
      id: snippet.id || `snippet_${Date.now()}`,
      description: snippet.description || '',
      category: snippet.category || '',
      version: snippet.version || '1.0',
      promptkit: snippet.promptkit || null
    };
  } catch (error) {
    console.error('Error parsing JSON snippet file:', error);
    return null;
  }
}
// Recursively list all snippet files (.txt and .json) in a directory and its subdirectories
async function listAllSnippetFiles(dir = 'snippets') {
  try {
    const items = await safeElectronAPICall('listFiles', dir);
    if (!Array.isArray(items)) {
      console.error(`Invalid items list for directory ${dir}:`, items);
      return [];
    }
    let allFiles = [];
    for (const item of items) {
      const fullPath = `${dir}/${item.name}`;
      if (item.isDirectory) {
        // Recursively process subdirectory
        const subAll = await listAllSnippetFiles(fullPath);
        allFiles = allFiles.concat(subAll);
      } else if (item.isFile) {
        if (item.name.endsWith('.txt')) {
          allFiles.push(fullPath.replace('snippets/', ''));
        } else if (item.name.endsWith('.json')) {
          // Check if this is a board file or a snippet file
          try {
            const content = await safeElectronAPICall(
              'readFile',
              `snippets/${fullPath.replace('snippets/', '')}`
            );
            const parsed = JSON.parse(content);
            // Check if it's a board file (has id, name, cards, tags)
            if (
              parsed &&
              typeof parsed === 'object' &&
              parsed.id &&
              parsed.name &&
              Array.isArray(parsed.cards) &&
              Array.isArray(parsed.tags)
            ) {
            } else if (
              parsed &&
              typeof parsed === 'object' &&
              parsed.text &&
              typeof parsed.text === 'string'
            ) {
              // This is a valid JSON snippet file
              allFiles.push(fullPath.replace('snippets/', ''));
            } else {
            }
          } catch (parseError) {
            // Ignore parse errors for board files
          }
        }
      }
    }
    return allFiles;
  } catch (error) {
    console.error(`Error listing files in directory ${dir}:`, error);
    return [];
  }
}
export async function loadSnippetsFromFiles() {
  try {
    if (!isElectronAPIAvailable()) {
      console.error('Electron API not available for loading snippets');
      return {};
    }
    // Recursively get all snippet files (.txt and .json)
    const files = await listAllSnippetFiles('snippets');
    if (!Array.isArray(files)) {
      console.error('Invalid files list received:', files);
      return {};
    }
    const snippets = {};
    for (const file of files) {
      try {
        const content = await safeElectronAPICall(
          'readFile',
          `snippets/${file}`
        );
        // Parse the file content (we already filtered out board files)
        let snippet;
        if (file.endsWith('.json')) {
          snippet = parseSnippetJsonFile(content);
        } else {
          snippet = parseSnippetTextFile(content);
        }
        if (snippet) {
          snippets[file] = snippet;
        } else {
          console.warn(`Failed to parse snippet: ${file}`);
        }
      } catch (fileError) {
        console.error(`Error loading snippet file ${file}:`, fileError);
      }
    }

    return snippets;
  } catch (error) {
    console.error('Error loading snippets from files:', error);
    console.error('Error stack:', error.stack);
    return {};
  }
}
export function isElectronAPIAvailable() {
  return (
    typeof window !== 'undefined' &&
    window.electronAPI &&
    typeof window.electronAPI === 'object'
  );
}
export async function safeElectronAPICall(method, ...args) {
  console.log(`[Utils] safeElectronAPICall called: ${method}`, args);
  if (!isElectronAPIAvailable()) {
    console.error(`[Utils] Electron API not available for method: ${method}`);
    throw new Error(`Electron API not available. Method: ${method}`);
  }
  if (typeof window.electronAPI[method] !== 'function') {
    console.error(`[Utils] Electron API method '${method}' not found. Available methods:`, Object.keys(window.electronAPI));
    throw new Error(`Electron API method '${method}' not found`);
  }
  try {
    console.log(`[Utils] Calling window.electronAPI.${method}...`);
    const result = await window.electronAPI[method](...args);
    console.log(`[Utils] window.electronAPI.${method} completed successfully`);
    return result;
  } catch (error) {
    console.error(`[Utils] Electron API call failed for method '${method}':`, error);
    console.error(`[Utils] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}
export function createTreeStyles(depth, isLast = false) {
  const baseLeft = depth * CONSTANTS.TREE_DEPTH_SPACING;
  const lineLeft = baseLeft + CONSTANTS.TREE_LINE_OFFSET;
  return {
    treeIndicator: {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${baseLeft}px`,
      height: '100%',
      pointerEvents: 'none'
    },
    treeLine: {
      position: 'absolute',
      left: `${lineLeft}px`,
      top: '0',
      width: '1px',
      height: isLast ? `${CONSTANTS.TREE_LAST_ITEM_HEIGHT}px` : '100%',
      background: 'rgba(255, 255, 255, 0.1)'
    },
    treeConnector: {
      position: 'absolute',
      left: `${lineLeft}px`,
      top: `${CONSTANTS.TREE_DEPTH_SPACING}px`,
      width: `${CONSTANTS.TREE_CONNECTOR_WIDTH}px`,
      height: `${CONSTANTS.TREE_CONNECTOR_HEIGHT}px`,
      background: 'rgba(255, 255, 255, 0.2)'
    },
    header: {
      position: 'relative',
      paddingLeft: `${baseLeft + CONSTANTS.TREE_HEADER_PADDING}px`
    }
  };
}
export function applyStyles(element, styles) {
  if (!element || !styles) return;
  Object.entries(styles).forEach(([property, value]) => {
    if (element.style && typeof element.style[property] !== 'undefined') {
      element.style[property] = value;
    }
  });
}

// Obsidian Export Functionality
export async function exportToObsidian() {
  try {
    const exportData = gatherExportData();
    const formattedContent = formatForObsidian(exportData);
    
    // Create export folder and save file (with save dialog)
    const { filePath, cancelled } = await saveExportToFile(exportData, formattedContent);
    
    if (cancelled) {
      // User cancelled the save dialog
      return;
    }
    
    // Also copy to clipboard for convenience
    await navigator.clipboard.writeText(formattedContent);
    
    // Show success message
    const { showToast } = await import('./toast.js');
    showToast(`Exported to file: ${filePath}`, 'success');
    
    console.log('Obsidian export:', formattedContent);
    console.log('Saved to file:', filePath);
  } catch (error) {
    console.error('Export failed:', error);
    const { showToast } = await import('./toast.js');
    showToast('Export failed. Please try again.', 'error');
  }
}

async function saveExportToFile(exportData, formattedContent) {
  // Create the markdown file with board name
  const boardName = exportData.boardName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const safeBoardName = boardName || 'Untitled';
  const defaultFilename = `${safeBoardName}.md`;
  
  // Show save dialog to let user choose location
  if (window.electronAPI && typeof window.electronAPI.showSaveDialog === 'function') {
    const result = await window.electronAPI.showSaveDialog({
      title: 'Export Markdown File',
      defaultPath: defaultFilename,
      filters: [
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || result.cancelled || !result.filePath) {
      return { filePath: null, exportFolder: null, cancelled: true };
    }
    
    // Save the file to the chosen location
    await safeElectronAPICall('writeFile', result.filePath, formattedContent);
    
    return { filePath: result.filePath, exportFolder: null, cancelled: false };
  } else {
    // Fallback: use default export folder if dialog not available
    const exportFolder = 'exports';
    await ensureDirectoryExists(exportFolder);
    const filePath = `${exportFolder}/${defaultFilename}`;
    await safeElectronAPICall('writeFile', filePath, formattedContent);
    return { filePath, exportFolder, cancelled: false };
  }
}



async function ensureDirectoryExists(dirPath) {
  try {
    // Check if directory exists
    await safeElectronAPICall('readdir', dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    try {
      await safeElectronAPICall('createFolder', dirPath);
      console.log(`Created export directory: ${dirPath}`);
    } catch (mkdirError) {
      console.error(`Failed to create directory ${dirPath}:`, mkdirError);
      throw mkdirError;
    }
  }
}

function gatherExportData() {
  // Get current board info
  const currentBoard = getCurrentBoard();
  const compiledPrompt = getCompiledPrompt();
  const metadata = getMetadata();

  return {
    boardName: currentBoard?.name || 'Untitled Board',
    boardTags: currentBoard?.tags || [],
    compiledPrompt,
    metadata,
    exportDate: new Date().toISOString()
  };
}

function getCurrentBoard() {
  // Get current board from AppState
  if (window.AppState) {
    const activeBoardId = window.AppState.getActiveBoardId();
    const boards = window.AppState.getBoards();
    return boards.find(board => board.id === activeBoardId);
  }
  return null;
}

export function getCompiledPrompt() {
  const compiledPromptElement = document.getElementById('compiledPrompt');
  return compiledPromptElement ? compiledPromptElement.textContent.trim() : '';
}

function getMetadata() {
  const metadataFields = [
    'checkpointInput',
    'cfgInput', 
    'seedInput',
    'stepsInput',
    'samplerInput',
    'schedulerInput',
    'clipskipInput',
    'sizeInput',
    'negativePromptInput'
  ];

  const metadata = {};
  metadataFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const value = element.value.trim();
      if (value) {
        // Convert field ID to readable name
        const fieldName = getFieldDisplayName(fieldId);
        metadata[fieldName] = value;
      }
    }
  });

  return metadata;
}

function getFieldDisplayName(fieldId) {
  const nameMap = {
    'checkpointInput': 'Checkpoint',
    'cfgInput': 'CFG Scale',
    'seedInput': 'Seed',
    'stepsInput': 'Steps',
    'samplerInput': 'Sampler',
    'schedulerInput': 'Scheduler',
    'clipskipInput': 'Clip Skip',
    'sizeInput': 'Size',
    'negativePromptInput': 'Negative Prompt'
  };
  return nameMap[fieldId] || fieldId;
}



function formatForObsidian(data) {
  const { boardName, boardTags, compiledPrompt, metadata, exportDate } = data;
  
  let content = `---
title: "${boardName}"
created: "${new Date(exportDate).toISOString()}"
tags: ${boardTags && boardTags.length > 0 ? `[${boardTags.map(tag => `"${tag}"`).join(', ')}]` : '[]'}
---

# 🎨 ${boardName}

> [!info] Export Info
> **Created:** ${new Date(exportDate).toLocaleString()}
> **Source:** PromptWaffle
> **Type:** AI Image Generation Prompt

${boardTags && boardTags.length > 0 ? `**Tags:** ${boardTags.map(tag => `#${tag}`).join(' ')}\n\n` : ''}

## 📝 Compiled Prompt

> [!quote] Generated Prompt
> ${compiledPrompt || '*No prompt compiled*'}

${Object.keys(metadata).length > 0 ? `
## ⚙️ Generation Parameters

> [!note] Settings
> | Parameter | Value |
> |-----------|-------|
${Object.entries(metadata).map(([key, value]) => `> | **${key}** | \`${value}\` |`).join('\n')}
` : ''}



---

`;
  
  return content;
}
