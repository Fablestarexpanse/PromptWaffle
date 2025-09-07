import {
  safeElementOperation,
  escapeHtml,
  showToast
} from '../../utils/index.js';
import { showColorPicker } from './color.js';
import { AppState } from '../../state/appState.js';
import { showDeleteConfirmation } from '../../utils/confirmationModal.js';

import * as bootstrap from '../../bootstrap/index.js';
/**
 * Show context menu with error handling and validation
 * @param {MouseEvent} e - The mouse event
 * @param {number} x - X coordinate for the menu
 * @param {number} y - Y coordinate for the menu
 */
export function showContextMenu(e, x, y) {
  try {
    if (!e) {
      console.error('No event provided to showContextMenu');
      return;
    }
    e.preventDefault();
    // Validate coordinates
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      isNaN(x) ||
      isNaN(y)
    ) {
      console.error('Invalid coordinates for context menu:', { x, y });
      return;
    }
    // Remove any existing context menu
    safeElementOperation(
      document.getElementById('contextMenu'),
      existingMenu => {
        existingMenu.remove();
      }
    );
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.zIndex = '999999';
    // Create New Snippet menu item
    const createSnippetItem = document.createElement('div');
    createSnippetItem.className = 'context-menu-item';
    createSnippetItem.textContent = 'Create New Snippet';
    // Add icon safely
    const icon = document.createElement('i');
    icon.setAttribute('data-feather', 'file-plus');
    createSnippetItem.insertBefore(icon, createSnippetItem.firstChild);
    createSnippetItem.onclick = async () => {
      try {
        contextMenu.remove();
        const { openSnippetModal } = await import('../../bootstrap/sidebar.js');
        openSnippetModal();
      } catch (error) {
        console.error('Error in create snippet menu item:', error);
      }
    };
    // Create Snippet from Clipboard menu item
    const createFromClipboardItem = document.createElement('div');
    createFromClipboardItem.className = 'context-menu-item';
    createFromClipboardItem.textContent = 'Create from Clipboard';
    // Add icon safely
    const clipboardIcon = document.createElement('i');
    clipboardIcon.setAttribute('data-feather', 'clipboard');
    createFromClipboardItem.insertBefore(
      clipboardIcon,
      createFromClipboardItem.firstChild
    );
    createFromClipboardItem.onclick = async () => {
      try {
        contextMenu.remove();
        // Get clipboard content
        let clipboardText = '';
        try {
          clipboardText = await navigator.clipboard.readText();
        } catch (clipboardError) {
          console.warn('Could not read clipboard:', clipboardError);
          showToast(
            'Could not read clipboard content. Please copy text first.',
            'warning'
          );
          return;
        }
        if (!clipboardText || clipboardText.trim() === '') {
          showToast(
            'Clipboard is empty. Please copy some text first.',
            'warning'
          );
          return;
        }
        // Open snippet modal with clipboard content
        const modal = document.getElementById('snippetModal');
        if (modal) {
          modal.style.display = 'flex';
          const input = document.getElementById('snippetTextInput');
          if (input) {
            input.value = clipboardText;
            input.focus();
            input.select(); // Select all text for easy editing
          }
          const tagsInput = document.getElementById('snippetTagsInput');
          if (tagsInput) tagsInput.value = '';
          const confirmBtn = document.getElementById('createSnippetConfirmBtn');
          if (confirmBtn) confirmBtn.textContent = 'Create';
          // Populate folder dropdown
          const folderSelect = document.getElementById('snippetFolderSelect');
          if (folderSelect && window.sidebarTree) {
            const { getAllFolders, populateFolderDropdown } = await import(
              '../../bootstrap/sidebar.js'
            );
            const folders = getAllFolders(window.sidebarTree);
            populateFolderDropdown(folderSelect, folders, '');
          }
        }
      } catch (error) {
        console.error('Error in create from clipboard menu item:', error);
        showToast('Error creating snippet from clipboard', 'error');
      }
    };
    // Create New Board menu item
    const createBoardItem = document.createElement('div');
    createBoardItem.className = 'context-menu-item';
    createBoardItem.textContent = 'Create New Board';
    // Add icon safely
    const boardIcon = document.createElement('i');
    boardIcon.setAttribute('data-feather', 'layout');
    createBoardItem.insertBefore(boardIcon, createBoardItem.firstChild);
    createBoardItem.onclick = async () => {
      try {
        contextMenu.remove();
        const { openNewBoardModal } = await import('../../bootstrap/boards.js');
        openNewBoardModal();
      } catch (error) {
        console.error('Error in create board menu item:', error);
      }
    };
    // Add Reference Image menu item
    const addImageItem = document.createElement('div');
    addImageItem.className = 'context-menu-item';
    addImageItem.textContent = 'Add Reference Image';
    // Add icon safely
    const imageIcon = document.createElement('i');
    imageIcon.setAttribute('data-feather', 'image');
    addImageItem.insertBefore(imageIcon, addImageItem.firstChild);
    addImageItem.onclick = async () => {
      try {
        contextMenu.remove();
        const { handleReferenceImageUpload } = await import(
          '../../bootstrap/ui.js'
        );
        handleReferenceImageUpload();
      } catch (error) {
        console.error('Error in add reference image menu item:', error);
      }
    };
    // Add separator
    const separator = document.createElement('div');
    separator.className = 'context-menu-separator';
    contextMenu.appendChild(createSnippetItem);
    contextMenu.appendChild(createFromClipboardItem);
    contextMenu.appendChild(separator);
    contextMenu.appendChild(createBoardItem);
    contextMenu.appendChild(addImageItem);
    document.body.appendChild(contextMenu);
    // Replace feather icons
    try {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (iconError) {
      console.warn('Error replacing feather icons:', iconError);
    }
    // Close menu when clicking elsewhere
    const closeMenu = event => {
      try {
        if (event && contextMenu && !contextMenu.contains(event.target)) {
          contextMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      } catch (error) {
        console.error('Error in context menu close handler:', error);
      }
    };
    // Add slight delay to prevent immediate closing
    setTimeout(() => {
      try {
        document.addEventListener('click', closeMenu);
      } catch (error) {
        console.error('Error adding context menu close listener:', error);
      }
    }, 10);
  } catch (error) {
    console.error('Error showing context menu:', error);
  }
}
/**
 * Show snippet context menu with error handling and validation
 * @param {MouseEvent} e - The mouse event
 * @param {Object} snippet - The snippet object
 * @param {string} path - The snippet path
 */
export function showSnippetContextMenu(e, snippet, path) {
  try {
    if (!e) {
      console.error('No event provided to showSnippetContextMenu');
      return;
    }
    if (!snippet || typeof snippet !== 'object') {
      console.error(
        'Invalid snippet provided to showSnippetContextMenu:',
        snippet
      );
      return;
    }
    if (!path || typeof path !== 'string') {
      console.error('Invalid path provided to showSnippetContextMenu:', path);
      return;
    }
    e.preventDefault();
    // Remove any existing context menu
    safeElementOperation(
      document.getElementById('snippetContextMenu'),
      existingMenu => {
        existingMenu.remove();
      }
    );
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'snippetContextMenu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.zIndex = '999999';
    // Edit Snippet menu item
    const editItem = document.createElement('div');
    editItem.className = 'context-menu-item';
    editItem.textContent = 'Edit Snippet';
    // Add icon safely
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-feather', 'edit-3');
    editItem.insertBefore(editIcon, editItem.firstChild);
    editItem.onclick = async () => {
      try {
        contextMenu.remove();
        // Open the edit snippet modal
        const { openEditSnippetModal } = await import(
          '../../bootstrap/sidebar.js'
        );
        openEditSnippetModal(snippet, path);
      } catch (error) {
        console.error('Error in edit snippet menu item:', error);
      }
    };
    
    // Add PromptKit edit option if this is a PromptKit snippet
    if (snippet.promptkit) {
      const promptKitItem = document.createElement('div');
      promptKitItem.className = 'context-menu-item';
      promptKitItem.textContent = 'Edit with PromptKit';
      // Add icon safely
      const promptKitIcon = document.createElement('i');
      promptKitIcon.setAttribute('data-feather', 'layers');
      promptKitItem.insertBefore(promptKitIcon, promptKitItem.firstChild);
      promptKitItem.onclick = async () => {
        try {
          contextMenu.remove();
          // Open the PromptKit modal with this snippet loaded
          const { promptKitUI } = await import('../../utils/promptkit-ui.js');
          await promptKitUI.openModal();
          promptKitUI.loadFromSnippet(snippet);
        } catch (error) {
          console.error('Error in PromptKit edit menu item:', error);
          const { showToast } = await import('../../utils/index.js');
          showToast('Error opening PromptKit', 'error');
        }
      };
      contextMenu.appendChild(promptKitItem);
    }

    // Create Wildcard Studio Profile menu item
    const createProfileItem = document.createElement('div');
    createProfileItem.className = 'context-menu-item';
    createProfileItem.textContent = 'Create Wildcard Studio Profile';
    // Add icon safely
    const profileIcon = document.createElement('i');
    profileIcon.setAttribute('data-feather', 'smile');
    createProfileItem.insertBefore(profileIcon, createProfileItem.firstChild);
    createProfileItem.onclick = async () => {
      try {
        contextMenu.remove();
        // Open the PromptKit modal and create a new profile from this snippet
        const { promptKitUI } = await import('../../utils/promptkit-ui.js');
        await promptKitUI.openModal();
        promptKitUI.createProfileFromSnippet(snippet);
      } catch (error) {
        console.error('Error in create profile menu item:', error);
        const { showToast } = await import('../../utils/index.js');
        showToast('Error opening Wildcard Studio', 'error');
      }
    };
    contextMenu.appendChild(createProfileItem);
    // Duplicate Snippet menu item
    const duplicateItem = document.createElement('div');
    duplicateItem.className = 'context-menu-item';
    duplicateItem.textContent = 'Duplicate Snippet';
    // Add icon safely
    const duplicateIcon = document.createElement('i');
    duplicateIcon.setAttribute('data-feather', 'copy');
    duplicateItem.insertBefore(duplicateIcon, duplicateItem.firstChild);
    duplicateItem.onclick = () => {
      try {
        contextMenu.remove();
        showToast('Duplicate snippet feature coming soon!', 'info');
      } catch (error) {
        console.error('Error in duplicate snippet menu item:', error);
      }
    };
    // Delete Snippet menu item
    const deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = 'Delete Snippet';
    // Add icon safely
    const deleteIcon = document.createElement('i');
    deleteIcon.setAttribute('data-feather', 'trash-2');
    deleteItem.insertBefore(deleteIcon, deleteItem.firstChild);
    deleteItem.onclick = async () => {
      try {
        contextMenu.remove();
        const snippetText = snippet.text
                  ? escapeHtml(snippet.text.substring(0, 50)) +
          (snippet.text.length > 50 ? '...' : '')
          : 'this snippet';
        
        const confirmed = await showDeleteConfirmation(snippetText, 'snippet');
        
        if (!confirmed) {
          return;
        }

        try {
          const { deleteSnippetByPath } = await import(
            '../../bootstrap/sidebar.js'
          );
          await deleteSnippetByPath(path);
        } catch (error) {
          console.error('Error deleting snippet:', error);
          showToast('Error deleting snippet', 'error');
        }
      } catch (error) {
        console.error('Error in delete snippet menu item:', error);
      }
    };
    contextMenu.appendChild(editItem);
    contextMenu.appendChild(duplicateItem);
    contextMenu.appendChild(deleteItem);
    document.body.appendChild(contextMenu);
    // Replace feather icons
    try {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (iconError) {
      console.warn('Error replacing feather icons:', iconError);
    }
    // Close menu when clicking elsewhere
    const closeMenu = event => {
      try {
        if (event && contextMenu && !contextMenu.contains(event.target)) {
          contextMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      } catch (error) {
        console.error('Error in snippet context menu close handler:', error);
      }
    };
    // Add slight delay to prevent immediate closing
    setTimeout(() => {
      try {
        document.addEventListener('click', closeMenu);
      } catch (error) {
        console.error(
          'Error adding snippet context menu close listener:',
          error
        );
      }
    }, 10);
  } catch (error) {
    console.error('Error showing snippet context menu:', error);
  }
}
/**
 * Show card context menu with error handling and validation
 * @param {MouseEvent} e - The mouse event
 * @param {string} cardId - The card ID
 * @param {string} snippetPath - The snippet path
 */
export async function showCardContextMenu(e, cardId, snippetPath) {
  try {
    if (!e) {
      console.error('No event provided to showCardContextMenu');
      return;
    }
    if (!cardId || typeof cardId !== 'string') {
      console.error('Invalid cardId provided to showCardContextMenu:', cardId);
      return;
    }
    if (!snippetPath || typeof snippetPath !== 'string') {
      console.error(
        'Invalid snippetPath provided to showCardContextMenu:',
        snippetPath
      );
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    // Remove any existing context menu
    safeElementOperation(
      document.getElementById('cardContextMenu'),
      existingMenu => {
        existingMenu.remove();
      }
    );
    const { getActiveBoard } = await import('../../bootstrap/boards.js');
    const activeBoard = getActiveBoard();
    if (!activeBoard) {
      console.error('No active board found for card context menu');
      return;
    }
    const card = activeBoard.cards
      ? activeBoard.cards.find(c => c && c.id === cardId)
      : null;
    const snippet = AppState.snippets[snippetPath];
    if (!card) {
      console.error('Card not found for context menu:', cardId);
      return;
    }
    if (!snippet) {
      console.error('Snippet not found for context menu:', snippetPath);
      return;
    }
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'cardContextMenu';
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.zIndex = '999999';
    // Edit Snippet menu item
    const editSnippetItem = document.createElement('div');
    editSnippetItem.className = 'context-menu-item';
    editSnippetItem.textContent = 'Edit Snippet';
    // Add icon safely
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-feather', 'edit-3');
    editSnippetItem.insertBefore(editIcon, editSnippetItem.firstChild);
    editSnippetItem.onclick = async () => {
      try {
        contextMenu.remove();
        // Open the edit snippet modal
        const { openEditSnippetModal } = await import(
          '../../bootstrap/sidebar.js'
        );
        openEditSnippetModal(snippet, snippetPath);
      } catch (error) {
        console.error('Error in edit snippet menu item:', error);
        showToast('Error opening edit modal', 'error');
      }
    };
    
    // Add PromptKit edit option if this is a PromptKit snippet
    if (snippet.promptkit) {
      const promptKitItem = document.createElement('div');
      promptKitItem.className = 'context-menu-item';
      promptKitItem.textContent = 'Edit with PromptKit';
      // Add icon safely
      const promptKitIcon = document.createElement('i');
      promptKitIcon.setAttribute('data-feather', 'layers');
      promptKitItem.insertBefore(promptKitIcon, promptKitItem.firstChild);
      promptKitItem.onclick = async () => {
        try {
          contextMenu.remove();
          // Open the PromptKit modal with this snippet loaded
          const { promptKitUI } = await import('../../utils/promptkit-ui.js');
          await promptKitUI.openModal();
          promptKitUI.loadFromSnippet(snippet);
        } catch (error) {
          console.error('Error in PromptKit edit menu item:', error);
          showToast('Error opening PromptKit', 'error');
        }
      };
      contextMenu.appendChild(promptKitItem);
    }
    // Change Color menu item
    const changeColorItem = document.createElement('div');
    changeColorItem.className = 'context-menu-item';
    changeColorItem.textContent = 'Change Color';
    // Add icon safely
    const colorIcon = document.createElement('i');
    colorIcon.setAttribute('data-feather', 'droplet');
    changeColorItem.insertBefore(colorIcon, changeColorItem.firstChild);
    changeColorItem.onclick = () => {
      try {
        contextMenu.remove();
        // Get current card color or default
        const currentColor = card.color || '#40444b';
        showColorPicker(cardId, currentColor);
      } catch (error) {
        console.error('Error in change color menu item:', error);
      }
    };
    // Lock/Unlock menu item
    const lockItem = document.createElement('div');
    lockItem.className = 'context-menu-item';
    lockItem.textContent = card.locked ? 'Unlock' : 'Lock';
    // Add icon safely
    const lockIcon = document.createElement('i');
    lockIcon.setAttribute('data-feather', card.locked ? 'unlock' : 'lock');
    lockItem.insertBefore(lockIcon, lockItem.firstChild);
    lockItem.onclick = () => {
      try {
        contextMenu.remove();
        bootstrap.toggleCardLock(cardId);
      } catch (error) {
        console.error('Error in lock/unlock menu item:', error);
      }
    };
    // Remove from Board menu item
    const removeItem = document.createElement('div');
    removeItem.className = 'context-menu-item';
    removeItem.textContent = 'Remove from Board';
    // Add icon safely
    const removeIcon = document.createElement('i');
    removeIcon.setAttribute('data-feather', 'trash-2');
    removeItem.insertBefore(removeIcon, removeItem.firstChild);
    removeItem.onclick = () => {
      try {
        contextMenu.remove();
        bootstrap.removeCardFromBoard(cardId);
      } catch (error) {
        console.error('Error in remove from board menu item:', error);
      }
    };
    contextMenu.appendChild(editSnippetItem);
    contextMenu.appendChild(changeColorItem);
    contextMenu.appendChild(lockItem);
    contextMenu.appendChild(removeItem);
    document.body.appendChild(contextMenu);
    // Replace feather icons
    try {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (iconError) {
      console.warn('Error replacing feather icons:', iconError);
    }
    // Close menu when clicking elsewhere
    const closeMenu = event => {
      try {
        if (event && contextMenu && !contextMenu.contains(event.target)) {
          contextMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      } catch (error) {
        console.error('Error in card context menu close handler:', error);
      }
    };
    // Add slight delay to prevent immediate closing
    setTimeout(() => {
      try {
        document.addEventListener('click', closeMenu);
      } catch (error) {
        console.error('Error adding card context menu close listener:', error);
      }
    }, 10);
  } catch (error) {
    console.error('Error showing card context menu:', error);
  }
}
