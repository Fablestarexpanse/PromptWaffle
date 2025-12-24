import { AppState } from '../state/appState.js';

import {
  createSnippetElement,
  createFolderElement,
  createBoardElement
} from '../components/Sidebar/index.js';
import { addImagePreviewToSidebar } from './index.js';
import { showToast } from '../utils/index.js';
import { loadInitialData } from './load-initial-data.js';
import { showDeleteConfirmation } from '../utils/confirmationModal.js';
import { onBoardSwitch } from './ui.js';
function sortEntries(entries) {
  if (!entries) return [];
  const sortConfig = AppState.getSortConfig();
  entries.sort((a, b) => {
    // "Cut Snippets" folder always comes first
    if (a.name === 'Cut Snippets') return -1;
    if (b.name === 'Cut Snippets') return 1;
    // Folders always come before files
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    // Boards come before snippets
    if (a.type === 'board' && b.type === 'snippet') return -1;
    if (a.type === 'snippet' && b.type === 'board') return 1;
    // Primary sort based on user's choice
    const aValue = a.name;
    const bValue = b.name;
    // Note: Advanced sorting by date is removed for now for simplicity with the new model
    // It can be added back by ensuring the main process provides stat details
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  return entries;
}
function snippetMatchesSearch(snippet) {
  try {
    if (!snippet || typeof snippet !== 'object') {
      console.error(
        'Invalid snippet provided to snippetMatchesSearch:',
        snippet
      );
      return false;
    }
    const currentSearchTerm = AppState.getCurrentSearchTerm();
    if (!currentSearchTerm) {
      return true; // No search term means show all snippets
    }

    // Search in tags safely
    const tagsMatch =
      Array.isArray(snippet.tags) &&
      snippet.tags.some(tag => {
        const tagMatch =
          typeof tag === 'string' &&
          tag.toLowerCase().includes(currentSearchTerm);

        if (tagMatch) {
        }
        return tagMatch;
      });
    // Also search in snippet text for better usability
    const textMatch =
      typeof snippet.text === 'string' &&
      snippet.text.toLowerCase().includes(currentSearchTerm);
    const result = tagsMatch || textMatch;

    return result;
  } catch (error) {
    console.error('Error checking snippet search match:', error);
    return false;
  }
}
function boardMatchesSearch(board) {
  try {
    if (!board || typeof board !== 'object') {
      console.error('Invalid board provided to boardMatchesSearch:', board);
      return false;
    }
    const currentSearchTerm = AppState.getCurrentSearchTerm();
    if (!currentSearchTerm) {
      return true; // No search term means show all boards
    }
    // Search in board name safely
    const nameMatch =
      typeof board.name === 'string' &&
      board.name.toLowerCase().includes(currentSearchTerm);
    // Search in board tags safely
    const tagsMatch =
      Array.isArray(board.tags) && board.tags.length > 0
        ? board.tags.some(
            tag =>
              typeof tag === 'string' &&
              tag.toLowerCase().includes(currentSearchTerm)
          )
        : false;
    return nameMatch || tagsMatch;
  } catch (error) {
    console.error('Error checking board search match:', error);
    return false;
  }
}
function filterTreeBySearch(tree) {
  const currentSearchTerm = AppState.getCurrentSearchTerm();
  if (!currentSearchTerm) {
    return tree; // No search term, return original tree
  }
  const filteredTree = [];
  for (const entry of tree) {
    if (entry.type === 'snippet') {
      const snippets = AppState.getSnippets();
      const normalizedPath = entry.path.replace(/\\/g, '/');
      const snippetContent = snippets[normalizedPath];
      if (snippetContent && snippetMatchesSearch(snippetContent)) {
        filteredTree.push(entry);
      }
    } else if (entry.type === 'board') {
      // Check if board matches search (by name)
      if (boardMatchesSearch(entry.content)) {
        filteredTree.push(entry);
      }
    } else if (entry.type === 'folder') {
      // For folders, check if any children match
      const filteredChildren = filterTreeBySearch(entry.children || []);
      if (filteredChildren.length > 0) {
        // Include folder if it has matching children
        filteredTree.push({
          ...entry,
          children: filteredChildren
        });
      }
    }
  }
  return filteredTree;
}
// Handler functions for folder actions and drag-and-drop
async function handleSnippetDrop(data, targetFolderPath) {
  try {
    if (!data || !data.path) {
      console.error('Invalid drag data for snippet drop:', data);
      return;
    }
    // Log the value of data.path at the start

    // Normalize all paths to use forward slashes
    const normalize = p => p.replace(/\\/g, '/');
    // Handle the case where data.path might already include 'snippets/'
    let normalizedPath = normalize(data.path);
    if (normalizedPath.startsWith('snippets/')) {
      normalizedPath = normalizedPath.substring(9); // Remove 'snippets/' prefix
    }
    const oldPath = `snippets/${normalizedPath}`;
    const fileName = normalizedPath.split('/').pop();
    const currentFolder = normalizedPath.includes('/')
      ? normalizedPath.split('/').slice(0, -1).join('/')
      : '';
    const newFolderPath = targetFolderPath
      ? `snippets/${targetFolderPath}`
      : 'snippets';
    const newPath = targetFolderPath
      ? `${newFolderPath}/${fileName}`
      : `snippets/${fileName}`;
    // Only return early if the paths are actually the same (after normalization)
    if (normalize(oldPath) === normalize(newPath)) {
      return;
    }
    // Prevent moving a snippet into itself or a subpath of itself
    if (newPath.startsWith(`${oldPath}/`)) {
      showToast('Cannot move snippet into itself or its subpath', 'error');
      return;
    }
    // Ensure the target folder exists
    if (window.electronAPI && window.electronAPI.createFolder) {
      await window.electronAPI.createFolder(newFolderPath);
    }
    // Check if the source file exists before trying to move it
    if (window.electronAPI && window.electronAPI.exists) {
      const fileExists = await window.electronAPI.exists(oldPath);
      // Also check what files exist in the snippets directory and subdirectories
      try {
        const snippetsFiles = await window.electronAPI.listFiles('snippets');
        // Check if the file exists in any subdirectory
        let fileFound = false;
        for (const item of snippetsFiles) {
          if (item.isDirectory) {
            try {
              const subFiles = await window.electronAPI.listFiles(
                `snippets/${item.name}`
              );
              const fileName = normalizedPath.split('/').pop();
              if (subFiles.some(f => f.name === fileName)) {
                fileFound = true;
                break;
              }
            } catch (subError) {
              // Ignore subdirectory errors during file existence check
            }
          }
        }
        if (!fileExists && !fileFound) {
          throw new Error(`Source file does not exist: ${oldPath}`);
        }
      } catch (listError) {
        if (!fileExists) {
          throw new Error(`Source file does not exist: ${oldPath}`);
        }
      }
    }
    await window.electronAPI.rename(oldPath, newPath);
    // Verify the file was moved successfully
    if (window.electronAPI && window.electronAPI.exists) {
      const oldFileExists = await window.electronAPI.exists(oldPath);
      const newFileExists = await window.electronAPI.exists(newPath);
      if (oldFileExists) {
        console.warn('[MoveSnippet] Warning: Old file still exists after move');
      }
      if (!newFileExists) {
        throw new Error(`New file does not exist after move: ${newPath}`);
      }
    }
    // Update the snippet in AppState to reflect the new path
    const snippets = AppState.getSnippets();
    const oldSnippetKey = Object.keys(snippets).find(
      key => normalize(key) === oldPath
    );
    if (oldSnippetKey) {
      const snippetData = snippets[oldSnippetKey];
      delete snippets[oldSnippetKey];
      snippets[newPath] = snippetData;
      AppState.setSnippets(snippets);
    }
    // Update all board card references to the new snippet path
    const boards = AppState.getBoards();
    let updated = false;
    for (const board of boards) {
      if (Array.isArray(board.cards)) {
        for (const card of board.cards) {
          // Log every card's path
          if (normalize(card.snippetPath) === normalizedPath) {
            card.snippetPath =
              (targetFolderPath ? `${targetFolderPath}/` : '') + fileName;
            updated = true;
          }
        }
      }
    }
    if (updated) {
      const { saveApplicationState } = await import('./state.js');
      await saveApplicationState();
    }
    // Update the sidebar tree to reflect the move
    if (window.sidebarTree) {
      // Preserve expanded/collapsed state
      const currentState = getSidebarState();
      const { loadInitialData } = await import('./load-initial-data.js');
      const initialData = await loadInitialData();
      const foldersContainer = document.getElementById('foldersContainer');
      if (foldersContainer && initialData && initialData.sidebarTree) {
        renderSidebar(initialData.sidebarTree, foldersContainer);
        // Restore expanded/collapsed state
        applySidebarState(currentState);
      }
    }
    const { showToast } = await import('../utils/index.js');
    showToast('Snippet moved successfully!', 'success');
  } catch (error) {
    console.error('Error moving snippet:', error);
    const { showToast } = await import('../utils/index.js');
    showToast('Failed to move snippet', 'error');
  }
}
async function handleBoardDrop(data, targetFolderPath) {
  try {
    if (!data || !data.path) {
      console.error('Invalid drag data for board drop:', data);
      return;
    }
    // Normalize all paths to use forward slashes
    const normalize = p => p.replace(/\\/g, '/');
    // Handle the case where data.path might already include 'snippets/'
    let normalizedPath = normalize(data.path);
    if (normalizedPath.startsWith('snippets/')) {
      normalizedPath = normalizedPath.substring(9); // Remove 'snippets/' prefix
    }
    const oldPath = `snippets/${normalizedPath}`;
    const fileName = normalizedPath.split('/').pop();
    const currentFolder = normalizedPath.includes('/')
      ? normalizedPath.split('/').slice(0, -1).join('/')
      : '';
    const newFolderPath = targetFolderPath
      ? `snippets/${targetFolderPath}`
      : 'snippets';
    const newPath = targetFolderPath
      ? `${newFolderPath}/${fileName}`
      : `snippets/${fileName}`;
    // Only return early if the paths are actually the same (after normalization)
    if (normalize(oldPath) === normalize(newPath)) {
      return;
    }
    // Prevent moving a board into itself or a subpath of itself
    if (newPath.startsWith(`${oldPath}/`)) {
      showToast('Cannot move board into itself or its subpath', 'error');
      return;
    }
    // Ensure the target folder exists
    if (
      targetFolderPath &&
      window.electronAPI &&
      window.electronAPI.createFolder
    ) {
      await window.electronAPI.createFolder(newFolderPath);
    }
    // Move the board file
    await window.electronAPI.rename(oldPath, newPath);
    // Update the board's path in the boards array
    const boards = AppState.getBoards();
    const board = boards.find(b => b.name === data.board.name);
    if (board) {
      // Update the board's file path reference
      board.filePath = newPath;
    }
    // Reload sidebar tree from disk to reflect the changes
    if (window.sidebarTree) {
      // Preserve expanded/collapsed state
      const currentState = getSidebarState();
      const { loadInitialData } = await import('./load-initial-data.js');
      const initialData = await loadInitialData();
      const foldersContainer = document.getElementById('foldersContainer');
      if (foldersContainer && initialData && initialData.sidebarTree) {
        renderSidebar(initialData.sidebarTree, foldersContainer);
        // Restore expanded/collapsed state
        applySidebarState(currentState);
      }
    }
    showToast(`Board "${data.board.name}" moved successfully`, 'success');
  } catch (error) {
    console.error('Error moving board:', error);
    showToast('Error moving board', 'error');
  }
}
async function handleFolderDrop(sourcePath, targetPath) {
  try {
    if (!sourcePath || sourcePath === targetPath) return;
    // Prevent moving a folder into itself or its descendants
    if (targetPath === sourcePath || targetPath.startsWith(`${sourcePath}/`)) {
      showToast('Cannot move a folder into itself or its subfolders', 'error');
      return;
    }
    const folderName = sourcePath.split('/').pop();
    const oldFolderPath = `snippets/${sourcePath}`;
    const newFolderPath = targetPath
      ? `snippets/${targetPath}/${folderName}`
      : `snippets/${folderName}`;
    if (window.electronAPI && window.electronAPI.rename) {
      await window.electronAPI.rename(oldFolderPath, newFolderPath);
    } else {
      showToast('Filesystem API not available', 'error');
      return;
    }
    // Update all board card snippet paths that reference snippets in the moved folder
    const boards = AppState.getBoards();
    let updated = false;
    const normalize = p => p.replace(/\\/g, '/');
    for (const board of boards) {
      if (Array.isArray(board.cards)) {
        for (const card of board.cards) {
          if (card.snippetPath) {
            const normalizedSnippetPath = normalize(card.snippetPath);
            const oldFolderPrefix = normalize(`${sourcePath}/`);
            // Check if this card's snippet is in the moved folder
            if (normalizedSnippetPath.startsWith(oldFolderPrefix)) {
              // Calculate the new path
              const snippetName = normalizedSnippetPath.substring(
                oldFolderPrefix.length
              );
              const newSnippetPath = targetPath
                ? `${targetPath}/${folderName}/${snippetName}`
                : `${folderName}/${snippetName}`;
              card.snippetPath = newSnippetPath;
              updated = true;
            }
          }
        }
      }
    }
    if (updated) {
      // Save the updated boards
      const { saveApplicationState } = await import('./state.js');
      await saveApplicationState();
      // Re-render the current board to show the updated snippet paths
      const { renderBoard } = await import('./boards.js');
      await renderBoard();
    }
    // Reload sidebar tree from disk to ensure only the selected folder is moved
    if (window.sidebarTree) {
      // Preserve expanded/collapsed state
      const currentState = getSidebarState();
      const { loadInitialData } = await import('./load-initial-data.js');
      const initialData = await loadInitialData();
      const foldersContainer = document.getElementById('foldersContainer');
      if (foldersContainer && initialData && initialData.sidebarTree) {
        renderSidebar(initialData.sidebarTree, foldersContainer);
        // Restore expanded/collapsed state
        applySidebarState(currentState);
      }
    }
    showToast('Folder moved successfully', 'success');
  } catch (error) {
    showToast('Error moving folder', 'error');
    console.error('Error moving folder:', error);
  }
}
function openFolderModal(path) {
  // Open the folder modal
  const modal = document.getElementById('folderModal');
  if (modal) {
    modal.style.display = 'flex';
    const input = document.getElementById('folderNameInput');
    if (input) input.value = '';
    const confirmBtn = document.getElementById('createFolderConfirmBtn');
    if (confirmBtn) confirmBtn.textContent = 'Create';
    if (input) input.focus();
  }
}
// Helper function to extract all folders from the sidebar tree with hierarchy
function getAllFolders(tree, folders = [], depth = 0) {
  for (const entry of tree) {
    if (entry.type === 'folder') {
      folders.push({
        name: entry.name,
        path: entry.path,
        depth
      });
      // Recursively get folders from children
      if (entry.children && entry.children.length > 0) {
        getAllFolders(entry.children, folders, depth + 1);
      }
    }
  }
  return folders;
}
function populateFolderDropdown(selectElement, folders, selectedPath = '') {
  // Clear existing options
  selectElement.innerHTML = '';
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Root (no folder)';
  selectElement.appendChild(defaultOption);
  // Add folder options with hierarchy indicators
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.path;
    // Use the depth information to create proper indentation
    const indent = '  '.repeat(folder.depth);
    // Check if this is a subfolder (has path separators)
    const isSubfolder = folder.path.includes('/');
    if (isSubfolder) {
      // For subfolders, show with indentation and parent context
      const pathParts = folder.path.split('/');
      const parentFolder = pathParts[pathParts.length - 2]; // Get parent folder name
      option.textContent = `${indent}📁 ${folder.name} (in ${parentFolder})`;
    } else {
      // For root folders, show with folder icon
      option.textContent = `${indent}📁 ${folder.name}`;
    }
    if (folder.path === selectedPath) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}
function openSnippetModal(path) {
  // Open the snippet modal
  const modal = document.getElementById('snippetModal');
  if (modal) {
    modal.style.display = 'flex';
    const input = document.getElementById('snippetTextInput');
    if (input) input.value = '';
    const tagsInput = document.getElementById('snippetTagsInput');
    if (tagsInput) tagsInput.value = '';
    const confirmBtn = document.getElementById('createSnippetConfirmBtn');
    if (confirmBtn) confirmBtn.textContent = 'Create';
    // Populate folder dropdown
    const folderSelect = document.getElementById('snippetFolderSelect');
    if (folderSelect && window.sidebarTree) {
      const folders = getAllFolders(window.sidebarTree);
      populateFolderDropdown(folderSelect, folders, path || '');
    }
    if (input) input.focus();
  }
}
async function openBoardModalInFolder(path) {
  try {
    // Import the board modal function
    const { openNewBoardModal } = await import('./boards.js');
    // Open the board modal with the folder path as parent
    await openNewBoardModal(path);
  } catch (error) {
    console.error('Error opening board modal in folder:', error);
    const { showToast } = await import('../utils/index.js');
    showToast('Error opening board creation dialog', 'error');
  }
}
async function deleteFolder(path) {
  const confirmed = await showDeleteConfirmation(path, 'folder');
  
  if (!confirmed) {
    return;
  }

  try {
    // Delete the folder on disk
    if (window.electronAPI && window.electronAPI.deleteFolderRecursive) {
      await window.electronAPI.deleteFolderRecursive(`snippets/${path}`);
    } else if (window.electronAPI && window.electronAPI.deleteFolder) {
      // fallback if only deleteFolder is available
      await window.electronAPI.deleteFolder(`snippets/${path}`);
    } else {
      showToast('Filesystem API not available', 'error');
      return;
    }
    
    // Remove from sidebar tree in memory
    function removeFolder(tree, path) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].type === 'folder' && tree[i].path === path) {
          return tree.splice(i, 1)[0];
        } else if (tree[i].type === 'folder' && tree[i].children) {
          const found = removeFolder(tree[i].children, path);
          if (found) return found;
        }
      }
      return null;
    }
    removeFolder(window.sidebarTree, path);
    
    // Refresh sidebar
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer) {
      renderSidebar(window.sidebarTree, foldersContainer);
    }
    showToast('Folder and all contents deleted', 'success');
  } catch (error) {
    showToast('Error deleting folder', 'error');
    console.error('Error deleting folder:', error);
  }
}
// Inline folder creation functions
function showInlineFolderCreation() {
  const inlineCreation = document.getElementById('inlineFolderCreation');
  if (inlineCreation) {
    inlineCreation.style.display = 'block';
    const input = document.getElementById('newFolderNameInput');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}
function hideInlineFolderCreation() {
  const inlineCreation = document.getElementById('inlineFolderCreation');
  if (inlineCreation) {
    inlineCreation.style.display = 'none';
  }
}
async function createInlineFolder() {
  try {
    const input = document.getElementById('newFolderNameInput');
    if (!input) return;
    const folderName = input.value.trim();
    if (!folderName) {
      showToast('Please enter a folder name', 'error');
      return;
    }
    // Use window.inlineFolderParentPath if set, otherwise use the dropdown from the active modal
    let parentPath = '';
    if (window.inlineFolderParentPath) {
      parentPath = window.inlineFolderParentPath;
    } else {
      // Check which modal is active and use its folder select
      const snippetFolderSelect = document.getElementById(
        'snippetFolderSelect'
      );
      const boardFolderSelect = document.getElementById('boardFolderSelect');
      if (snippetFolderSelect && snippetFolderSelect.offsetParent !== null) {
        // Snippet modal is visible
        parentPath = snippetFolderSelect.value || '';
      } else if (boardFolderSelect && boardFolderSelect.offsetParent !== null) {
        // Board modal is visible
        parentPath = boardFolderSelect.value || '';
      } else {
        // Fallback to snippet folder select
        parentPath = snippetFolderSelect ? snippetFolderSelect.value : '';
      }
    }
    // Determine the folder path based on the parent path
    let folderPath;
    let newFolderPath;
    if (parentPath) {
      folderPath = `snippets/${parentPath}/${folderName}`;
      newFolderPath = `${parentPath}/${folderName}`;
    } else {
      folderPath = `snippets/${folderName}`;
      newFolderPath = folderName;
    }
    try {
      if (window.electronAPI && window.electronAPI.createFolder) {
        await window.electronAPI.createFolder(folderPath);
      } else {
        showToast('Filesystem API not available', 'error');
        return;
      }
    } catch (err) {
      showToast('Folder already exists or cannot be created', 'error');
      return;
    }
    // Add folder to sidebar tree in memory
    if (!window.sidebarTree) window.sidebarTree = [];
    const newFolderEntry = {
      type: 'folder',
      name: folderName,
      path: newFolderPath,
      children: []
    };
    if (parentPath) {
      // Add as subfolder to the parent folder
      const addToFolder = (tree, parentPath) => {
        for (const entry of tree) {
          if (entry.type === 'folder' && entry.path === parentPath) {
            if (!entry.children) entry.children = [];
            entry.children.push(newFolderEntry);
            return true;
          }
          if (entry.children && entry.children.length > 0) {
            if (addToFolder(entry.children, parentPath)) {
              return true;
            }
          }
        }
        return false;
      };
      if (!addToFolder(window.sidebarTree, parentPath)) {
        // If parent folder not found, add to root
        window.sidebarTree.push(newFolderEntry);
      }
    } else {
      // Add to root
      window.sidebarTree.push(newFolderEntry);
    }
    // Refresh the folder dropdown in both snippet and board modals
    const snippetFolderSelect = document.getElementById('snippetFolderSelect');
    const boardFolderSelect = document.getElementById('boardFolderSelect');
    if (window.sidebarTree) {
      const folders = getAllFolders(window.sidebarTree);
      if (snippetFolderSelect) {
        populateFolderDropdown(snippetFolderSelect, folders, newFolderPath);
      }
      if (boardFolderSelect) {
        populateFolderDropdown(boardFolderSelect, folders, newFolderPath);
      }
    }
    // Refresh sidebar
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer) {
      renderSidebar(window.sidebarTree, foldersContainer);
    }
    // Hide the inline creation form
    hideInlineFolderCreation();
    // Clear the parent path after use
    window.inlineFolderParentPath = '';
    showToast(
      `Created folder: ${folderName}${parentPath ? ` in ${parentPath}` : ''}`,
      'success'
    );
  } catch (error) {
    showToast('Error creating folder', 'error');
    console.error('Error creating inline folder:', error);
  }
}
async function createSnippet() {
  try {
    const textInput = document.getElementById('snippetTextInput');
    const tagsInput = document.getElementById('snippetTagsInput');
    const folderSelect = document.getElementById('snippetFolderSelect');
    if (!textInput || !tagsInput || !folderSelect) {
      showToast('Required form elements not found', 'error');
      return;
    }
    const snippetText = textInput.value.trim();
    const tags = tagsInput.value.trim();
    const selectedFolder = folderSelect.value;
    if (!snippetText) {
      showToast('Please enter snippet text', 'error');
      return;
    }
    // Generate a unique filename
    const timestamp = Date.now();
    const snippetName = `snippet_${timestamp}.json`;
    // Determine the file path
    let snippetPath;
    if (selectedFolder) {
      snippetPath = `snippets/${selectedFolder}/${snippetName}`;
    } else {
      snippetPath = `snippets/${snippetName}`;
    }
    // Create snippet metadata
    const snippetMetadata = {
      id: `snippet_${timestamp}`,
      text: snippetText,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      created: Date.now(),
      modified: Date.now(),
              title: snippetText.substring(0, 50),
      description: '',
      category: selectedFolder || '',
      version: '1.0'
    };
    // Create the JSON snippet file
    try {
      if (window.electronAPI && window.electronAPI.writeFile) {
        const jsonContent = JSON.stringify(snippetMetadata, null, 2);
        await window.electronAPI.writeFile(snippetPath, jsonContent);
      } else {
        showToast('Filesystem API not available', 'error');
        return;
      }
    } catch (err) {
      showToast('Error creating snippet file', 'error');
      console.error('Error creating snippet file:', err);
      return;
    }
    // Add to AppState
    const snippets = AppState.getSnippets();
    snippets[snippetPath] = snippetMetadata;
    AppState.setSnippets(snippets);
    // Add to sidebar tree
    if (!window.sidebarTree) window.sidebarTree = [];
    const snippetEntry = {
      type: 'snippet',
      name: snippetName.replace('.json', ''),
      path: snippetPath,
      content: snippetMetadata
    };
    if (selectedFolder) {
      // Find the folder in the tree and add the snippet to it
      const addToFolder = (tree, folderPath) => {
        for (const entry of tree) {
          if (entry.type === 'folder' && entry.path === folderPath) {
            if (!entry.children) entry.children = [];
            entry.children.push(snippetEntry);
            return true;
          }
          if (entry.children && entry.children.length > 0) {
            if (addToFolder(entry.children, folderPath)) {
              return true;
            }
          }
        }
        return false;
      };
      if (!addToFolder(window.sidebarTree, selectedFolder)) {
        // If folder not found, add to root
        window.sidebarTree.push(snippetEntry);
      }
    } else {
      // Add to root
      window.sidebarTree.push(snippetEntry);
    }
    // Refresh sidebar
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer) {
      renderSidebar(window.sidebarTree, foldersContainer);
    }
    // Close modal
    closeSnippetModal();
    // Add the snippet to the current board if we're creating from context menu
    try {
      const { addCardToBoard } = await import('./boards.js');
      const boardContainer = document.getElementById('promptBoard');
      if (boardContainer) {
        // Position the card at a reasonable location
        const x = 100;
        const y = 100;
        await addCardToBoard(snippetPath, x, y);
      }
    } catch (error) {
      console.error('Error adding snippet to board:', error);
      // Don't show error toast as the snippet was still created successfully
    }
    showToast(
      `Created snippet: ${snippetName.replace('.json', '')}`,
      'success'
    );
  } catch (error) {
    showToast('Error creating snippet', 'error');
    console.error('Error creating snippet:', error);
  }
}
async function createFolder() {
  try {
    const input = document.getElementById('folderNameInput');
    if (!input) return;
    const folderName = input.value.trim();
    if (!folderName) {
      showToast('Please enter a folder name', 'error');
      return;
    }
    // Create the directory in the snippets folder
    const folderPath = `snippets/${folderName}`;
    try {
      if (window.electronAPI && window.electronAPI.createFolder) {
        await window.electronAPI.createFolder(folderPath);
      } else {
        showToast('Filesystem API not available', 'error');
        return;
      }
    } catch (err) {
      showToast('Folder already exists or cannot be created', 'error');
      return;
    }
    // Add folder to sidebar tree in memory and refresh
    if (!window.sidebarTree) window.sidebarTree = [];
    window.sidebarTree.push({
      type: 'folder',
      name: folderName,
      path: folderName,
      children: []
    });
    // Refresh sidebar
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer) {
      renderSidebar(window.sidebarTree, foldersContainer);
    }
    // Close modal
    const modal = document.getElementById('folderModal');
    if (modal) modal.style.display = 'none';
    showToast(`Created folder: ${folderName}`, 'success');
  } catch (error) {
    showToast('Error creating folder', 'error');
    console.error('Error creating folder:', error);
  }
}
function closeFolderModal() {
  const modal = document.getElementById('folderModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
function closeSnippetModal() {
  const modal = document.getElementById('snippetModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
function closeEditSnippetModal() {
  const modal = document.getElementById('editSnippetModal');
  if (modal) {
    modal.style.display = 'none';
    // Clear form fields
    const textInput = document.getElementById('editSnippetTextInput');
    if (textInput) textInput.value = '';
    const tagsInput = document.getElementById('editSnippetTagsInput');
    if (tagsInput) tagsInput.value = '';
    const folderSelect = document.getElementById('editSnippetFolderSelect');
    if (folderSelect) folderSelect.innerHTML = '';
    // Hide inline folder creation
    const inlineCreation = document.getElementById('inlineFolderCreationEdit');
    if (inlineCreation) inlineCreation.style.display = 'none';
    // Clear the stored path
    delete modal.dataset.snippetPath;
  }
}
function openEditSnippetModal(snippet, path) {
  const modal = document.getElementById('editSnippetModal');
  if (modal) {
    modal.style.display = 'flex';
    // Populate text input
    const textInput = document.getElementById('editSnippetTextInput');
    if (textInput) textInput.value = snippet.text || '';
    // Populate tags input
    const tagsInput = document.getElementById('editSnippetTagsInput');
    if (tagsInput)
      tagsInput.value = snippet.tags ? snippet.tags.join(', ') : '';
    // Store the path for saving
    modal.dataset.snippetPath = path;
    // Focus the text input
    if (textInput) textInput.focus();
  }
}
// Utility to clean up tooltips and drag-over classes
function cleanupSidebarArtifacts() {
  // Remove all snippet tooltips
  document
    .querySelectorAll('.snippet-tooltip, .custom-folder-tooltip')
    .forEach(el => el.remove());
  // Remove all drag-over classes
  document
    .querySelectorAll('.drag-over')
    .forEach(el => el.classList.remove('drag-over'));
}
export function renderSidebar(tree, container, depth = 0, parentPath = '') {
  if (depth === 0) {
    // Clean up any leftover tooltips or drag-over classes before rendering
    cleanupSidebarArtifacts();
    // Safety: Only clear if container is the foldersContainer, not the whole sidebar
    if (container.id === 'foldersContainer') {
      container.innerHTML = '';
    } else {
      console.warn(
        '[Sidebar] Refusing to clear container that is not #foldersContainer:',
        container
      );
    }
  }
  const filteredTree = filterTreeBySearch(tree);
  // Only sort at root level; for folder children, sort folders, then boards, then snippets
  let sortedTree;
  if (depth === 0) {
    sortedTree = sortEntries(filteredTree);
  } else {
    // For folder children: folders first, then boards, then snippets
    const folders = filteredTree.filter(e => e.type === 'folder');
    const boards = filteredTree.filter(e => e.type === 'board');
    const snippets = filteredTree.filter(e => e.type === 'snippet');
    sortedTree = [
      ...sortEntries(folders),
      ...sortEntries(boards),
      ...sortEntries(snippets)
    ];
  }
  for (let i = 0; i < sortedTree.length; i++) {
    const entry = sortedTree[i];
    const isLast = i === sortedTree.length - 1;
    if (entry.type === 'folder') {
      // Compute the full path for this folder
      const fullPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
      const folderElement = createFolderElement({
        name: entry.name,
        id: `folder-${fullPath.replace(/[\\/]/g, '-')}`,
        path: fullPath,
        depth,
        isLast,
        eventHandlers: {
          handleSnippetDrop,
          handleBoardDrop,
          handleFolderDrop, // <-- add this
          openFolderModal,
          openSnippetModal,
          openBoardModalInFolder,
          deleteFolder,
          showInlineFolderCreation // <-- add this
        }
      });
      container.appendChild(folderElement);
      const subContainer = folderElement.querySelector('.folder-content');
      if (entry.children && entry.children.length > 0) {
        // Sort children: folders first, then boards, then snippets, all alphabetically
        const childrenSorted = [...entry.children].sort((a, b) => {
          if (a.type === b.type) {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
          }
          if (a.type === 'folder') return -1;
          if (b.type === 'folder') return 1;
          if (a.type === 'board') return -1;
          if (b.type === 'board') return 1;
          return 0;
        });
        renderSidebar(childrenSorted, subContainer, depth + 1, fullPath);
      }
    } else if (entry.type === 'snippet') {
      // Use the content directly from the tree entry
      const snippetContent = entry.content;
      if (snippetContent) {
        const snippetElement = createSnippetElement({
          snippet: snippetContent,
          id: `snippet-${entry.path.replace(/[\\/]/g, '-')}`,
          path: entry.path,
          depth,
          isLast
        });
        container.appendChild(snippetElement);
      } else {
        console.warn('[Sidebar] Snippet entry has no content:', entry);
      }
    } else if (entry.type === 'board') {
      // Get full board data from boards array to include images
      const boards = AppState.getBoards();
      const fullBoardData =
        boards.find(b => b.name === entry.content.name) || entry.content;
      const boardElement = createBoardElement({
        board: fullBoardData,
        id: `board-${entry.path.replace(/[\\/]/g, '-')}`,
        path: entry.path,
        depth,
        isLast,
        eventHandlers: {
          setCurrentBoard: async boardId => {
            const { setCurrentBoard } = await import('./boards.js');
            await setCurrentBoard(boardId);
            await onBoardSwitch(); // Call onBoardSwitch after board switch
          },
          hideImagePreview: () => {
            // Hide image preview if it exists
            const preview = document.querySelector('.image-preview');
            if (preview) {
              preview.remove();
            }
          },
          showImagePreview: (images, element) => {
            // Show image preview functionality
            // This can be implemented later if needed
          },
          filterByTag,
          showBoardFileContextMenu: (e, board, path) => {
            // Context menu functionality can be implemented later
          }
        }
      });
      container.appendChild(boardElement);
    }
  }
  if (depth === 0) {
    feather.replace();
    addImagePreviewToSidebar();
    // Ensure root drop zone is properly set up
    const rootDropZone = document.getElementById('rootDropZone');
    if (rootDropZone) {
      // Make sure the root drop zone is visible and properly styled
      rootDropZone.style.display = 'flex';
    }
  }
}
export function getSidebarState() {
  const expandedFolders = new Set();
  document.querySelectorAll('.folder:not(.collapsed)').forEach(folderEl => {
    if (folderEl.dataset.path) {
      expandedFolders.add(folderEl.dataset.path);
    }
  });
  return expandedFolders;
}
export function applySidebarState(state) {
  if (!state) return;
  state.forEach(path => {
    const folderId = `folder-${path.replace(/[\\/]/g, '-')}`;
    const folderEl = document.getElementById(folderId);
    if (folderEl && folderEl.classList.contains('collapsed')) {
      folderEl.classList.remove('collapsed');
      const icon = folderEl.querySelector('.collapse-icon');
      icon.setAttribute('data-feather', 'chevron-down');
    }
  });
  feather.replace();
}
let partialUpdateTimeout = null;
export function schedulePartialSidebarUpdate(boardId) {
  if (partialUpdateTimeout) {
    clearTimeout(partialUpdateTimeout);
  }
  partialUpdateTimeout = setTimeout(() => {
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer && window.sidebarTree) {
      // Preserve the current expanded state of folders
      const currentState = getSidebarState();
      // Re-render the sidebar
      renderSidebar(window.sidebarTree, foldersContainer);
      // Restore the expanded state
      applySidebarState(currentState);
    }
    partialUpdateTimeout = null;
  }, 100); // Debounce for 100ms
}
export function filterByTag(tag) {
  if (typeof tag !== 'string') {
    return;
  }
  const searchInput = document.getElementById('tagSearchInput');
  const foldersContainer = document.getElementById('foldersContainer');
  if (searchInput && foldersContainer && window.sidebarTree) {
    searchInput.value = tag;
    AppState.setCurrentSearchTerm(tag);
    renderSidebar(window.sidebarTree, foldersContainer);
    // Show the clear button when a tag is clicked
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
      clearBtn.style.display = 'block';
    }
  } else {
  }
}
// After loading initial data, run a migration to fix old board card snippetPaths
export async function migrateBoardCardSnippetPaths() {
  const snippets = AppState.getSnippets();
  const snippetKeys = Object.keys(snippets);
  const boards = AppState.getBoards();
  let updated = false;
  for (const board of boards) {
    if (Array.isArray(board.cards)) {
      for (const card of board.cards) {
        // If the card's snippetPath is not found, try to find a normalized match
        if (!snippets[card.snippetPath]) {
          // Try to find a match ignoring slashes
          const normalized = card.snippetPath.replace(/\\/g, '/');
          const match = snippetKeys.find(
            key =>
              key.endsWith(`/${normalized}`) ||
              key === normalized ||
              key.replace(/\\/g, '/') === normalized
          );
          if (match) {
            card.snippetPath = match;
            updated = true;
          }
        }
      }
    }
  }
  if (updated) {
    const { saveApplicationState } = await import('./state.js');
    await saveApplicationState();
    const { showToast } = await import('../utils/index.js');
    showToast('Migrated old board card snippet paths', 'success');
  }
}
export function setSort(field, direction) {
  try {
    // Update the sort configuration in AppState
    AppState.setSortConfig({ field, direction });
    // Re-render the sidebar to apply the new sorting
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer && window.sidebarTree) {
      // Preserve the current expanded state of folders
      const currentState = getSidebarState();
      // Re-render the sidebar with new sorting
      renderSidebar(window.sidebarTree, foldersContainer);
      // Restore the expanded state
      applySidebarState(currentState);
    }
  } catch (error) {
    console.error('Error setting sort:', error);
  }
}
export function collapseAllFolders() {
  try {
    const collapseBtn = document.getElementById('collapseAllBtn');
    const icon = collapseBtn?.querySelector('i[data-feather]');
    // Get all folders including nested ones - this should get ALL folders at any nesting level
    const allFolders = document.querySelectorAll('.folder');
    // Check current state of all folders
    const folderStates = Array.from(allFolders).map(folder => ({
      element: folder,
      isCollapsed: folder.classList.contains('collapsed'),
      path: folder.dataset.path || 'unknown'
    }));

    const allCollapsed = folderStates.every(folder => folder.isCollapsed);
    if (allCollapsed) {
      // Expand all folders (including nested ones)
      allFolders.forEach((folder, index) => {
        folder.classList.remove('collapsed');
        const folderIcon = folder.querySelector('.collapse-icon');
        if (folderIcon) {
          folderIcon.setAttribute('data-feather', 'chevron-down');
        }
      });
      // Update button icon to point up (indicating next action will be collapse)
      if (icon) {
        icon.setAttribute('data-feather', 'chevrons-up');
      }
      if (collapseBtn) {
        collapseBtn.title = 'Collapse all folders';
      }
    } else {
      // Collapse all folders (including nested ones)
      allFolders.forEach((folder, index) => {
        folder.classList.add('collapsed');
        const folderIcon = folder.querySelector('.collapse-icon');
        if (folderIcon) {
          folderIcon.setAttribute('data-feather', 'chevron-right');
        }
      });
      // Update button icon to point down (indicating next action will be expand)
      if (icon) {
        icon.setAttribute('data-feather', 'chevrons-down');
      }
      if (collapseBtn) {
        collapseBtn.title = 'Expand all folders';
      }
    }
    // Update feather icons with a small delay to ensure DOM changes are processed
    setTimeout(() => {
      if (
        typeof feather !== 'undefined' &&
        typeof feather.replace === 'function'
      ) {
        feather.replace();
      }
    }, 10);
  } catch (error) {
    console.error('Error toggling folder collapse state:', error);
  }
}
export async function deleteSnippetByPath(snippetPath) {
  try {
    // Preserve the current expanded state of folders
    const currentState = getSidebarState();
    // Delete the file from disk
    if (window.electronAPI && window.electronAPI.rm) {
      await window.electronAPI.rm(`snippets/${snippetPath}`);
    } else {
      showToast('Filesystem API not available', 'error');
      return;
    }
    // Remove from AppState
    const snippets = AppState.getSnippets();
    delete snippets[snippetPath];
    AppState.setSnippets(snippets);
    // Remove from sidebar tree
    function removeSnippetFromTree(tree, path) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].type === 'snippet' && tree[i].path === path) {
          return tree.splice(i, 1)[0];
        } else if (tree[i].type === 'folder' && tree[i].children) {
          const found = removeSnippetFromTree(tree[i].children, path);
          if (found) return found;
        }
      }
      return null;
    }
    if (window.sidebarTree) {
      removeSnippetFromTree(window.sidebarTree, snippetPath);
    }
    // Refresh sidebar while preserving folder state
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer && window.sidebarTree) {
      renderSidebar(window.sidebarTree, foldersContainer);
      // Restore the expanded state
      applySidebarState(currentState);
    }
    showToast('Snippet deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting snippet:', error);
    showToast('Error deleting snippet', 'error');
  }
}
export async function deleteBoardFileImmediate(board, boardPath) {
  try {
    // Check if this is the default board and prevent deletion
    if (board.name === 'Default Board' || board.id === 'board-default') {
      showToast('Cannot delete the default board', 'error');
      return;
    }
    // Preserve the current expanded state of folders
    const currentState = getSidebarState();
    // Delete the board file from disk
    if (window.electronAPI && window.electronAPI.rm) {
      await window.electronAPI.rm(`boards/${boardPath}`);
    } else {
      showToast('Filesystem API not available', 'error');
      return;
    }
    // Remove from AppState
    const boards = AppState.getBoards();
    const updatedBoards = boards.filter(b => b.id !== board.id);
    AppState.setBoards(updatedBoards);
    // If this was the active board, switch to another one
    const activeBoardId = AppState.getActiveBoardId();
    if (activeBoardId === board.id && updatedBoards.length > 0) {
      const { setCurrentBoard } = await import('./boards.js');
      await setCurrentBoard(updatedBoards[0].id);
    }
    // Remove from sidebar tree
    function removeBoardFromTree(tree, path) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].type === 'board' && tree[i].path === path) {
          return tree.splice(i, 1)[0];
        } else if (tree[i].type === 'folder' && tree[i].children) {
          const found = removeBoardFromTree(tree[i].children, path);
          if (found) return found;
        }
      }
      return null;
    }
    if (window.sidebarTree) {
      removeBoardFromTree(window.sidebarTree, boardPath);
    }
    // Refresh sidebar while preserving folder state
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer && window.sidebarTree) {
      renderSidebar(window.sidebarTree, foldersContainer);
      // Restore the expanded state
      applySidebarState(currentState);
    }
    // Update board selector if it exists
    const { renderBoardSelector } = await import('./boards.js');
    renderBoardSelector();
    showToast('Board deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting board:', error);
    showToast('Error deleting board', 'error');
  }
}
export {
  openFolderModal,
  openSnippetModal,
  createFolder,
  createSnippet,
  closeFolderModal,
  closeSnippetModal,
  closeEditSnippetModal,
  showInlineFolderCreation,
  createInlineFolder,
  hideInlineFolderCreation,
  getAllFolders,
  populateFolderDropdown,
  handleSnippetDrop,
  handleBoardDrop,
  handleFolderDrop,
  openEditSnippetModal
};
