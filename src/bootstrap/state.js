import { AppState } from '../state/appState.js';
import { getSidebarState, applySidebarState } from './index.js';
class FileOperationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  addOperation(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const { operation, resolve, reject } = this.queue.shift();
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      // Allow UI to update between operations
      await new Promise(r => setTimeout(r, 0));
    }
    this.processing = false;
  }
}
const fileQueue = new FileOperationQueue();
// --- Application State Management ---
let autosaveTimeout = null;
const AUTOSAVE_DELAY = 2000; // 2 seconds after last change
// Default values for fallback
const DEFAULT_STATE = {
  version: '1.0.0',
  boards: [],
  settings: {
    sortConfig: { field: 'name', direction: 'asc' },
    showCompiledColors: true,
    showCardColors: true,
    autosaveEnabled: true,
    autosaveInterval: 2000,
    monitoredFolder: null,
    boardBackgroundColor: '#2F3136'
  },
  uiState: {
    expandedFolders: [],
    currentBoardId: null,
    searchTerm: '',
    compiledPromptExpanded: false
  },
  tutorial: {
    tutorialShown: false,
    currentTutorialStep: 0
  },
  performance: {
    enableImageLazyLoading: true,
    enableDOMPooling: true,
    enableSearchDebouncing: true,
    cacheSize: 50
  }
};
// --- State Capture Functions ---
export function captureApplicationState() {
  try {
    // Capture UI state from DOM
    const sidebar = document.querySelector('.sidebar');
    const compiledPrompt = document.querySelector('.compiled-prompt');
    const searchInput = document.getElementById('tagSearchInput');
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      boards: JSON.parse(JSON.stringify(AppState.getBoards())), // Deep clone
      settings: {
        sortConfig: { ...AppState.getSortConfig() },
        showCompiledColors: AppState.getShowCompiledColors(),
        showCardColors: AppState.getShowCardColors(),
        autosaveEnabled: true,
        autosaveInterval: 30000, // 30 seconds
        monitoredFolder: AppState.getMonitoredFolder(),
        boardBackgroundColor: AppState.getBoardBackgroundColor()
      },
      uiState: {
        expandedFolders: Array.from(getSidebarState() || []),
        currentBoardId: AppState.getCurrentBoard()?.id || null,
        searchTerm: AppState.getCurrentSearchTerm() || '',
        compiledPromptExpanded:
          compiledPrompt?.classList.contains('expanded') || false
      },
      tutorial: {
        tutorialShown: AppState.getTutorialShown(),
        currentTutorialStep: AppState.getCurrentTutorialStep()
      },
      performance: {
        enableImageLazyLoading: true,
        enableDOMPooling: true,
        enableSearchDebouncing: true,
        cacheSize: 50
      }
    };
  } catch (error) {
    console.error('Error capturing application state:', error);
    return null;
  }
}
// --- Data Validation Functions ---
function validateSavedData(data) {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid data format, using defaults');
    return false;
  }
  // Check required fields
  const requiredFields = ['version', 'boards', 'settings', 'uiState'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.warn(`Missing required field: ${field}, using defaults`);
      return false;
    }
  }
  // Validate boards array
  if (!Array.isArray(data.boards)) {
    console.warn('Invalid boards data, using defaults');
    return false;
  }
  // Validate each board
  for (const board of data.boards) {
    if (!board.id || !board.name || !Array.isArray(board.cards)) {
      console.warn('Invalid board structure detected, using defaults');
      return false;
    }
  }
  // Validate settings
  const settings = data.settings;
  if (
    !settings.sortConfig ||
    !settings.sortConfig.field ||
    !settings.sortConfig.direction
  ) {
    console.warn('Invalid sort configuration, using defaults');
    return false;
  }
  return true;
}
function mergeWithDefaults(data) {
  // Deep merge user data with defaults
  const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));
  if (data) {
    // Merge boards
    if (data.boards && Array.isArray(data.boards)) {
      merged.boards = data.boards;
    }
    // Merge settings
    if (data.settings) {
      Object.assign(merged.settings, data.settings);
      if (data.settings.sortConfig) {
        Object.assign(merged.settings.sortConfig, data.settings.sortConfig);
      }
    }
    // Merge UI state
    if (data.uiState) {
      Object.assign(merged.uiState, data.uiState);
    }
    // Merge performance settings
    if (data.performance) {
      Object.assign(merged.performance, data.performance);
    }
  }
  return merged;
}
// --- Comprehensive Save Function ---
export async function saveApplicationState() {
  return fileQueue.addOperation(async () => {
    try {
      const state = captureApplicationState();
      if (!state) {
        throw new Error('Failed to capture application state');
      }
      // Save boards (maintain backward compatibility)
      await window.electronAPI.writeFile(
        'boards/boards.json',
        JSON.stringify(state.boards, null, 2)
      );
      // Save complete application state
      await window.electronAPI.writeFile(
        'boards/app-state.json',
        JSON.stringify(state, null, 2)
      );
      // Save each board to its individual file in snippets folder
      for (const board of state.boards) {
        if (board.filePath) {
          try {
            // Remove 'snippets/' prefix if it exists
            const filePath = board.filePath.startsWith('snippets/')
              ? board.filePath
              : `snippets/${board.filePath}`;
            // Create board data without the filePath property to avoid circular reference
            const boardData = {
              id: board.id,
              name: board.name,
              tags: board.tags || [],
              cards: board.cards || [],
              groups: board.groups || [],
              images: board.images || [],
              createdAt: board.createdAt,
              modifiedAt: board.modifiedAt
            };
            await window.electronAPI.writeFile(
              filePath,
              JSON.stringify(boardData, null, 2)
            );
          } catch (boardError) {
            console.error(
              `Failed to save board ${board.name} to file:`,
              boardError
            );
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to save application state:', error);
      throw error;
    }
  });
}
// Legacy function for backward compatibility
export async function saveBoards() {
  return saveApplicationState();
}
// --- Comprehensive Load Function ---
export async function loadApplicationState() {
  try {
    let appState = null;
    // Try to load complete app state first
    try {
      const stateContent = await window.electronAPI.readFile(
        'boards/app-state.json'
      );
      appState = JSON.parse(stateContent);
    } catch (error) {
      // Ignore errors when app state file doesn't exist
    }
    // Fallback to legacy boards file
    if (!appState) {
      try {
        const boardsContent =
          await window.electronAPI.readFile('boards/boards.json');
        const boardsData = JSON.parse(boardsContent);
        appState = {
          ...DEFAULT_STATE,
          boards: boardsData,
          timestamp: Date.now()
        };
      } catch (error) {
        // Ignore errors when legacy boards file doesn't exist
      }
    }
    // Validate and merge with defaults
    if (!validateSavedData(appState)) {
      console.warn('Invalid saved data detected, using safe defaults');
      appState = DEFAULT_STATE;
    }
    const finalState = mergeWithDefaults(appState);
    // Ensure at least one default board exists
    if (!finalState.boards || finalState.boards.length === 0) {
      // Default cards with the default snippets
      const defaultCards = [
        {
          id: 'card-default-photorealistic',
          snippetPath: 'snippets/Start Here/default_photorealistic.json',
          x: 100,
          y: 100,
          width: 457,
          height: 152,
          locked: false,
          color: '#E74C3C'
        },
        {
          id: 'card-default-cyberpunk',
          snippetPath: 'snippets/Start Here/default_cyberpunk.json',
          x: 572,
          y: 101,
          width: 352,
          height: 129,
          locked: false,
          color: '#3498DB'
        },
        {
          id: 'card-default-space',
          snippetPath: 'snippets/Start Here/default_space.json',
          x: 936,
          y: 96,
          width: 372,
          height: 79,
          locked: false,
          color: '#2ECC71'
        }
      ];
      const defaultBoard = {
        id: 'board-default',
        name: 'Default Board',
        tags: [],
        cards: defaultCards,
        groups: [],
        images: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
      finalState.boards = [defaultBoard];
      finalState.uiState.currentBoardId = defaultBoard.id;
      // Also save the default board as a file in Start Here folder if not present or invalid
      try {
        const folderPath = 'snippets/Start Here';
        const fileName = 'default_board.json';
        const filePath = `${folderPath}/${fileName}`;
        if (window.electronAPI && window.electronAPI.createFolder) {
          await window.electronAPI.createFolder(folderPath);
        }
        let shouldWriteBoardFile = true;
        if (window.electronAPI && window.electronAPI.readFile) {
          try {
            const fileContent = await window.electronAPI.readFile(filePath);
            const parsed = JSON.parse(fileContent);
            if (
              parsed &&
              typeof parsed === 'object' &&
              parsed.id &&
              parsed.name &&
              Array.isArray(parsed.cards) &&
              Array.isArray(parsed.tags)
            ) {
              shouldWriteBoardFile = false; // Valid board file exists
            }
          } catch (e) {
            shouldWriteBoardFile = true;
          }
        }
        if (
          shouldWriteBoardFile &&
          window.electronAPI &&
          window.electronAPI.writeFile
        ) {
          try {
            await window.electronAPI.writeFile(
              filePath,
              JSON.stringify(defaultBoard, null, 2)
            );
          } catch (writeErr) {
            console.error(
              '[DefaultBoard] Failed to write default board file:',
              writeErr
            );
            if (typeof showToast === 'function')
              showToast('Failed to write default board file', 'error');
          }
        }
      } catch (e) {
        console.error('[DefaultBoard] Error saving default board file:', e);
        if (typeof showToast === 'function')
          showToast('Error saving default board file', 'error');
      }
    }
    return finalState;
  } catch (error) {
    console.error('Error loading application state:', error);
    // Ensure at least one default board exists in fallback
    const fallbackState = { ...DEFAULT_STATE };
    if (!fallbackState.boards || fallbackState.boards.length === 0) {
      const defaultBoard = {
        id: 'board-default',
        name: 'Default Board',
        tags: [],
        cards: [],
        groups: [],
        images: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
      fallbackState.boards = [defaultBoard];
      fallbackState.uiState.currentBoardId = defaultBoard.id;
    }
    return fallbackState;
  }
}
// --- State Restoration Functions ---
export function restoreApplicationState(state) {
  try {
    // Restore boards
    AppState.setBoards(state.boards || []);
    // Restore settings
    AppState.setSortConfig(state.settings.sortConfig);
    AppState.setShowCompiledColors(state.settings.showCompiledColors);
    AppState.setShowCardColors(state.settings.showCardColors);
    AppState.setMonitoredFolder(state.settings.monitoredFolder);
    AppState.setBoardBackgroundColor(state.settings.boardBackgroundColor);
    // Restore UI state
    AppState.setCurrentSearchTerm(state.uiState.searchTerm);
    // Restore tutorial state
    if (state.tutorial) {
      AppState.setTutorialShown(state.tutorial.tutorialShown);
      AppState.setCurrentTutorialStep(state.tutorial.currentTutorialStep);
    }
    // Store for later restoration (after DOM is ready)
    window.savedUIState = state.uiState;
    return true;
  } catch (error) {
    console.error('Error restoring application state:', error);
    return false;
  }
}
export function restoreUIState() {
  try {
    const uiState = window.savedUIState;
    if (!uiState) return;
    // Restore sidebar expansion
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const compiledPrompt = document.querySelector('.compiled-prompt');
    // Restore compiled prompt expansion
    if (uiState.compiledPromptExpanded && compiledPrompt) {
      compiledPrompt.classList.add('expanded');
    }
    // Restore search term
    const searchInput = document.getElementById('tagSearchInput');
    if (searchInput && uiState.searchTerm) {
      searchInput.value = uiState.searchTerm;
      currentSearchTerm = uiState.searchTerm;
    }
    // Restore current board
    if (uiState.currentBoardId) {
      // Note: Board restoration is handled in app.js during initialization
    }
    // Restore expanded folders (after sidebar is rendered)
    if (uiState.expandedFolders && uiState.expandedFolders.length > 0) {
      applySidebarState(new Set(uiState.expandedFolders));
    }
    // Restore board background color
    const boardBackgroundColor = AppState.getBoardBackgroundColor();
    if (boardBackgroundColor) {
      const promptBoard = document.getElementById('promptBoard');
      if (promptBoard) {
        promptBoard.style.backgroundColor = boardBackgroundColor;
      }
    }
    // Clean up
    delete window.savedUIState;
  } catch (error) {
    console.error('Error restoring UI state:', error);
  }
}
// --- Autosave System ---
function scheduleAutosave() {
  // Clear any pending autosave
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
  // Schedule new autosave
  autosaveTimeout = setTimeout(async () => {
    try {
      await saveApplicationState();
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, AUTOSAVE_DELAY);
}
// Add autosave to user actions
export function triggerAutosave() {
  scheduleAutosave();
}
// --- Data Integrity Check ---
export function checkDataIntegrity() {
  try {
    // Check boards integrity
    const boards = AppState.getBoards();
    const validBoards = boards.filter(board => {
      if (!board.id || !board.name) {
        console.warn('Removing invalid board:', board);
        return false;
      }
      // Fix missing arrays
      if (!Array.isArray(board.cards)) {
        board.cards = [];
      }
      if (!Array.isArray(board.tags)) {
        board.tags = [];
      }
      if (!Array.isArray(board.images)) {
        board.images = [];
      }
      // Check card integrity
      board.cards = board.cards.filter(card => {
        if (!card.id || !card.snippetPath) {
          console.warn('Removing invalid card:', card);
          return false;
        }
        return true;
      });
      return true;
    });
    if (validBoards.length !== boards.length) {
      boards = validBoards;
      scheduleAutosave();
    }
    return true;
  } catch (error) {
    console.error('Data integrity check failed:', error);
    return false;
  }
}
