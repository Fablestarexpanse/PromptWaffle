import { AppState } from '../state/appState.js';

import { safeElementOperation, safeElectronAPICall } from '../utils/index.js';
import * as bootstrap from '../bootstrap/index.js';
import { showToast } from '../utils/index.js';
import {
  getSidebarState,
  applySidebarState,
  renderSidebar
} from '../bootstrap/sidebar.js';
function setupTextSelectionHandlers() {
  try {
    const toolbar = document.getElementById('textSelectionToolbar');
    const splitBtn = document.getElementById('splitTextBtn');
    if (!toolbar) {
      console.error('Text selection toolbar not found');
      return;
    }
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', e => {
      try {
        if (toolbar && !toolbar.contains(e.target)) {
          hideSelectionToolbar();
        }
      } catch (error) {
        console.error('Error in mousedown handler:', error);
      }
    });
    if (splitBtn) {
      splitBtn.addEventListener('click', e => {
        try {
          e.preventDefault();
          e.stopPropagation();
          splitSelectedText();
        } catch (error) {
          console.error('Error in split button click handler:', error);
          showToast('Error splitting text', 'error');
        }
      });
    } else {
      console.error('Split button not found!');
    }
  } catch (error) {
    console.error('Error setting up text selection handlers:', error);
  }
}
function handleTextSelection(event) {
  try {
    const selection = window.getSelection();
    if (!selection) {
      hideSelectionToolbar();
      return;
    }
    const selectedTextTrimmed = selection.toString().trim();
    if (!selectedTextTrimmed) {
      hideSelectionToolbar();
      return;
    }
    let cardContent = null;
    let node = selection.anchorNode;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }
    if (node) {
      cardContent = node.closest('.board-card .card-content');
    }
    if (!cardContent) {
      hideSelectionToolbar();
      return;
    }
    const card = cardContent.closest('.board-card');
    if (!card) {
      hideSelectionToolbar();
      return;
    }
    AppState.setCurrentSelectedText(selection.toString().trim());
    AppState.setCurrentSelectedCard(card);
    const fullText = cardContent.textContent || '';
    const selectedText = selection.toString() || '';
    const selectionStart = fullText.indexOf(selectedText);
    const selectionEnd =
      selectionStart >= 0 ? selectionStart + selectedText.length : 0;
    AppState.setSelectionStartOffset(selectionStart);
    AppState.setSelectionEndOffset(selectionEnd);
    if (
      event &&
      typeof event.pageX === 'number' &&
      typeof event.pageY === 'number'
    ) {
      showSelectionToolbar(event.pageX, event.pageY);
    }
  } catch (error) {
    console.error('Error handling text selection:', error);
    hideSelectionToolbar();
  }
}
function showSelectionToolbar(x, y) {
  try {
    const toolbar = document.getElementById('textSelectionToolbar');
    if (!toolbar) {
      console.error('Text selection toolbar not found');
      return;
    }
    if (typeof x !== 'number' || typeof y !== 'number') {
      console.error('Invalid coordinates provided to showSelectionToolbar:', {
        x,
        y
      });
      return;
    }
    toolbar.style.left = `${x - 100}px`;
    toolbar.style.top = `${y - 50}px`;
    toolbar.style.display = 'flex';
    const rect = toolbar.getBoundingClientRect();
    if (rect && rect.width > 0) {
      if (rect.right > window.innerWidth) {
        toolbar.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      if (rect.left < 0) {
        toolbar.style.left = '10px';
      }
      if (rect.top < 0) {
        toolbar.style.top = `${y + 20}px`;
      }
    }
    if (
      typeof feather !== 'undefined' &&
      typeof feather.replace === 'function'
    ) {
      try {
        feather.replace();
      } catch (error) {
        console.error('Error refreshing feather icons:', error);
      }
    }
  } catch (error) {
    console.error('Error showing selection toolbar:', error);
  }
}
function hideSelectionToolbar() {
  try {
    const toolbar = document.getElementById('textSelectionToolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
    AppState.setCurrentSelectedText('');
    AppState.setCurrentSelectedCard(null);
    AppState.setSelectionStartOffset(0);
    AppState.setSelectionEndOffset(0);
  } catch (error) {
    console.error('Error hiding selection toolbar:', error);
  }
}
function updateClearButtonVisibility() {
  try {
    const searchInput = document.getElementById('tagSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchInput && clearBtn) {
      if (searchInput.value.trim()) {
        clearBtn.style.display = 'block';
      } else {
        clearBtn.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error updating clear button visibility:', error);
  }
}
async function splitSelectedText() {
  try {
    const selectedText = AppState.getCurrentSelectedText();
    const selectedCard = AppState.getCurrentSelectedCard();
    if (!selectedText || !selectedCard) {
      showToast('No text selected for splitting', 'error');
      return;
    }
    const cardId = selectedCard.id;
    if (!cardId) {
      showToast('Invalid card selection', 'error');
      return;
    }
    const board = bootstrap.getActiveBoard();
    if (!board || !board.cards) {
      showToast('No active board found', 'error');
      return;
    }
    const card = board.cards.find(c => c && c.id === cardId);
    if (!card) {
      showToast('Card not found in board', 'error');
      return;
    }
    const snippets = AppState.getSnippets();
    const snippet = snippets[card.snippetPath];
    const currentText = card.customText || (snippet && snippet.text) || '';
    if (!currentText) {
      showToast('No text content found in card', 'error');
      return;
    }
    const selectionStart = AppState.getSelectionStartOffset();
    const selectionEnd = AppState.getSelectionEndOffset();
    if (
      selectionStart < 0 ||
      selectionEnd <= selectionStart ||
      selectionEnd > currentText.length
    ) {
      showToast('Invalid text selection range', 'error');
      return;
    }
    // Extract the selected text and remaining text
    const selectedTextContent = currentText.substring(
      selectionStart,
      selectionEnd
    );
    const beforeSelection = currentText.substring(0, selectionStart);
    const afterSelection = currentText.substring(selectionEnd);
    const remainingText = (beforeSelection + afterSelection).trim();
    if (!selectedTextContent.trim()) {
      showToast('Selected text is empty', 'error');
      return;
    }
    // Create new snippet from selected text
    const timestamp = Date.now();
    const newSnippetName = `snippet_${timestamp}.json`;
    // Always place split snippets in "Cut Snippets" folder
    const cutSnippetsFolder = 'Cut Snippets';
    const snippetPath = `snippets/${cutSnippetsFolder}/${newSnippetName}`;
    // Create new snippet metadata
    const newSnippetMetadata = {
      id: `snippet_${timestamp}`,
      text: selectedTextContent,
      tags: snippet ? [...(snippet.tags || [])] : [],
      created: Date.now(),
      modified: Date.now(),
              title: selectedTextContent.substring(0, 50),
      description: '',
      category: snippet ? snippet.category || '' : '',
      version: '1.0'
    };
    // Save the new snippet file
    try {
      if (window.electronAPI && window.electronAPI.writeFile) {
        const jsonContent = JSON.stringify(newSnippetMetadata, null, 2);
        await window.electronAPI.writeFile(snippetPath, jsonContent);
      } else {
        showToast('Filesystem API not available', 'error');
        return;
      }
    } catch (err) {
      showToast('Error creating new snippet file', 'error');
      console.error('Error creating new snippet file:', err);
      return;
    }
    // Immediately add new snippet to AppState cache
    const updatedSnippets = AppState.getSnippets();
    updatedSnippets[snippetPath] = newSnippetMetadata;
    AppState.setSnippets(updatedSnippets);

    // Verify the snippet is in the cache by reading it back
    const verifySnippet = AppState.getSnippets()[snippetPath];
    if (!verifySnippet) {
      console.error(
        'Snippet not found in cache after adding, attempting to reload...'
      );
      // Try to reload the snippet from disk
      try {
        const fileContent = await window.electronAPI.readFile(snippetPath);
        const reloadedSnippet = JSON.parse(fileContent);
        const reloadedSnippets = AppState.getSnippets();
        reloadedSnippets[snippetPath] = reloadedSnippet;
        AppState.setSnippets(reloadedSnippets);
      } catch (reloadErr) {
        console.error('Failed to reload snippet from disk:', reloadErr);
      }
    } else {
    }
    // Add new snippet to sidebar tree
    if (!window.sidebarTree) window.sidebarTree = [];
    const snippetEntry = {
      type: 'snippet',
      name: newSnippetName.replace('.json', ''),
      path: snippetPath,
      content: newSnippetMetadata
    };
    // Ensure "Cut Snippets" folder exists and is at the top
    const cutSnippetsFolderPath = `snippets/${cutSnippetsFolder}`;
    const cutSnippetsTreePath = cutSnippetsFolder; // Path in sidebar tree doesn't include 'snippets/' prefix
    let cutSnippetsFolderEntry = window.sidebarTree.find(
      entry => entry.type === 'folder' && entry.path === cutSnippetsTreePath
    );
    if (!cutSnippetsFolderEntry) {
      // Create the "Cut Snippets" folder
      cutSnippetsFolderEntry = {
        type: 'folder',
        name: cutSnippetsFolder,
        path: cutSnippetsTreePath, // Use the tree path, not the file system path
        children: [],
        expanded: true
      };
      // Insert at the top of the sidebar tree
      window.sidebarTree.unshift(cutSnippetsFolderEntry);
      // Create the physical folder on disk
      try {
        if (window.electronAPI && window.electronAPI.createFolder) {
          await window.electronAPI.createFolder(cutSnippetsFolderPath);
        } else {
          console.error('createFolder API not available');
        }
      } catch (err) {
        console.error('Error creating Cut Snippets folder on disk:', err);
        // Continue anyway - the folder might already exist
      }
    } else {
    }
    // Ensure the folder has a children array
    if (!cutSnippetsFolderEntry.children) {
      cutSnippetsFolderEntry.children = [];
    }
    // Add snippet to the Cut Snippets folder
    cutSnippetsFolderEntry.children.push(snippetEntry);
    // Update the original card with remaining text
    if (remainingText) {
      card.customText = remainingText;
    } else {
      // If no remaining text, remove the card
      const cardIndex = board.cards.findIndex(c => c && c.id === cardId);
      if (cardIndex !== -1) {
        board.cards.splice(cardIndex, 1);
      }
    }
    // Add the new snippet as a card to the board
    const newCardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Get color palette and choose a different color for the new card
    const cardColorPalette = [
      '#E74C3C',
      '#3498DB',
      '#2ECC71',
      '#F39C12',
      '#9B59B6',
      '#1ABC9C',
      '#F1C40F',
      '#E91E63',
      '#FF5722',
      '#607D8B',
      '#8BC34A',
      '#FF9800',
      '#795548',
      '#9C27B0',
      '#00BCD4'
    ];
    // Find a different color than the original card
    let newColor = cardColorPalette[0]; // Default to first color
    if (card.color && cardColorPalette.includes(card.color)) {
      // Find a different color from the palette
      const availableColors = cardColorPalette.filter(
        color => color !== card.color
      );
      if (availableColors.length > 0) {
        newColor =
          availableColors[Math.floor(Math.random() * availableColors.length)];
      }
    } else {
      // If original card has no color or color not in palette, pick random
      newColor =
        cardColorPalette[Math.floor(Math.random() * cardColorPalette.length)];
    }
    const newCard = {
      id: newCardId,
      snippetPath,
      x: card.x + 20, // Offset slightly from original card
      y: card.y + 20,
      width: card.width,
      height: card.height,
      color: newColor, // Use a different color
      locked: false,
      customText: selectedTextContent // Use the selected text as custom text
    };
    board.cards.push(newCard);
    // Save the updated board
    try {
      if (window.electronAPI && window.electronAPI.writeFile) {
        const boardContent = JSON.stringify(board, null, 2);
        await window.electronAPI.writeFile(board.filePath, boardContent);
      }
    } catch (err) {
      console.error('Error saving updated board:', err);
    }
    // Update the current board in AppState
    AppState.setCurrentBoard(board);
    // Refresh the sidebar to show the new snippet
    try {
      const foldersContainer = document.getElementById('foldersContainer');
      if (foldersContainer && window.sidebarTree) {
        // Preserve the current expanded state of folders
        const { getSidebarState, applySidebarState } = await import(
          '../bootstrap/sidebar.js'
        );
        const currentState = getSidebarState();
        renderSidebar(window.sidebarTree, foldersContainer);
        // Restore the expanded state
        applySidebarState(currentState);
      } else {
        console.error('Cannot refresh sidebar - missing container or tree:', {
          hasContainer: Boolean(foldersContainer),
          hasTree: Boolean(window.sidebarTree)
        });
      }
    } catch (err) {
      console.error('Error refreshing sidebar:', err);
    }
    // Verify snippet is available before rendering board
    const finalSnippets = AppState.getSnippets();

    // Clean up any orphaned cards before rendering
    try {
      const { cleanupOrphanedCards } = await import('../bootstrap/boards.js');
      const cleanedCount = cleanupOrphanedCards();
      if (cleanedCount > 0) {
      }
    } catch (err) {
      console.error('Error cleaning up orphaned cards:', err);
    }
    // Re-render the board directly without calling refreshUI
    try {
      const { renderBoard } = await import('../bootstrap/boards.js');
      await renderBoard();
    } catch (err) {
      console.error('Error re-rendering board:', err);
      showToast('Error updating board display', 'error');
    }
    showToast('Created new snippet from selected text', 'success');
  } catch (error) {
    console.error('Error splitting selected text:', error);
    showToast('Failed to split text', 'error');
  } finally {
    hideSelectionToolbar();
  }
}
export function setupEventListeners() {
  try {
    const eventHandlers = {
      newFolderBtn: () => bootstrap.openFolderModal(),
      newSnippetBtn: () => bootstrap.openSnippetModal(),
      promptKitBtn: async () => {
        try {
          const { promptKitUI } = await import('../utils/promptkit-ui.js');
          await promptKitUI.openModal();
        } catch (error) {
          console.error('Error opening PromptKit modal:', error);
          const { showToast } = await import('../utils/index.js');
          showToast('Error opening PromptKit', 'error');
        }
      },
      sortBtn: bootstrap.toggleSortMenu,
      collapseAllBtn: bootstrap.collapseAllFolders,
      newBoardBtn: () => bootstrap.openNewBoardModal(),
      boardSelect: async () => {
        // Handle board selection from dropdown
        const boardSelect = document.getElementById('boardSelect');
        if (boardSelect && boardSelect.value) {
          const { setCurrentBoard } = bootstrap;
          await setCurrentBoard(boardSelect.value);
          // Reset selection to placeholder after a short delay to allow render
          setTimeout(() => {
            boardSelect.value = '';
          }, 100);
        }
      },
      copyCompiledBtn: bootstrap.copyCompiledPrompt,
      saveCompiledBtn: bootstrap.saveCompiledSnippet,
      exportToObsidianBtn: async () => {
        try {
          const { exportToObsidian } = await import('../utils/utils.js');
          await exportToObsidian();
        } catch (error) {
          console.error('Error exporting to Obsidian:', error);
          showToast('Export failed. Please try again.', 'error');
        }
      },
      sendToComfyUIBtn: async () => {
        try {
          const { savePromptToComfyUI } = await import('../utils/comfyui-integration.js');
          await savePromptToComfyUI();
        } catch (error) {
          console.error('Error saving prompt to ComfyUI:', error);
          const { showToast } = await import('../utils/index.js');
          showToast('Failed to save prompt for ComfyUI', 'error');
        }
      },
      exportDataBtn: async () => {
        try {
          const { exportAllData } = await import('../utils/export-import.js');
          await exportAllData();
        } catch (error) {
          console.error('Error exporting data:', error);
          const { showToast } = await import('../utils/index.js');
          showToast('Failed to export data', 'error');
        }
      },
      importDataBtn: async () => {
        try {
          const { importData } = await import('../utils/export-import.js');
          const confirmed = confirm('Importing data will replace your current data. A backup will be created automatically. Continue?');
          if (confirmed) {
            await importData();
          }
        } catch (error) {
          console.error('Error importing data:', error);
          const { showToast } = await import('../utils/index.js');
          showToast('Failed to import data', 'error');
        }
      },
      verifyBackupBtn: async () => {
        try {
          const { showToast } = await import('../utils/index.js');
          if (!window.electronAPI || typeof window.electronAPI.verifyBackup !== 'function') {
            showToast('Verification functionality not available', 'error');
            return;
          }
          
          // Use IPC to show file picker
          const result = await window.electronAPI.openBackupFileDialog();
          
          if (result.cancelled || !result.filePath) {
            return;
          }
          
          showToast('Verifying backup...', 'info');
          const verifyResult = await window.electronAPI.verifyBackup(result.filePath);
          
          if (verifyResult.valid) {
            showToast('Backup verification passed!', 'success');
            console.log('Backup Summary:', verifyResult.summary);
            const summary = verifyResult.summary || {};
            alert(`Backup Verification Passed!\n\nSummary:\n- Snippets: ${summary.snippets || 0}\n- Boards: ${summary.boards || 0}\n- Characters: ${summary.characters || 0}\n- Character Images: ${summary.characterImages || 0}\n- Board Images: ${summary.boardImages || 0}\n- Profiles: ${summary.profiles || 0}\n- Wildcards: ${summary.wildcards || 0}`);
          } else {
            showToast(`Backup verification found ${verifyResult.issues.length} issue(s)`, 'error');
            const issuesText = verifyResult.issues.join('\n');
            const warningsText = verifyResult.warnings && verifyResult.warnings.length > 0 ? '\n\nWarnings:\n' + verifyResult.warnings.join('\n') : '';
            alert(`Backup Verification Failed!\n\nIssues:\n${issuesText}${warningsText}`);
          }
        } catch (error) {
          console.error('Error verifying backup:', error);
          const { showToast } = await import('../utils/index.js');
          showToast('Failed to verify backup', 'error');
        }
      },
      checkForUpdatesBtn: async () => {
        const btn = document.getElementById('checkForUpdatesBtn');
        if (btn) {
          btn.classList.add('loading');
          btn.disabled = true;
        }
        try {
          const { versionChecker } = await import(
            '../utils/version-checker.js'
          );
          const { updateUI } = await import('../utils/update-ui.js');
          const updateInfo = await versionChecker.checkForUpdates();
          versionChecker.displayUpdateNotification(updateInfo);
          if (updateInfo.success && updateInfo.isOutdated) {
            updateUI.showUpdateModal(updateInfo);
          } else if (updateInfo.success && !updateInfo.isOutdated) {
            const { showToast } = await import('../utils/index.js');
            showToast('You are running the latest version!', 'success');
          } else if (!updateInfo.success) {
            const { showToast } = await import('../utils/index.js');
            showToast(`Update check failed: ${updateInfo.error}`, 'error');
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
          const { showToast } = await import('../utils/index.js');
          showToast('Error checking for updates', 'error');
        } finally {
          if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
          }
        }
      },
      toggleColorBtn: bootstrap.toggleCompiledColors,
      toggleCardColorsBtn: bootstrap.toggleCardColors,
      toggleSnippetColorsBtn: bootstrap.toggleCardColors,
      expandCompiledBtn: bootstrap.toggleCompiledPromptExpansion,
      exportPromptBtn: bootstrap.exportPromptAsJSON,
      addImageBtn: () => {
        // Import and call the handleReferenceImageUpload function directly
        // This bypasses the file input element entirely
        import('../bootstrap/ui.js')
          .then(ui => {
            ui.handleReferenceImageUpload();
          })
          .catch(error => {
            console.error('Error importing handleReferenceImageUpload:', error);
          });
      },
      clearBoardBtn: bootstrap.clearBoard,
      newFolderFromSnippetBtn: bootstrap.showInlineFolderCreation,
      newFolderFromBoardBtn: bootstrap.showInlineFolderCreation,
      newFolderFromEditSnippetBtn: () => {
        const inlineCreation = document.getElementById(
          'inlineFolderCreationEdit'
        );
        if (inlineCreation) {
          inlineCreation.style.display = 'block';
          const input = document.getElementById('newFolderNameInputEdit');
          if (input) input.focus();
        }
      },
      createInlineFolderBtn: bootstrap.createInlineFolder,
      cancelInlineFolderBtn: bootstrap.hideInlineFolderCreation,
      createInlineFolderEditBtn: async () => {
        try {
          const input = document.getElementById('newFolderNameInputEdit');
          if (!input) return;
          const folderName = input.value.trim();
          if (!folderName) {
            showToast('Please enter a folder name', 'error');
            return;
          }
          // Create the folder using the existing function but with edit modal context
          const { createInlineFolder } = await import(
            '../bootstrap/sidebar.js'
          );
          // Temporarily set the input to the edit modal's input
          const originalInput = document.getElementById('newFolderNameInput');
          const editInput = document.getElementById('newFolderNameInputEdit');
          if (originalInput && editInput) {
            originalInput.value = editInput.value;
            await createInlineFolder();
            editInput.value = originalInput.value; // Restore the value
          }
          // Update the edit snippet folder dropdown
          const folderSelect = document.getElementById(
            'editSnippetFolderSelect'
          );
          if (folderSelect && window.sidebarTree) {
            const { getAllFolders, populateFolderDropdown } = await import(
              '../bootstrap/sidebar.js'
            );
            const folders = getAllFolders(window.sidebarTree);
            populateFolderDropdown(folderSelect, folders, folderName);
          }
          // Hide the inline creation
          const inlineCreation = document.getElementById(
            'inlineFolderCreationEdit'
          );
          if (inlineCreation) {
            inlineCreation.style.display = 'none';
          }
          // Clear the input
          if (input) input.value = '';
        } catch (err) {
          showToast('Error creating folder', 'error');
          console.error('Error creating inline folder for edit:', err);
        }
      },
      cancelInlineFolderEditBtn: () => {
        const inlineCreation = document.getElementById(
          'inlineFolderCreationEdit'
        );
        if (inlineCreation) {
          inlineCreation.style.display = 'none';
        }
        const input = document.getElementById('newFolderNameInputEdit');
        if (input) input.value = '';
      },
      clearSearchBtn: bootstrap.clearSearch,
      setFolderBtn: () => {
        import('../bootstrap/ui.js')
          .then(async ui => {
            // If already monitoring, stop it; otherwise start new monitoring
            if (ui.currentMonitoredFolder) {
              await ui.stopLivePreview();
              showToast('Stopped monitoring folder', 'info');
            } else {
              ui.handleFolderSelection();
            }
          })
          .catch(error => {
            console.error('Error importing handleFolderSelection:', error);
          });
      },
      backgroundColorBtn: () => {
        import('../bootstrap/ui.js')
          .then(ui => {
            ui.openBackgroundColorPicker();
          })
          .catch(error => {
            console.error('Error importing openBackgroundColorPicker:', error);
          });
      },
      saveEditedSnippetBtn: async () => {
        try {
          const modal = document.getElementById('editSnippetModal');
          const textInput = document.getElementById('editSnippetTextInput');
          const tagsInput = document.getElementById('editSnippetTagsInput');
          if (!modal || !textInput) return;
          const originalPath = modal.dataset.snippetPath;
          const newText = textInput.value.trim();
          const newTags = tagsInput ? tagsInput.value.trim() : '';
          if (!originalPath) {
            showToast('No snippet path found for saving', 'error');
            return;
          }
          if (!newText) {
            showToast('Please enter snippet text', 'error');
            return;
          }
          // Get the snippet data from AppState
          const snippets = AppState.getSnippets();
          let snippet = snippets[originalPath];
          if (!snippet) {
            // Try with forward slashes
            const normalizedPath = originalPath.replace(/\\/g, '/');
            snippet = snippets[normalizedPath];
          }
          if (!snippet) {
            // Try to find by filename
            const filename = originalPath.split(/[\\/]/).pop();
            const matchingKey = Object.keys(snippets).find(
              key => key.endsWith(`/${filename}`) || key === filename
            );
            if (matchingKey) {
              snippet = snippets[matchingKey];
            }
          }
          if (!snippet) {
            showToast('Snippet not found in AppState', 'error');
            return;
          }
          const actualKey = Object.keys(snippets).find(
            key => snippets[key] === snippet
          );
          // Parse tags from both the tags input and embedded tags in the text
          let parsedTags = [];
          if (newTags) {
            parsedTags = newTags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag);
          }
          const tagMatch = newText.match(/Tags?:\s*([^\n]+)/i);
          if (tagMatch) {
            const embeddedTags = tagMatch[1]
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag);
            parsedTags = [...new Set([...parsedTags, ...embeddedTags])];
          }
          // Update snippet data (category remains unchanged)
          const updatedSnippet = {
            ...snippet,
            text: newText,
            tags: parsedTags,
            modified: Date.now()
          };
          snippets[actualKey] = updatedSnippet;
          // Save to disk
          if (window.electronAPI && window.electronAPI.writeFile) {
            const filePath = `snippets/${actualKey}`;
            const jsonContent = JSON.stringify(updatedSnippet, null, 2);
            await window.electronAPI.writeFile(filePath, jsonContent);
          }
          AppState.setSnippets(snippets);
          modal.style.display = 'none';
          showToast('Snippet updated', 'success');
          // Re-render both sidebar and board to reflect changes
          // Use schedulePartialSidebarUpdate to preserve folder expansion state
          const { schedulePartialSidebarUpdate } = await import('../bootstrap/sidebar.js');
          schedulePartialSidebarUpdate();
          // Re-render the board to show updated snippet text
          const { renderBoard } = await import('../bootstrap/boards.js');
          await renderBoard();
        } catch (err) {
          showToast('Error saving snippet', 'error');
          console.error('Error saving edited snippet:', err);
        }
      }
    };
    const modalHandlers = {
      createFolderConfirmBtn: bootstrap.createFolder,
      cancelFolderBtn: bootstrap.closeFolderModal,
      createSnippetConfirmBtn: bootstrap.createSnippet,
      cancelSnippetBtn: bootstrap.closeSnippetModal,
      cancelEditSnippetBtn: bootstrap.closeEditSnippetModal,
      createBoardConfirmBtn: e => {
        e.preventDefault();
        bootstrap.createNewBoard();
      },
      cancelBoardBtn: bootstrap.closeBoardModal
    };
    Object.entries(eventHandlers).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element && typeof handler === 'function') {
        element.onclick = handler;
      }
    });
    Object.entries(modalHandlers).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element && typeof handler === 'function') {
        element.onclick = handler;
      }
    });
    safeElementOperation(document.getElementById('kofiLink'), link => {
      if (link) {
        link.onclick = e => {
          e.preventDefault();
          safeElectronAPICall('openExternal', 'https://ko-fi.com/promptwaffle');
        };
      }
    });
    // Sort button click handler
    safeElementOperation(document.getElementById('sortBtn'), sortBtn => {
      if (sortBtn) {
        sortBtn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          const sortMenu = document.getElementById('sortMenu');
          if (sortMenu) {
            const isVisible = sortMenu.style.display !== 'none';
            sortMenu.style.display = isVisible ? 'none' : 'block';
            // Position the menu
            if (!isVisible) {
              const rect = sortBtn.getBoundingClientRect();
              const dropdown = sortBtn.closest('.dropdown');
              if (dropdown) {
                sortMenu.style.top = `${rect.bottom + 5}px`;
                sortMenu.style.left = `${rect.left}px`;
              }
            }
          }
        });
      }
    });
    const sortMenuLinks = document.querySelectorAll('#sortMenu a');
    sortMenuLinks.forEach(link => {
      if (link && link.dataset) {
        link.addEventListener('click', e => {
          e.preventDefault();
          const field = link.dataset.sort;
          const direction = link.dataset.direction;
          if (field && direction) {
            bootstrap.setSort(field, direction);
            // Hide the menu after selection
            const sortMenu = document.getElementById('sortMenu');
            if (sortMenu) {
              sortMenu.style.display = 'none';
            }
          }
        });
      }
    });
    document.addEventListener('click', e => {
      try {
        const sortBtn = document.getElementById('sortBtn');
        const sortMenu = document.getElementById('sortMenu');
        if (sortBtn && sortMenu) {
          const dropdown = sortBtn.closest('.dropdown');
          if (dropdown && !dropdown.contains(e.target)) {
            sortMenu.style.display = 'none';
            sortMenu.classList.remove('position-left');
            sortMenu.style.top = '';
            sortMenu.style.left = '';
          }
        }
      } catch (clickError) {
        console.warn('Error handling sort menu click:', clickError);
      }
    });
    // File input is no longer used - we use Electron API directly
    // safeElementOperation(document.getElementById('referenceImageUpload'), (input) => {
    //   if (input) {
    //     input.onchange = bootstrap.handleReferenceImageUpload;
    //   }
    // });
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    bootstrap.updateCardColorsButtonState();
    const style = document.createElement('style');
    style.textContent = `
      .drag-over-board {
        background: rgba(74, 144, 226, 0.1) !important;
        border: 2px dashed #4a90e2 !important;
        transform: scale(1.02);
        transition: all 0.2s ease;
      }
      .drag-over-folder {
        background: rgba(52, 152, 219, 0.15) !important;
        border-left: 4px solid #3498db !important;
        transform: translateX(4px);
      }
      .drag-over-delete {
        background: rgba(231, 76, 60, 0.2) !important;
        color: #e74c3c !important;
        transform: scale(1.1);
      }
      .drop-zone-hint {
        position: fixed;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        transition: opacity 0.2s ease;
      }
    `;
    document.head.appendChild(style);
    const promptBoard = document.getElementById('promptBoard');
    if (promptBoard) {
      promptBoard.ondragover = bootstrap.onBoardDragOver;
      promptBoard.ondrop = bootstrap.onBoardDrop;
      promptBoard.ondragleave = bootstrap.onBoardDragLeave;
      promptBoard.oncontextmenu = async e => {
        if (
          e.target === promptBoard ||
          e.target.classList.contains('board-placeholder')
        ) {
          try {
            const { showContextMenu } = await import('../ui/menus/context.js');
            const rect = promptBoard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            showContextMenu(e, x, y);
          } catch (error) {
            console.error('Error showing board context menu:', error);
          }
        }
      };
    }
    const deleteZone = document.getElementById('deleteDropZone');
    if (deleteZone) {
      const deleteZoneParent = deleteZone.parentElement;
      const setupDeleteZone = element => {
        element.ondragover = e => {
          e.preventDefault();
          element.classList.add('drag-over');
          deleteZone.classList.add('drag-over');
        };
        element.ondragleave = e => {
          if (!element.contains(e.relatedTarget)) {
            element.classList.remove('drag-over');
            deleteZone.classList.remove('drag-over');
          }
        };
        element.ondrop = e => {
          e.preventDefault();
          element.classList.remove('drag-over');
          deleteZone.classList.remove('drag-over');
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.type === 'snippet-drag') {
              bootstrap.deleteSnippetByPath(data.path);
            } else if (data.type === 'board-drag') {
              bootstrap.deleteBoardFileImmediate(data.board, data.path);
            }
          } catch (err) {
            console.error('Error on delete drop:', err);
          }
        };
      };
      setupDeleteZone(deleteZone);
      if (deleteZoneParent) {
        setupDeleteZone(deleteZoneParent);
      }
    }
    setupTextSelectionHandlers();
    // Setup root drop zone functionality
    const rootDropZone = document.getElementById('rootDropZone');
    if (rootDropZone) {
      rootDropZone.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        rootDropZone.classList.add('drag-over');
      });
      rootDropZone.addEventListener('dragleave', e => {
        if (!rootDropZone.contains(e.relatedTarget)) {
          rootDropZone.classList.remove('drag-over');
        }
      });
      rootDropZone.addEventListener('drop', async e => {
        e.preventDefault();
        e.stopPropagation();
        rootDropZone.classList.remove('drag-over');
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (!data) {
            console.warn('Invalid drag data received');
            return;
          }
          if (data.type === 'snippet-drag') {
            await bootstrap.handleSnippetDrop(data, ''); // Empty string means root level
          } else if (data.type === 'board-drag') {
            await bootstrap.handleBoardDrop(data, ''); // Empty string means root level
          } else if (data.type === 'folder-drag') {
            if (typeof bootstrap.handleFolderDrop === 'function') {
              await bootstrap.handleFolderDrop(data.path, ''); // Empty string means root level
            }
          }
        } catch (error) {
          console.error('Error handling root drop event:', error);
          bootstrap.showToast('Error processing drop operation', 'error');
        }
      });
    }
    safeElementOperation(document.getElementById('tagSearchInput'), input => {
      if (input) {
        input.addEventListener('input', e => {
          bootstrap.handleSearch(e);
          updateClearButtonVisibility();
        });
      }
    });
    // Add clear search button functionality
    safeElementOperation(
      document.getElementById('clearSearchBtn'),
      clearBtn => {
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('tagSearchInput');
            if (searchInput) {
              searchInput.value = '';
              AppState.setCurrentSearchTerm('');
              // Preserve the current expanded state of folders
              const currentState = getSidebarState();
              // Re-render the sidebar to show all items
              const foldersContainer =
                document.getElementById('foldersContainer');
              if (foldersContainer && window.sidebarTree) {
                renderSidebar(window.sidebarTree, foldersContainer);
                // Restore the expanded state
                applySidebarState(currentState);
              }
              // Hide the clear button after clearing
              updateClearButtonVisibility();
            }
          });
        }
      }
    );
    // Initialize clear button visibility
    updateClearButtonVisibility();
  } catch (error) {
    console.error('Fatal error during event listener setup:', error);
  }
}
