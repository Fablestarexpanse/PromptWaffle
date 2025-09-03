import { AppState, UI_CONSTANTS } from '../state/appState.js';
import {
  safeElementOperation,
  safeElectronAPICall,
  replaceFeatherIcons,
  escapeHtml
} from '../utils/index.js';
import { showToast } from '../utils/index.js';
import { saveBoards, triggerAutosave } from './state.js';
import {
  schedulePartialSidebarUpdate,
  renderBoardImages,
  filterByTag,
  refreshUI
} from './index.js';
import { createDragImage } from '../ui/dnd.js';
import { showColorPicker } from '../ui/menus/color.js';
let activeCard = null;
let offsetX, offsetY;
let lastCompiledUpdate = 0;
const COMPILED_UPDATE_THROTTLE = 100; // Update compiled prompt at most every 100ms
function startDrag(e, cardId) {
  e.preventDefault();
  const board = document.getElementById('promptBoard');
  const cardElement = document.getElementById(cardId);
  if (!cardElement || !board) {
    console.error('Card element or board not found for cardId:', cardId);
    return;
  }
  activeCard = {
    id: cardId,
    element: cardElement,
    isLocked: cardElement.classList.contains('locked')
  };
  if (activeCard.isLocked) {
    activeCard = null;
    return;
  }
  const boardRect = board.getBoundingClientRect();
  const cardRect = cardElement.getBoundingClientRect();
  offsetX = e.clientX - cardRect.left;
  offsetY = e.clientY - cardRect.top;
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}
function drag(e) {
  if (!activeCard) return;
  const board = document.getElementById('promptBoard');
  const boardRect = board.getBoundingClientRect();
  let x = e.clientX - boardRect.left - offsetX;
  let y = e.clientY - boardRect.top - offsetY;
  // Constrain to board boundaries
  x = Math.max(
    0,
    Math.min(x, boardRect.width - activeCard.element.offsetWidth)
  );
  y = Math.max(
    0,
    Math.min(y, boardRect.height - activeCard.element.offsetHeight)
  );
  activeCard.element.style.left = `${x}px`;
  activeCard.element.style.top = `${y}px`;
  // Update the card's position in the data model for real-time compiled prompt updates
  const currentBoard = getActiveBoard();
  if (currentBoard) {
    const card = currentBoard.cards.find(c => c.id === activeCard.id);
    if (card) {
      card.x = x;
      card.y = y;
      // Update compiled prompt in real-time with throttling
      const now = Date.now();
      if (now - lastCompiledUpdate > COMPILED_UPDATE_THROTTLE) {
        updateCompiledPrompt();
        lastCompiledUpdate = now;
      }
    }
  }
}
async function stopDrag() {
  if (!activeCard) return;
  const currentBoard = getActiveBoard();
  if (currentBoard) {
    const card = currentBoard.cards.find(c => c.id === activeCard.id);
    if (card) {
      // Position is already updated during drag, just save it
      // Ensure compiled prompt is updated with final position
      updateCompiledPrompt();
      await saveBoards();
      triggerAutosave();
    }
  }
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
  activeCard = null;
}
let resizeData = null;
function startResize(e, cardId) {
  e.preventDefault();
  e.stopPropagation();
  const cardElement = document.getElementById(cardId);
  if (!cardElement) return;
  resizeData = {
    id: cardId,
    element: cardElement,
    originalWidth: cardElement.offsetWidth,
    originalHeight: cardElement.offsetHeight,
    originalMouseX: e.clientX,
    originalMouseY: e.clientY
  };
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
}
function resize(e) {
  if (!resizeData) return;
  const width =
    resizeData.originalWidth + (e.clientX - resizeData.originalMouseX);
  const height =
    resizeData.originalHeight + (e.clientY - resizeData.originalMouseY);
  resizeData.element.style.width = `${Math.max(100, width)}px`;
  resizeData.element.style.height = `${Math.max(50, height)}px`;
}
async function stopResize() {
  if (!resizeData) return;
  const currentBoard = getActiveBoard();
  if (currentBoard) {
    const card = currentBoard.cards.find(c => c.id === resizeData.id);
    if (card) {
      card.width = parseInt(resizeData.element.style.width, 10);
      card.height = parseInt(resizeData.element.style.height, 10);
      await saveBoards();
      triggerAutosave();
    }
  }
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
  resizeData = null;
}
const compiledCache = new Map();
function generateCacheKey(board, showColors) {
  const cardData = board.cards.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    color: c.color,
    snippetPath: c.snippetPath,
    customText: c.customText
  }));
  return `${board.id}-${showColors}-${JSON.stringify(cardData)}`;
}
function generateCompiledPrompt(activeBoard) {
  const sortedCards = activeBoard.cards.slice().sort((a, b) => {
    const yDifference = a.y - b.y;
    if (Math.abs(yDifference) < 30) {
      return a.x - b.x;
    }
    return yDifference;
  });
  const snippets = AppState.getSnippets();
  const showCompiledColors = AppState.getShowCompiledColors();
  const compiledHtml = sortedCards
    .map(card => {
      const snippet = snippets[card.snippetPath];
      if (!snippet) return '';
      const text = card.customText || snippet.text || '';
      if (!text) return '';
      const escapedText = escapeHtml(text);
      const style = showCompiledColors
        ? `style="background-color: ${card.color || '#40444b'}; color: white; text-shadow: 0 0 5px rgba(0,0,0,0.4);"`
        : '';
      return `<span ${style}>${escapedText}</span>`;
    })
    .filter(Boolean)
    .join(',');
  return compiledHtml;
}
export function updateCompiledPrompt() {
  const container = document.getElementById('compiledPrompt');
  if (!container) return;
  const activeBoard = getActiveBoard();
  if (!activeBoard || !activeBoard.cards) {
    container.innerHTML = '';
    return;
  }
  const showCompiledColors = AppState.getShowCompiledColors();
  const cacheKey = generateCacheKey(activeBoard, showCompiledColors);
  if (compiledCache.has(cacheKey)) {
    container.innerHTML = compiledCache.get(cacheKey);
    return;
  }
  const compiledHtml = generateCompiledPrompt(activeBoard);
  if (compiledCache.size > 50) {
    const oldestKey = compiledCache.keys().next().value;
    compiledCache.delete(oldestKey);
  }
  compiledCache.set(cacheKey, compiledHtml);
  container.innerHTML = compiledHtml;
}
export function renderBoardSelector() {
  const selectorContainer = document.querySelector(
    '.board-header .header-left'
  );
  if (!selectorContainer) return;
  // Remove existing selector if it exists
  const existingSelector = document.getElementById('boardSelector');
  if (existingSelector) {
    existingSelector.remove();
  }
  const boards = AppState.getBoards();
  const activeBoardId = AppState.getActiveBoardId();
  const selector = document.createElement('select');
  selector.id = 'boardSelector';
  selector.className = 'board-selector';
  boards.forEach(board => {
    const option = document.createElement('option');
    option.value = board.id;
    option.textContent = board.name;
    if (board.id === activeBoardId) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
  selector.addEventListener('change', async e => {
    const newBoardId = e.target.value;
    await setCurrentBoard(newBoardId);
    await renderBoard();
  });
  selectorContainer.insertBefore(selector, selectorContainer.firstChild);
}

export function populateBoardSelectDropdown() {
  const boardSelect = document.getElementById('boardSelect');
  if (!boardSelect) return;
  
  // Clear existing options except the first placeholder
  while (boardSelect.children.length > 1) {
    boardSelect.removeChild(boardSelect.lastChild);
  }
  
  const boards = AppState.getBoards();
  const activeBoardId = AppState.getActiveBoardId();
  
  boards.forEach(board => {
    if (board && board.id !== activeBoardId) { // Don't show current board
      const option = document.createElement('option');
      option.value = board.id;
      option.textContent = board.name;
      boardSelect.appendChild(option);
    }
  });
}
export function updateBoardTagsDisplay() {
  const tagsContainer = document.getElementById('boardTagsDisplay');
  if (!tagsContainer) return;
  const activeBoard = getActiveBoard();
  tagsContainer.innerHTML = '';
  if (activeBoard && activeBoard.tags && activeBoard.tags.length > 0) {
    activeBoard.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'board-tag';
      tagElement.textContent = tag;
      tagElement.onclick = () => filterByTag(tag);
      tagsContainer.appendChild(tagElement);
    });
  }
}
export async function openNewBoardModal(parentId = null) {
  try {
    const modal = document.getElementById('boardModal');
    if (!modal) {
      console.error('Board modal not found');
      return;
    }
    const title = document.getElementById('boardModalTitle');
    if (title) {
      title.textContent = 'Create Board';
    }
    const nameInput = document.getElementById('boardNameInput');
    if (nameInput) {
      nameInput.value = '';
    }
    const tagsInput = document.getElementById('boardTagsInput');
    if (tagsInput) {
      tagsInput.value = '';
    }
    const createBtn = document.getElementById('createBoardConfirmBtn');
    if (createBtn) {
      createBtn.textContent = 'Create';
    }
    // Populate folder dropdown
    const folderSelect = document.getElementById('boardFolderSelect');
    if (folderSelect && window.sidebarTree) {
      // Import the functions we need
      const { getAllFolders, populateFolderDropdown } = await import(
        './sidebar.js'
      );
      const folders = getAllFolders(window.sidebarTree);
      populateFolderDropdown(folderSelect, folders, parentId || '');
    }
    // Store parent ID for board creation
    if (parentId && typeof parentId === 'string') {
      modal.dataset.parentId = parentId;
    } else {
      delete modal.dataset.parentId;
    }
    // Reset modal state
    modal.dataset.editMode = 'false';
    delete modal.dataset.editBoardId;
    modal.style.display = 'flex';
    // Focus name input safely
    if (nameInput) {
      nameInput.focus();
    }
    // Ensure feather icons are rendered
    try {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (iconError) {
      console.warn('Error replacing feather icons:', iconError);
    }
  } catch (error) {
    console.error('Error opening new board modal:', error);
  }
}
export function closeBoardModal() {
  try {
    const modal = safeElementOperation(
      document.getElementById('boardModal'),
      modalEl => {
        if (modalEl) {
          modalEl.style.display = 'none';
        }
      }
    );
    // Clear form safely
    safeElementOperation(document.getElementById('boardNameInput'), inputEl => {
      if (inputEl) {
        inputEl.value = '';
      }
    });
    safeElementOperation(document.getElementById('boardTagsInput'), tagsEl => {
      if (tagsEl) {
        tagsEl.value = '';
      }
    });
    safeElementOperation(
      document.getElementById('boardFolderSelect'),
      folderEl => {
        if (folderEl) {
          folderEl.innerHTML = '';
        }
      }
    );
    // Clear edit mode data safely
    safeElementOperation(document.getElementById('boardModal'), modalEl => {
      if (modalEl) {
        delete modalEl.dataset.editMode;
        delete modalEl.dataset.editBoardId;
        delete modalEl.dataset.folderPath;
        delete modalEl.dataset.parentId;
      }
    });
    // Reset modal title and button safely
    safeElementOperation(
      document.getElementById('boardModalTitle'),
      titleEl => {
        if (titleEl) {
          titleEl.textContent = 'Create Board';
        }
      }
    );
    safeElementOperation(
      document.getElementById('createBoardConfirmBtn'),
      btnEl => {
        if (btnEl) {
          btnEl.textContent = 'Create';
        }
      }
    );
  } catch (error) {
    console.error('Error closing board modal:', error);
  }
}
export async function createNewBoard() {
  try {
    const modal = document.getElementById('boardModal');
    if (!modal) {
      console.error('Board modal not found');
      return;
    }
    const nameInput = document.getElementById('boardNameInput');
    if (!nameInput) {
      console.error('Board name input not found');
      return;
    }
    const tagsInput = document.getElementById('boardTagsInput');
    if (!tagsInput) {
      console.error('Board tags input not found');
      return;
    }
    const folderSelect = document.getElementById('boardFolderSelect');
    if (!folderSelect) {
      console.error('Board folder select not found');
      return;
    }
    const boardName = String(nameInput.value || '').trim();
    const tagsText = String(tagsInput.value || '').trim();
    const selectedFolder = String(folderSelect.value || '').trim();
    // Validate board name
    if (!boardName) {
      showToast('Please enter a board name', 'error');
      return;
    }
    if (boardName.length > 100) {
      showToast('Board name is too long (max 100 characters)', 'error');
      return;
    }
    // Parse tags (split by comma and clean up)
    const tags = tagsText
      ? tagsText
          .split(',')
          .map(tag => String(tag).trim())
          .filter(tag => tag.length > 0 && tag.length <= 50)
      : [];
    // Validate tags
    if (tags.length > 20) {
      showToast('Too many tags (max 20)', 'error');
      return;
    }
    if (modal.dataset.editMode === 'file') {
      // This part should be moved to a different function
    } else {
      // Create new board
      try {
        const newBoard = {
          id: `board-${Date.now()}`,
          name: boardName,
          tags,
          cards: [],
          groups: [],
          images: [],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        };
        // Validate board object
        if (!newBoard.id || !newBoard.name) {
          console.error('Invalid board object created:', newBoard);
          showToast('Error: Failed to create board data', 'error');
          return;
        }
        // Generate safe filename
        const safeName = boardName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeName}_${Date.now()}.json`;
        // Determine file path based on selected folder
        let filePath = fileName;
        if (selectedFolder) {
          filePath = `${selectedFolder}/${fileName}`;
        } else if (modal.dataset.folderPath) {
          filePath = `${modal.dataset.folderPath}/${fileName}`;
        } else if (modal.dataset.parentId) {
          filePath = `${modal.dataset.parentId}/${fileName}`;
        }
        const boardData = JSON.stringify(newBoard, null, 2);
        if (!boardData) {
          console.error('Failed to serialize new board data');
          showToast('Error: Failed to prepare board data', 'error');
          return;
        }
        await safeElectronAPICall(
          'writeFile',
          `snippets/${filePath}`,
          boardData
        );
        // Add filePath to the board object
        newBoard.filePath = filePath;
        // Add to boards array
        const boards = AppState.getBoards();
        boards.push(newBoard);
        AppState.setBoards(boards);
        closeBoardModal();
        // Refresh the UI to show the new board
        try {
          await refreshUI();
        } catch (refreshError) {
          console.error(
            'Error refreshing UI after board creation:',
            refreshError
          );
          // Fallback: just render the board selector and current board
          try {
            renderBoardSelector();
            await renderBoard();
            updateBoardTagsDisplay();
          } catch (fallbackError) {
            console.error('Error in fallback UI refresh:', fallbackError);
          }
        }
        showToast(`Created new board: "${boardName}"`, 'success');
      } catch (createError) {
        console.error('Error creating new board:', createError);
        showToast('Error creating new board', 'error');
      }
    }
  } catch (error) {
    console.error('Error in createNewBoard:', error);
    showToast('Error creating board', 'error');
  }
}
export function getActiveBoard() {
  try {
    let currentBoard = AppState.getCurrentBoard();
    const boards = AppState.getBoards();
    if (!currentBoard && boards.length > 0) {
      currentBoard = boards[0];
      AppState.setCurrentBoard(currentBoard);
    }
    return currentBoard;
  } catch (error) {
    console.error('Error getting active board:', error);
    return null;
  }
}
export function updateCurrentBoardInfo() {
  const infoDiv = document.getElementById('currentBoardInfo');
  if (!infoDiv) return;
  const board = AppState.getCurrentBoard();
  if (!board) {
    infoDiv.innerHTML = '';
    return;
  }
  let html =
    '<span class="current-board-label">Current Board:</span> <span class="current-board-icon"><i data-feather="layout"></i></span>';
  if (board.tags && board.tags.length > 0) {
    html += ` <span class="current-board-tags">${board.tags.map(tag => `<span class=\"board-tag\">${tag}</span>`).join('')}</span>`;
  }
  html += ` <span class="current-board-name">${board.name || 'Untitled'}</span>`;
  infoDiv.innerHTML = html;
  if (window.feather) window.feather.replace();
}
export async function setCurrentBoard(boardId) {
  try {
    if (!boardId || typeof boardId !== 'string') {
      console.error('Invalid boardId provided to setCurrentBoard:', boardId);
      return;
    }
    const boards = AppState.getBoards();
    const board = boards.find(b => b && b.id === boardId);
    if (!board) {
      console.warn('Board not found, falling back to first board:', boardId);
      if (boards.length > 0) {
        AppState.setCurrentBoard(boards[0]);
      } else {
        console.error('No boards available');
        return;
      }
    } else {
      AppState.setCurrentBoard(board);
    }
    // Update the active board ID in AppState
    AppState.setActiveBoardId(boardId);
    // Save to localStorage safely
    try {
      localStorage.setItem(
        'currentBoardId',
        AppState.getCurrentBoard()?.id || ''
      );
    } catch (storageError) {
      console.warn('Error saving current board to localStorage:', storageError);
    }
    // Render UI components
    try {
      renderBoard();
    } catch (renderError) {
      console.error('Error rendering board:', renderError);
    }
    try {
      renderBoardSelector();
    } catch (selectorError) {
      console.error('Error rendering board selector:', selectorError);
    }
    try {
      updateBoardTagsDisplay();
    } catch (tagsError) {
      console.error('Error updating board tags display:', tagsError);
    }
    // Update sidebar to reflect the new active board
    try {
      const { schedulePartialSidebarUpdate } = await import('./sidebar.js');
      schedulePartialSidebarUpdate(boardId);
    } catch (sidebarError) {
      console.error('Error updating sidebar:', sidebarError);
    }
    
    // Update metadata panel for new board
    try {
      const { metadataPanel } = await import('../utils/metadata-panel.js');
      metadataPanel.onBoardChange(boardId);
    } catch (metadataError) {
      console.error('Error updating metadata panel:', metadataError);
    }
  } catch (error) {
    console.error('Error setting current board:', error);
  }
}
export function cleanupOrphanedCards() {
  try {
    let totalCleaned = 0;
    const currentBoards = AppState.getBoards();
    const currentSnippets = AppState.getSnippets();
    for (const board of currentBoards) {
      if (!board || !Array.isArray(board.cards)) {
        console.warn('Invalid board found during cleanup:', board);
        continue;
      }
      const originalLength = board.cards.length;
      const validCards = board.cards.filter(card => {
        if (!card || !card.snippetPath) {
          return false;
        }
        const snippet = currentSnippets[card.snippetPath];
        if (!snippet) {
          return false;
        }
        return true;
      });
      if (validCards.length !== board.cards.length) {
        board.cards = validCards;
        totalCleaned += originalLength - validCards.length;
      }
    }
    if (totalCleaned > 0) {
      try {
        saveBoards();
        renderBoard(); // Re-render to update the display
        showToast(
          `Cleaned up ${totalCleaned} orphaned card${totalCleaned > 1 ? 's' : ''}`,
          'info'
        );
      } catch (error) {
        console.error('Error saving boards after cleanup:', error);
        showToast('Error saving cleanup results', 'error');
      }
    }
    return totalCleaned;
  } catch (error) {
    console.error('Error during orphaned cards cleanup:', error);
    showToast('Error cleaning up orphaned cards', 'error');
    return 0;
  }
}
export async function addCardToBoard(snippetPath, x, y) {
  try {
    if (!snippetPath) {
      console.error('No snippet path provided to addCardToBoard');
      return;
    }
    const board = getActiveBoard();
    if (!board) {
      console.error('No active board found');
      return;
    }
    const snippets = AppState.getSnippets();
    const snippet = snippets[snippetPath];
    if (!snippet) {
      console.error('Snippet not found for path:', snippetPath);
      showToast('Snippet not found', 'error');
      return;
    }
    // Validate coordinates
    const cardX = typeof x === 'number' && !isNaN(x) ? x : 50;
    const cardY = typeof y === 'number' && !isNaN(y) ? y : 50;
    // Find the next available color from the palette
    const usedColors = new Set();
    if (board.cards && Array.isArray(board.cards)) {
      board.cards.forEach(card => {
        if (card && card.color) {
          usedColors.add(card.color);
        }
      });
    }
    let nextColor = UI_CONSTANTS.CARD_COLOR_PALETTE[0];
    for (const color of UI_CONSTANTS.CARD_COLOR_PALETTE) {
      if (!usedColors.has(color)) {
        nextColor = color;
        break;
      }
    }
    // If all colors are used, cycle through them
    if (usedColors.size >= UI_CONSTANTS.CARD_COLOR_PALETTE.length) {
      nextColor =
        UI_CONSTANTS.CARD_COLOR_PALETTE[
          board.cards.length % UI_CONSTANTS.CARD_COLOR_PALETTE.length
        ];
    }
    const card = {
      id: `card-${Date.now()}`,
      snippetPath,
      x: cardX,
      y: cardY,
      width: UI_CONSTANTS.DEFAULT_CARD_WIDTH,
      height: UI_CONSTANTS.DEFAULT_CARD_HEIGHT,
      locked: false,
      color: nextColor
    };
    if (!board.cards) {
      board.cards = [];
    }
    board.cards.push(card);
    await saveBoards();
    triggerAutosave(); // Add autosave trigger
    renderBoard();
    // Schedule partial sidebar update for better performance
    schedulePartialSidebarUpdate(board.id);
    showToast('Card added to board successfully', 'success');
  } catch (error) {
    console.error('Error adding card to board:', error);
    showToast('Error adding card to board', 'error');
  }
}
export async function removeCardFromBoard(cardId) {
  try {
    if (!cardId) {
      console.error('No card ID provided to removeCardFromBoard');
      return;
    }
    const board = getActiveBoard();
    if (!board) {
      console.error('No active board found');
      return;
    }
    // Check if card is locked
    const card = board.cards
      ? board.cards.find(c => c && c.id === cardId)
      : null;
    if (card && card.locked) {
      showToast('Cannot remove locked card. Unlock it first.', 'warning');
      return;
    }
    if (!board.cards) {
      console.error('Board has no cards array');
      return;
    }
    const originalLength = board.cards.length;
    board.cards = board.cards.filter(c => c && c.id !== cardId);
    if (board.cards.length === originalLength) {
      console.warn('Card not found for removal:', cardId);
      return;
    }
    await saveBoards();
    triggerAutosave(); // Add autosave trigger
    renderBoard();
    // Schedule partial sidebar update for better performance
    schedulePartialSidebarUpdate(board.id);
    showToast('Card removed from board', 'success');
  } catch (error) {
    console.error('Error removing card from board:', error);
    showToast('Error removing card from board', 'error');
  }
}
export async function clearBoard() {
  try {
    const board = getActiveBoard();
    if (!board) {
      console.error('No active board found');
      showToast('No active board found', 'error');
      return;
    }
    // Check if any cards are locked
    const lockedCards = board.cards
      ? board.cards.filter(card => card && card.locked)
      : [];
    if (lockedCards.length > 0) {
      showToast(
        `Cannot clear board: ${lockedCards.length} card(s) are locked. Unlock them first.`,
        'warning'
      );
      return;
    }
    const cardCount = board.cards ? board.cards.length : 0;
    // Show confirmation dialog
    const confirmed = await showClearBoardConfirmation(board.name, cardCount);
    if (!confirmed) {
      return;
    }
    // Clear all cards from the board
    board.cards = [];
    // Save the changes
    await saveBoards();
    triggerAutosave();
    // Re-render the board
    renderBoard();
    // Schedule partial sidebar update for better performance
    schedulePartialSidebarUpdate(board.id);
    showToast(`Cleared ${cardCount} card(s) from board`, 'success');
  } catch (error) {
    console.error('Error clearing board:', error);
    showToast('Error clearing board', 'error');
  }
}
function showClearBoardConfirmation(boardName, cardCount) {
  return new Promise(resolve => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '10000';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.background = '#2f3136';
    modalContent.style.border = '1px solid #40444b';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '24px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';
    modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Clear Board';
    title.style.margin = '0 0 16px 0';
    title.style.color = '#ffffff';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';
    // Create message
    const message = document.createElement('p');
    message.textContent = `Are you sure you want to clear "${boardName}"? This will remove all ${cardCount} card(s) from the board. This action cannot be undone.`;
    message.style.margin = '0 0 24px 0';
    message.style.color = '#dcddde';
    message.style.lineHeight = '1.5';
    message.style.fontSize = '14px';
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '12px';
    buttonContainer.style.justifyContent = 'flex-end';
    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.background = '#40444b';
    cancelBtn.style.border = '1px solid #4f545c';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.color = '#dcddde';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.fontSize = '14px';
    cancelBtn.onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };
    // Create confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Clear Board';
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.style.background = '#da373c';
    confirmBtn.style.border = '1px solid #da373c';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.color = '#ffffff';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.fontSize = '14px';
          confirmBtn.style.fontWeight = '500';
    confirmBtn.onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };
    // Add hover effects
    cancelBtn.onmouseenter = () => {
      cancelBtn.style.background = '#4f545c';
    };
    cancelBtn.onmouseleave = () => {
      cancelBtn.style.background = '#40444b';
    };
    confirmBtn.onmouseenter = () => {
      confirmBtn.style.background = '#b91c1c';
    };
    confirmBtn.onmouseleave = () => {
      confirmBtn.style.background = '#da373c';
    };
    // Assemble modal
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    // Add to DOM
    document.body.appendChild(modal);
    // Handle escape key
    const handleEscape = e => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    // Handle clicking outside modal
    modal.onclick = e => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
        resolve(false);
      }
    };
    // Focus the cancel button for accessibility
    setTimeout(() => cancelBtn.focus(), 100);
  });
}
export async function toggleCardLock(cardId) {
  try {
    if (!cardId) {
      console.error('No card ID provided to toggleCardLock');
      return;
    }
    const board = getActiveBoard();
    if (!board) {
      console.error('No active board found');
      return;
    }
    if (!board.cards) {
      console.error('Board has no cards array');
      return;
    }
    const card = board.cards.find(c => c && c.id === cardId);
    if (!card) {
      console.error('Card not found:', cardId);
      return;
    }
    card.locked = !card.locked;
    await saveBoards();
    triggerAutosave(); // Add autosave trigger
    renderBoard();
    showToast(`Card ${card.locked ? 'locked' : 'unlocked'}`, 'success');
  } catch (error) {
    console.error('Error toggling card lock:', error);
    showToast('Error toggling card lock', 'error');
  }
}
export async function renderBoard() {
  try {
    const boardContainer = document.getElementById('promptBoard');
    if (!boardContainer) return;
    const activeBoard = getActiveBoard();
    // Clear existing cards but not the placeholder
    boardContainer.querySelectorAll('.board-card').forEach(card => card.remove());
    // Show/hide placeholder
    const placeholder = boardContainer.querySelector('.board-placeholder');
    if (placeholder) {
      placeholder.style.display =
        !activeBoard || !activeBoard.cards.length ? 'block' : 'none';
    }
    // Render cards
    if (activeBoard && activeBoard.cards) {
    // Only render cards that have valid snippets, but don't remove them from the board
    // This prevents temporary cache misses from removing cards permanently
    const snippets = AppState.getSnippets();
    const renderableCards = activeBoard.cards.filter(card => {
      const snippet = snippets[card.snippetPath];
      if (!snippet) {
        console.warn(
          `Skipping render for card with missing snippet: ${card.snippetPath} (card not removed from board)`
        );
        console.warn(
          'Available snippet paths in cache:',
          Object.keys(snippets)
        );
        return false;
      }
      return true;
    });
    renderableCards.forEach(card => {
      const snippet = snippets[card.snippetPath];
      
      // Skip cards with missing snippets
      if (!snippet) {
        console.warn(`Snippet not found for card ${card.id} at path: ${card.snippetPath}`);
        return;
      }
      
      // Create card element
      const cardDiv = document.createElement('div');
      cardDiv.id = card.id;
      cardDiv.className = 'board-card';
      if (card.locked) cardDiv.classList.add('locked');
      cardDiv.style.left = `${card.x || 50}px`;
      cardDiv.style.top = `${card.y || 50}px`;
      cardDiv.style.width = `${card.width || 220}px`;
      cardDiv.style.height = `${card.height || 120}px`;
      const showCardColors = AppState.getShowCardColors();
      cardDiv.style.backgroundColor = showCardColors
        ? card.color || '#40444b'
        : '#36393f';
      // Add min-width class if card is at minimum width
      if ((card.width || 220) <= 220) {
        cardDiv.classList.add('min-width');
      }
      // Card header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.title = 'Drag to move card';
      if (snippet.tags && Array.isArray(snippet.tags) && snippet.tags.length > 0) {
        // Create individual tag elements
        snippet.tags.forEach((tag, index) => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'tag-item';
          tagSpan.textContent = tag;
          tagSpan.title = `Click to filter by tag: ${tag}`;
          // Add click handler to filter by this tag
          tagSpan.addEventListener('click', e => {
            e.stopPropagation(); // Prevent card dragging
            e.preventDefault(); // Prevent any default behavior
            filterByTag(tag);
          });
          // Prevent drag events on tags
          tagSpan.addEventListener('mousedown', e => {
            e.stopPropagation();
            e.preventDefault();
          });
          // Ensure tags are clickable and not draggable
          tagSpan.style.pointerEvents = 'auto';
          tagSpan.style.zIndex = '10';
          tagSpan.draggable = false;
          header.appendChild(tagSpan);
          // Add comma separator if not the last tag
          if (index < snippet.tags.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'tag-separator';
            separator.textContent = ', ';
            header.appendChild(separator);
          }
        });
      } else {
        header.textContent = 'Snippet';
      }
      // Card content
      const content = document.createElement('div');
      content.className = 'card-content';
      content.title = 'Right-click to edit snippet or select text to split';
      const displayText =
        card.customText || (snippet.text || 'No text available');
      // Create a text node to ensure proper text selection
      content.textContent = displayText;
      content.style.userSelect = 'text';
      content.style.webkitUserSelect = 'text';
      content.style.mozUserSelect = 'text';
      content.style.msUserSelect = 'text';
      content.style.cursor = 'text';
      content.style.pointerEvents = 'auto';
      content.style.whiteSpace = 'pre-wrap';
      content.style.wordWrap = 'break-word';
      content.setAttribute('data-text', displayText);
      content.setAttribute('contenteditable', 'false');
      content.setAttribute('spellcheck', 'false');
      // Card actions
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      // Color button
      const colorBtn = document.createElement('button');
      colorBtn.innerHTML = '<i data-feather="droplet"></i>';
      colorBtn.title = card.locked
        ? 'Cannot change color - card is locked'
        : 'Open color picker';
      colorBtn.onclick = e => {
        e.stopPropagation();
        // Prevent color change if card is locked
        if (card.locked) {
          showToast('Cannot change color - card is locked', 'warning');
          return;
        }
        // Open color picker with current card color
        const currentColor = card.color || '#40444b';
        showColorPicker(card.id, currentColor, changeCardColor);
      };
      // Lock button
      const lockBtn = document.createElement('button');
      lockBtn.innerHTML = card.locked
        ? '<i data-feather="lock"></i>'
        : '<i data-feather="unlock"></i>';
      lockBtn.title = card.locked
        ? 'Unlock card (allow moving and resizing)'
        : 'Lock card (prevent moving and resizing)';
      lockBtn.onclick = e => {
        e.stopPropagation();
        toggleCardLock(card.id);
      };
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '<i data-feather="trash-2"></i>';
      deleteBtn.title = 'Remove card from board';
      deleteBtn.onclick = e => {
        e.stopPropagation();
        removeCardFromBoard(card.id);
      };
      actions.appendChild(colorBtn);
      actions.appendChild(lockBtn);
      actions.appendChild(deleteBtn);
      // Resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      resizeHandle.title = 'Drag to resize card';
      resizeHandle.onmousedown = e => startResize(e, card.id);
      // Assemble card
      cardDiv.appendChild(header);
      cardDiv.appendChild(content);
      cardDiv.appendChild(actions);
      cardDiv.appendChild(resizeHandle);
      // Enable card dragging between boards - only from header
      cardDiv.draggable = false; // Disable dragging from the entire card
      header.draggable = true; // Enable dragging only from header
      // Handle HTML5 drag and drop for moving cards between boards
      let currentDragImage = null;
      header.addEventListener('dragstart', e => {
        // Check if the drag is starting from a tag element
        if (e.target.classList.contains('tag-item')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (card.locked) {
          e.preventDefault();
          return;
        }
        // Only allow HTML5 drag for cross-board movement
        // For same-board movement, we'll use mouse-based dragging
        // Create drag data for card transfer
        const dragData = {
          type: 'card-drag',
          cardId: card.id,
          sourceBoard: activeBoard.id,
          snippetPath: card.snippetPath,
          cardData: {
            width: card.width,
            height: card.height,
            color: card.color
          }
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        // Create drag image for card
        try {
          const dragImageData = createDragImage(
            (snippet && snippet.text) || 'Card',
            'snippet'
          );
          if (dragImageData && dragImageData.element) {
            e.dataTransfer.setDragImage(dragImageData.element, 10, 10);
            currentDragImage = dragImageData;
          }
        } catch (error) {
          console.error('Error creating drag image:', error);
        }
        // Add visual feedback
        cardDiv.style.opacity = '0.5';
        setTimeout(() => {
          if (cardDiv.style.opacity === '0.5') {
            cardDiv.style.opacity = '1';
          }
        }, 100);
      });
      header.addEventListener('dragend', () => {
        cardDiv.style.opacity = '1';
        // Clean up drag image
        if (currentDragImage && currentDragImage.cleanup) {
          currentDragImage.cleanup();
          currentDragImage = null;
        }
      });
      // Enable mouse-based dragging for moving cards within the same board
      header.onmousedown = e => {
        // Check if the click is on a tag element
        if (e.target.classList.contains('tag-item')) {
          e.stopPropagation();
          e.preventDefault();
          return; // Don't start drag if clicking on a tag
        }
        e.preventDefault(); // Prevent text selection on header
        startDrag(e, card.id);
      };
      // Allow text selection on content area
      content.onmousedown = e => {
        e.stopPropagation(); // Stop event from bubbling to parent
        // Don't prevent default - allow text selection
      };
      // Add mouseup event to help with text selection
      content.onmouseup = e => {
        // Small delay to ensure selection is complete
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim()) {
          }
        }, 10);
      };
      content.onclick = e => {
        // Allow text selection and editing
      };
      // Prevent drag events on content area
      content.ondragstart = e => {
        e.preventDefault();
        e.stopPropagation();
      };
      // Add click event for the color swatch
      const colorSwatch = cardDiv.querySelector('.card-color-swatch');
      if (colorSwatch) {
        colorSwatch.onclick = () => {
          showColorPicker(card.id, card.color || '#40444b', changeCardColor);
        };
      }
      // Add context menu for right-click on the card
      cardDiv.oncontextmenu = async e => {
        const { showCardContextMenu } = await import('../ui/menus/context.js');
        showCardContextMenu(e, card.id, card.snippetPath);
      };
      boardContainer.appendChild(cardDiv);
    });
    // Only replace icons in the board container for better performance
    replaceFeatherIcons(boardContainer);
  }
  updateCompiledPrompt();
  await renderBoardImages();
  
  // Populate the board select dropdown
  populateBoardSelectDropdown();
  } catch (error) {
    console.error('Error rendering board:', error);
    showToast('Error rendering board', 'error');
  }
}
/**
 * Handle drag over events on the board
 * @param {DragEvent} e - The drag over event
 */
export function onBoardDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  const board = e.currentTarget;
  if (board) {
    board.classList.add('drag-over-board');
  }
}
/**
 * Handle drag leave events on the board
 * @param {DragEvent} e - The drag leave event
 */
export function onBoardDragLeave(e) {
  const board = e.currentTarget;
  if (board && !board.contains(e.relatedTarget)) {
    board.classList.remove('drag-over-board');
  }
}
/**
 * Handle drop events on the board
 * @param {DragEvent} e - The drop event
 */
export async function onBoardDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const board = e.currentTarget;
  if (board) {
    board.classList.remove('drag-over-board');
  }
  try {
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!data) {
      console.warn('No drag data received');
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    if (data.type === 'snippet-drag') {
      // Handle snippet drop from sidebar
      // Normalize the path to match the snippet cache format
      const normalizedPath = data.path.replace(/\\/g, '/');
      await addCardToBoard(normalizedPath, x, y);
    } else if (data.type === 'card-drag') {
      // Handle card drop from another board
      await handleCardDrop(data, x, y);
    } else if (data.type === 'board-drag') {
      // Save the current active board before switching
      window.lastActiveBoard = AppState.getCurrentBoard();
      // Find the dropped board by id or name
      const boards = AppState.getBoards();
      let droppedBoard = null;
      if (data.board && data.board.id) {
        droppedBoard = boards.find(b => b.id === data.board.id);
      } else if (data.path) {
        // Try to find by file path or name
        const fileName = data.path.split('/').pop();
        droppedBoard = boards.find(
          b => b.filePath && b.filePath.endsWith(fileName)
        );
        if (!droppedBoard) {
          droppedBoard = boards.find(
            b => b.name === fileName.replace(/\.json$/, '')
          );
        }
      }
      if (droppedBoard) {
        await setCurrentBoard(droppedBoard.id);
        // Update board header and tags
        renderBoardSelector();
        updateBoardTagsDisplay();
        // Optionally, show a toast
        showToast(`Switched to board: ${droppedBoard.name}`, 'success');
      } else {
        showToast('Dropped board not found', 'error');
      }
    }
  } catch (error) {
    console.error('Error handling board drop:', error);
    showToast('Error adding item to board', 'error');
  }
}
/**
 * Change card color
 * @param {string} cardId - The card ID
 * @param {string} newColor - The new color
 */
async function changeCardColor(cardId, newColor) {
  try {
    const currentBoard = getActiveBoard();
    if (!currentBoard) {
      console.error('No active board found');
      return;
    }
    const card = currentBoard.cards.find(c => c.id === cardId);
    if (!card) {
      console.error('Card not found:', cardId);
      return;
    }
    card.color = newColor;
    await saveBoards();
    triggerAutosave();
    await renderBoard();
    showToast('Card color updated', 'success');
  } catch (error) {
    console.error('Error changing card color:', error);
    showToast('Error changing card color', 'error');
  }
}
/**
 * Handle dropping a card from another board (cross-board movement only)
 * @param {Object} data - The drag data
 * @param {number} x - The x position
 * @param {number} y - The y position
 */
async function handleCardDrop(data, x, y) {
  try {
    const activeBoard = getActiveBoard();
    if (!activeBoard) {
      console.error('No active board found');
      return;
    }
    // Only handle cross-board drags - same-board movement is handled by mouse dragging
    if (data.sourceBoard === activeBoard.id) {
      return;
    }
    // Cross-board drag - move card from source board to current board
    const sourceBoard = AppState.getBoards().find(
      b => b.id === data.sourceBoard
    );
    if (!sourceBoard) {
      console.error('Source board not found:', data.sourceBoard);
      return;
    }
    const card = sourceBoard.cards.find(c => c.id === data.cardId);
    if (!card) {
      console.error('Card not found in source board:', data.cardId);
      return;
    }
    // Remove card from source board
    sourceBoard.cards = sourceBoard.cards.filter(c => c.id !== data.cardId);
    // Add card to current board with new position
    const newCard = {
      ...card,
      x,
      y
    };
    activeBoard.cards.push(newCard);
    // Save changes
    await saveBoards();
    triggerAutosave();
    // Re-render both boards
    await renderBoard();
    showToast('Card moved to current board', 'success');
  } catch (error) {
    console.error('Error handling card drop:', error);
    showToast('Error moving card', 'error');
  }
}
/**
 * Copy compiled prompt to clipboard
 */
export async function copyCompiledPrompt() {
  try {
    const container = document.getElementById('compiledPrompt');
    if (!container) {
      showToast('Compiled prompt not found', 'error');
      return;
    }
    // Get the text content without HTML tags
    const textContent = container.textContent || container.innerText;
    if (!textContent.trim()) {
      showToast('No compiled prompt to copy', 'error');
      return;
    }
    // Try browser clipboard API first (more reliable)
    try {
      await navigator.clipboard.writeText(textContent);
      showToast('Compiled prompt copied to clipboard', 'success');
    } catch (clipboardError) {
      // Fallback to Electron API
      if (
        window.electronAPI &&
        typeof window.electronAPI.writeText === 'function'
      ) {
        try {
          await window.electronAPI.writeText(textContent);
          showToast('Compiled prompt copied to clipboard', 'success');
        } catch (electronError) {
          console.error('Electron clipboard error:', electronError);
          showToast('Clipboard not available', 'error');
        }
      } else {
        console.error('No clipboard API available, trying fallback method');
        // Fallback: create temporary textarea and copy
        try {
          const textarea = document.createElement('textarea');
          textarea.value = textContent;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showToast('Compiled prompt copied to clipboard', 'success');
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
          showToast('Clipboard not available', 'error');
        }
      }
    }
  } catch (error) {
    console.error('Error copying compiled prompt:', error);
    showToast('Error copying to clipboard', 'error');
  }
}
/**
 * Save compiled prompt as a new snippet
 */
export async function saveCompiledSnippet() {
  try {
    const container = document.getElementById('compiledPrompt');
    if (!container) {
      showToast('Compiled prompt not found', 'error');
      return;
    }
    // Get the text content without HTML tags
    const textContent = container.textContent || container.innerText;
    if (!textContent.trim()) {
      showToast('No compiled prompt to save', 'error');
      return;
    }
    // Collect all tags from snippets on the board
    const activeBoard = getActiveBoard();
    const allTags = new Set();
    if (activeBoard && activeBoard.cards && activeBoard.cards.length > 0) {
      const snippets = AppState.getSnippets();
      activeBoard.cards.forEach(card => {
        const snippet = snippets[card.snippetPath];
        if (snippet && snippet.tags && Array.isArray(snippet.tags)) {
          snippet.tags.forEach(tag => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      });
    }
    const combinedTags = Array.from(allTags).join(', ');
    // Open snippet modal with pre-filled text
    const modal = document.getElementById('snippetModal');
    if (!modal) {
      showToast('Snippet modal not found', 'error');
      return;
    }
    const textInput = document.getElementById('snippetTextInput');
    if (textInput) {
      textInput.value = textContent;
    }
    // Pre-fill tags input with collected tags
    const tagsInput = document.getElementById('snippetTagsInput');
    if (tagsInput) {
      tagsInput.value = combinedTags;
    }
    // Set modal title to indicate it's saving compiled prompt
    const title = document.getElementById('snippetModalTitle');
    if (title) {
      title.textContent = 'Save Compiled Prompt as Snippet';
    }
    // Change button text
    const confirmBtn = document.getElementById('createSnippetConfirmBtn');
    if (confirmBtn) {
      confirmBtn.textContent = 'Save Snippet';
    }
    // Populate folder dropdown
    const folderSelect = document.getElementById('snippetFolderSelect');
    if (folderSelect && window.sidebarTree) {
      try {
        // Import the functions we need
        const { getAllFolders, populateFolderDropdown } = await import(
          './sidebar.js'
        );
        const folders = getAllFolders(window.sidebarTree);
        populateFolderDropdown(folderSelect, folders, '');
      } catch (importError) {
        console.error('Error importing folder functions:', importError);
      }
    }
    // Show the modal
    modal.style.display = 'flex';
    // Focus the text input
    if (textInput) {
      textInput.focus();
      textInput.select();
    }
    // Ensure feather icons are rendered
    try {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (iconError) {
      console.warn('Error replacing feather icons:', iconError);
    }
    // Re-setup event handlers for the modal buttons
    try {
      const newFolderBtn = document.getElementById('newFolderFromSnippetBtn');
      const createInlineBtn = document.getElementById('createInlineFolderBtn');
      const cancelInlineBtn = document.getElementById('cancelInlineFolderBtn');
      if (newFolderBtn) {
        newFolderBtn.onclick = () => {
          const inlineCreation = modal.querySelector('#inlineFolderCreation');
          if (inlineCreation) {
            inlineCreation.style.display = 'block';
            const input = inlineCreation.querySelector('#newFolderNameInput');
            if (input) {
              input.value = '';
              input.focus();
            }
          }
        };
      }
      if (createInlineBtn) {
        createInlineBtn.onclick = async () => {
          const inlineCreation = modal.querySelector('#inlineFolderCreation');
          if (!inlineCreation) return;
          const input = inlineCreation.querySelector('#newFolderNameInput');
          if (!input) return;
          const folderName = input.value.trim();
          if (!folderName) {
            showToast('Please enter a folder name', 'error');
            return;
          }
          // Get the current folder selection
          const folderSelect = document.getElementById('snippetFolderSelect');
          const parentPath = folderSelect ? folderSelect.value : '';
          // Create the folder
          try {
            const { createInlineFolder } = await import('./sidebar.js');
            await createInlineFolder();
            // Refresh the folder dropdown
            if (folderSelect && window.sidebarTree) {
              const { getAllFolders, populateFolderDropdown } = await import(
                './sidebar.js'
              );
              const folders = getAllFolders(window.sidebarTree);
              populateFolderDropdown(folderSelect, folders, parentPath);
            }
            // Hide the inline creation form
            inlineCreation.style.display = 'none';
            showToast(`Created folder: ${folderName}`, 'success');
          } catch (error) {
            console.error('Error creating inline folder:', error);
            showToast('Error creating folder', 'error');
          }
        };
      }
      if (cancelInlineBtn) {
        cancelInlineBtn.onclick = () => {
          const inlineCreation = modal.querySelector('#inlineFolderCreation');
          if (inlineCreation) {
            inlineCreation.style.display = 'none';
          }
        };
      }
    } catch (error) {
      console.error('Error setting up modal event handlers:', error);
    }
    showToast('Ready to save compiled prompt as snippet', 'info');
  } catch (error) {
    console.error('Error saving compiled prompt as snippet:', error);
    showToast('Error opening snippet modal', 'error');
  }
}
/**
 * Toggle card colors on board
 */
export function toggleCardColors() {
  try {
    const currentShowColors = AppState.getShowCardColors();
    AppState.setShowCardColors(!currentShowColors);
    // Re-render the board to update card colors
    renderBoard();
    // Update button state
    const toggleSnippetColorsBtn = document.getElementById(
      'toggleSnippetColorsBtn'
    );
    if (toggleSnippetColorsBtn) {
      if (!currentShowColors) {
        toggleSnippetColorsBtn.classList.add('active');
        toggleSnippetColorsBtn.innerHTML =
          '<i data-feather="droplet"></i>Hide Colors';
      } else {
        toggleSnippetColorsBtn.classList.remove('active');
        toggleSnippetColorsBtn.innerHTML =
          '<i data-feather="droplet"></i>Colors';
      }
    }
    // Replace feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    showToast(
      `Card colors ${!currentShowColors ? 'enabled' : 'disabled'}`,
      'success'
    );
  } catch (error) {
    console.error('Error toggling card colors:', error);
    showToast('Error toggling card colors', 'error');
  }
}
/**
 * Toggle compiled prompt colors
 */
export function toggleCompiledColors() {
  try {
    const currentShowColors = AppState.getShowCompiledColors();
    AppState.setShowCompiledColors(!currentShowColors);
    // Update the compiled prompt display
    updateCompiledPrompt();
    // Update button state
    const toggleColorBtn = document.getElementById('toggleColorBtn');
    if (toggleColorBtn) {
      if (!currentShowColors) {
        toggleColorBtn.classList.add('active');
        toggleColorBtn.textContent = 'Hide Colors';
      } else {
        toggleColorBtn.classList.remove('active');
        toggleColorBtn.textContent = 'Toggle Colors';
      }
    }
    showToast(
      `Colors ${!currentShowColors ? 'enabled' : 'disabled'}`,
      'success'
    );
  } catch (error) {
    console.error('Error toggling compiled colors:', error);
    showToast('Error toggling colors', 'error');
  }
}
/**
 * Toggle compiled prompt expansion
 */
export function toggleCompiledPromptExpansion() {
  try {
    const compiledPrompt = document.querySelector('.compiled-prompt');
    const expandBtn = document.getElementById('expandCompiledBtn');
    if (!compiledPrompt || !expandBtn) {
      console.error('Compiled prompt elements not found');
      return;
    }
    const isExpanded = compiledPrompt.classList.contains('expanded');
    if (isExpanded) {
      compiledPrompt.classList.remove('expanded');
      expandBtn.innerHTML = '<i data-feather="chevron-up"></i>';
    } else {
      compiledPrompt.classList.add('expanded');
      expandBtn.innerHTML = '<i data-feather="chevron-down"></i>';
    }
    // Replace feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  } catch (error) {
    console.error('Error toggling compiled prompt expansion:', error);
  }
}
