# 📚 PROMPTWAFLE API REFERENCE
**Version:** 1.3.1 | **Last Updated:** 2024-12-19 | **Status:** ACTIVE DEVELOPMENT

## 📋 TABLE OF CONTENTS
- [🎯 API OVERVIEW](#-api-overview)
- [🔌 ELECTRON API](#-electron-api)
- [⚡ STATE MANAGEMENT API](#-state-management-api)
- [🎨 UI COMPONENT API](#-ui-component-api)
- [📁 FILE SYSTEM API](#-file-system-api)
- [🔄 EVENT SYSTEM API](#-event-system-api)
- [🔧 BOOTSTRAP API](#-bootstrap-api)
- [🎭 UTILITY API](#-utility-api)
- [🐛 DEBUGGING API](#-debugging-api)
- [📊 DATA MODELS](#-data-models)

---

## 🎯 API OVERVIEW

### **API ARCHITECTURE**
PromptWaffle provides a comprehensive API system organized into logical modules:

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC API LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                  COMPONENT API                             │
├─────────────────────────────────────────────────────────────┤
│                   STATE API                                │
├─────────────────────────────────────────────────────────────┤
│                    UTILITY API                             │
├─────────────────────────────────────────────────────────────┤
│                     CORE API                               │
└─────────────────────────────────────────────────────────────┘
```

### **API DESIGN PRINCIPLES**
1. **Consistency** - Similar operations use similar patterns
2. **Simplicity** - Clear, intuitive function names
3. **Error Handling** - Comprehensive error handling with meaningful messages
4. **Performance** - Optimized for common use cases
5. **Extensibility** - Easy to extend and modify

---

## 🔌 ELECTRON API

### **MAIN PROCESS API (`main.js`)**

#### **Window Management**
```javascript
/**
 * Creates the main application window
 * @param {Object} options - Window creation options
 * @returns {BrowserWindow} The created window instance
 */
function createWindow(options = {}) {
  // Implementation
}

/**
 * Creates an image viewer window
 * @returns {BrowserWindow} The image viewer window instance
 */
function createImageViewerWindow() {
  // Implementation
}
```

#### **IPC Handlers**
```javascript
/**
 * Handles file system read operations
 * @param {IpcMainInvokeEvent} event - IPC event
 * @param {string} path - File path to read
 * @returns {Promise<string>} File contents
 */
ipcMain.handle('fs-read', async (event, path) => {
  // Implementation
});

/**
 * Handles file system write operations
 * @param {IpcMainInvokeEvent} event - IPC event
 * @param {string} path - File path to write
 * @param {string} data - Data to write
 * @returns {Promise<boolean>} Success status
 */
ipcMain.handle('fs-write', async (event, path, data) => {
  // Implementation
});
```

### **PRELOAD SCRIPT API (`preload.js`)**

#### **File System Operations**
```javascript
/**
 * Reads a file from the file system
 * @param {string} path - File path to read
 * @returns {Promise<string>} File contents
 * @throws {Error} If file cannot be read
 */
window.electronAPI.readFile = (path) => ipcRenderer.invoke('fs-read', path);

/**
 * Writes data to a file
 * @param {string} path - File path to write
 * @param {string} data - Data to write
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If file cannot be written
 */
window.electronAPI.writeFile = (path, data) => ipcRenderer.invoke('fs-write', path, data);

/**
 * Checks if a file or directory exists
 * @param {string} path - Path to check
 * @returns {Promise<boolean>} Existence status
 */
window.electronAPI.exists = (path) => ipcRenderer.invoke('fs-exists', path);

/**
 * Gets file/directory statistics
 * @param {string} path - Path to get stats for
 * @returns {Promise<Object>} File stats object
 */
window.electronAPI.stat = (path) => ipcRenderer.invoke('fs-stat', path);

/**
 * Reads directory contents
 * @param {string} path - Directory path to read
 * @returns {Promise<Array>} Array of directory entries
 */
window.electronAPI.readdir = (path) => ipcRenderer.invoke('fs-readdir', path);

/**
 * Removes a file or directory
 * @param {string} path - Path to remove
 * @returns {Promise<boolean>} Success status
 */
window.electronAPI.deleteFolder = (path) => ipcRenderer.invoke('fs-rm', path);
```

---

## ⚡ STATE MANAGEMENT API

### **APPSTATE CLASS (`src/state/appState.js`)**

#### **Core State Management**
```javascript
/**
 * Application state management singleton
 * @class AppState
 * @description Centralized state management for the entire application
 */
const AppState = {
  /**
   * Gets all prompt folders
   * @returns {Array} Copy of prompt folders array
   */
  getPromptFolders() {
    return [...this.promptFolders];
  },

  /**
   * Sets prompt folders
   * @param {Array} folders - Array of folder objects
   */
  setPromptFolders(folders) {
    this.promptFolders = Array.isArray(folders) ? folders : [];
  },

  /**
   * Gets all prompts
   * @returns {Array} Copy of prompts array
   */
  getPrompts() {
    return [...this.prompts];
  },

  /**
   * Sets prompts
   * @param {Array} prompts - Array of prompt objects
   */
  setPrompts(prompts) {
    this.prompts = Array.isArray(prompts) ? prompts : [];
  },

  /**
   * Gets all boards
   * @returns {Array} Copy of boards array
   */
  getBoards() {
    return [...this.boards];
  },

  /**
   * Sets boards
   * @param {Array} boards - Array of board objects
   */
  setBoards(boards) {
    this.boards = Array.isArray(boards) ? boards : [];
  },

  /**
   * Gets the active board ID
   * @returns {string|null} Active board ID or null
   */
  getActiveBoardId() {
    return this.activeBoardId;
  },

  /**
   * Sets the active board ID
   * @param {string} id - Board ID to set as active
   */
  setActiveBoardId(id) {
    this.activeBoardId = id;
  },

  /**
   * Gets the current board object
   * @returns {Object|null} Current board object or null
   */
  getCurrentBoard() {
    return this.currentBoard;
  },

  /**
   * Sets the current board object
   * @param {Object} board - Board object to set as current
   */
  setCurrentBoard(board) {
    this.currentBoard = board;
  }
};
```

#### **Search and Filtering**
```javascript
/**
 * Gets the current search term
 * @returns {string} Current search term
 */
getCurrentSearchTerm() {
  return this.currentSearchTerm;
},

/**
 * Sets the current search term
 * @param {string} term - Search term to set
 */
setCurrentSearchTerm(term) {
  this.currentSearchTerm = term;
},

/**
 * Gets current sort configuration
 * @returns {Object} Sort configuration object
 */
getSortConfig() {
  return { ...this.sortConfig };
},

/**
 * Sets sort configuration
 * @param {Object} config - Sort configuration object
 */
setSortConfig(config) {
  this.sortConfig = { ...this.sortConfig, ...config };
}
```

#### **Visual Preferences**
```javascript
/**
 * Gets compiled colors display setting
 * @returns {boolean} Whether to show compiled colors
 */
getShowCompiledColors() {
  return this.showCompiledColors;
},

/**
 * Sets compiled colors display setting
 * @param {boolean} show - Whether to show compiled colors
 */
setShowCompiledColors(show) {
  this.showCompiledColors = Boolean(show);
},

/**
 * Gets card colors display setting
 * @returns {boolean} Whether to show card colors
 */
getShowCardColors() {
  return this.showCardColors;
},

/**
 * Sets card colors display setting
 * @param {boolean} show - Whether to show card colors
 */
setShowCardColors(show) {
  this.showCardColors = Boolean(show);
}
```

---

## 🎨 UI COMPONENT API

### **SIDEBAR COMPONENT (`src/components/Sidebar/`)**

#### **Sidebar Management**
```javascript
/**
 * Renders the sidebar with folder tree and snippets
 * @param {Object} sidebarData - Sidebar data structure
 * @param {HTMLElement} container - Container element to render into
 */
function renderSidebar(sidebarData, container) {
  // Implementation
}

/**
 * Applies saved sidebar state (expanded folders, etc.)
 * @param {Array} expandedFolders - Array of expanded folder IDs
 */
function applySidebarState(expandedFolders) {
  // Implementation
}

/**
 * Updates the sidebar search functionality
 * @param {string} searchTerm - Search term to filter by
 */
function updateSidebarSearch(searchTerm) {
  // Implementation
}
```

#### **Folder Operations**
```javascript
/**
 * Creates a new folder in the sidebar
 * @param {string} name - Folder name
 * @param {string} parentId - Parent folder ID (optional)
 * @returns {Promise<Object>} Created folder object
 */
async function createFolder(name, parentId = null) {
  // Implementation
}

/**
 * Deletes a folder from the sidebar
 * @param {string} folderId - ID of folder to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteFolder(folderId) {
  // Implementation
}

/**
 * Renames a folder
 * @param {string} folderId - ID of folder to rename
 * @param {string} newName - New folder name
 * @returns {Promise<boolean>} Success status
 */
async function renameFolder(folderId, newName) {
  // Implementation
}
```

### **BOARD COMPONENT (`src/ui/board/`)**

#### **Board Rendering**
```javascript
/**
 * Renders the current board
 * @returns {Promise<void>}
 */
async function renderBoard() {
  // Implementation
}

/**
 * Sets the current board by ID
 * @param {string} boardId - Board ID to set as current
 * @returns {Promise<boolean>} Success status
 */
async function setCurrentBoard(boardId) {
  // Implementation
}

/**
 * Renders the board selector dropdown
 */
function renderBoardSelector() {
  // Implementation
}
```

#### **Board Operations**
```javascript
/**
 * Creates a new board
 * @param {string} name - Board name
 * @param {Array} tags - Board tags
 * @returns {Promise<Object>} Created board object
 */
async function createBoard(name, tags = []) {
  // Implementation
}

/**
 * Deletes a board
 * @param {string} boardId - ID of board to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteBoard(boardId) {
  // Implementation
}

/**
 * Updates board properties
 * @param {string} boardId - Board ID to update
 * @param {Object} updates - Properties to update
 * @returns {Promise<boolean>} Success status
 */
async function updateBoard(boardId, updates) {
  // Implementation
}
```

### **DRAG AND DROP API (`src/ui/dnd.js`)**

#### **Drag Operations**
```javascript
/**
 * Initializes drag and drop functionality
 * @param {HTMLElement} element - Element to make draggable
 * @param {Object} data - Data to transfer during drag
 */
function initializeDrag(element, data) {
  // Implementation
}

/**
 * Handles drag start event
 * @param {DragEvent} event - Drag start event
 */
function handleDragStart(event) {
  // Implementation
}

/**
 * Handles drag over event
 * @param {DragEvent} event - Drag over event
 */
function handleDragOver(event) {
  // Implementation
}

/**
 * Handles drop event
 * @param {DragEvent} event - Drop event
 */
function handleDrop(event) {
  // Implementation
}
```

---

## 📁 FILE SYSTEM API

### **BOOTSTRAP STATE API (`src/bootstrap/state.js`)**

#### **State Persistence**
```javascript
/**
 * Saves the complete application state
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If save operation fails
 */
export async function saveApplicationState() {
  // Implementation
}

/**
 * Loads the complete application state
 * @returns {Promise<Object|null>} Application state or null
 * @throws {Error} If load operation fails
 */
export async function loadApplicationState() {
  // Implementation
}

/**
 * Captures current application state
 * @returns {Object} Current application state
 */
export function captureApplicationState() {
  // Implementation
}

/**
 * Restores application state from saved data
 * @param {Object} state - State data to restore
 */
export function restoreApplicationState(state) {
  // Implementation
}
```

#### **Data Validation**
```javascript
/**
 * Validates saved data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} Validation result
 */
function validateSavedData(data) {
  // Implementation
}

/**
 * Merges user data with default values
 * @param {Object} data - User data to merge
 * @returns {Object} Merged data with defaults
 */
function mergeWithDefaults(data) {
  // Implementation
}
```

---

## 🔄 EVENT SYSTEM API

### **EVENT LISTENERS (`src/events/eventListeners.js`)**

#### **Event Setup**
```javascript
/**
 * Sets up all application event listeners
 */
export function setupEventListeners() {
  // Implementation
}

/**
 * Sets up sidebar-specific event listeners
 */
function setupSidebarEvents() {
  // Implementation
}

/**
 * Sets up board-specific event listeners
 */
function setupBoardEvents() {
  // Implementation
}

/**
 * Sets up snippet-specific event listeners
 */
function setupSnippetEvents() {
  // Implementation
}
```

#### **Global Event Handling**
```javascript
/**
 * Handles global click events
 * @param {Event} event - Click event
 */
function handleGlobalClick(event) {
  // Implementation
}

/**
 * Handles global drag events
 * @param {Event} event - Drag event
 */
function handleGlobalDrag(event) {
  // Implementation
}

/**
 * Handles global drop events
 * @param {Event} event - Drop event
 */
function handleGlobalDrop(event) {
  // Implementation
}
```

---

## 🔧 BOOTSTRAP API

### **BOOTSTRAP INDEX (`src/bootstrap/index.js`)**

#### **Application Initialization**
```javascript
/**
 * Loads initial application data
 * @returns {Promise<Object>} Initial data object
 */
export async function loadInitialData() {
  // Implementation
}

/**
 * Renders the sidebar component
 * @param {Object} sidebarTree - Sidebar tree data
 * @param {HTMLElement} container - Container element
 */
export function renderSidebar(sidebarTree, container) {
  // Implementation
}

/**
 * Renders the board selector
 */
export function renderBoardSelector() {
  // Implementation
}

/**
 * Updates the compiled prompt display
 */
export function updateCompiledPrompt() {
  // Implementation
}

/**
 * Updates the board tags display
 */
export function updateBoardTagsDisplay() {
  // Implementation
}
```

#### **UI State Management**
```javascript
/**
 * Shows a centered warning message
 * @param {string} message - Warning message to display
 */
export function showCenteredWarning(message) {
  // Implementation
}

/**
 * Shows a loading screen
 */
export function showLoadingScreen() {
  // Implementation
}

/**
 * Hides the loading screen
 */
export function hideLoadingScreen() {
  // Implementation
}
```

---

## 🎭 UTILITY API

### **UTILITY FUNCTIONS (`src/utils/`)**

#### **File Operations**
```javascript
/**
 * Generates a unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  // Implementation
}

/**
 * Sanitizes a filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  // Implementation
}

/**
 * Formats a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  // Implementation
}
```

#### **Data Validation**
```javascript
/**
 * Validates snippet data
 * @param {Object} snippet - Snippet data to validate
 * @returns {Object} Validation result with errors array
 */
export function validateSnippet(snippet) {
  // Implementation
}

/**
 * Validates board data
 * @param {Object} board - Board data to validate
 * @returns {Object} Validation result with errors array
 */
export function validateBoard(board) {
  // Implementation
}
```

---

## 🐛 DEBUGGING API

### **DEBUGGING UTILITIES**

#### **Performance Monitoring**
```javascript
/**
 * Monitors application performance
 * @class PerformanceMonitor
 */
class PerformanceMonitor {
  /**
   * Starts performance monitoring
   */
  start() {
    // Implementation
  }

  /**
   * Stops performance monitoring
   */
  stop() {
    // Implementation
  }

  /**
   * Gets performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    // Implementation
  }
}
```

#### **Error Tracking**
```javascript
/**
 * Tracks application errors
 * @class ErrorTracker
 */
class ErrorTracker {
  /**
   * Logs an error
   * @param {Error} error - Error to log
   * @param {Object} context - Error context
   */
  logError(error, context = {}) {
    // Implementation
  }

  /**
   * Gets error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    // Implementation
  }
}
```

---

## 📊 DATA MODELS

### **SNIPPET MODEL**
```javascript
/**
 * @typedef {Object} Snippet
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} content - Snippet content
 * @property {string[]} tags - Array of tags
 * @property {string} folderId - Parent folder ID
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} modifiedAt - Last modification timestamp
 * @property {string} color - Display color
 * @property {Object} metadata - Additional metadata
 */
```

### **BOARD MODEL**
```javascript
/**
 * @typedef {Object} Board
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {Array} cards - Array of snippet cards
 * @property {Array} groups - Array of card groups
 * @property {string[]} tags - Array of tags
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} modifiedAt - Last modification timestamp
 * @property {string} backgroundColor - Board background color
 * @property {Object} layout - Board layout configuration
 */
```

### **FOLDER MODEL**
```javascript
/**
 * @typedef {Object} Folder
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} parentId - Parent folder ID (null for root)
 * @property {Array} children - Array of child folder IDs
 * @property {Array} snippets - Array of snippet IDs in this folder
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} modifiedAt - Last modification timestamp
 */
```

### **CARD MODEL**
```javascript
/**
 * @typedef {Object} Card
 * @property {string} id - Unique identifier
 * @property {string} snippetId - Associated snippet ID
 * @property {Object} position - Position on board {x, y}
 * @property {Object} size - Card dimensions {width, height}
 * @property {string} color - Display color
 * @property {Object} metadata - Additional metadata
 */
```

---

## 🔗 API USAGE EXAMPLES

### **Creating a New Snippet**
```javascript
// 1. Create snippet data
const snippetData = {
  name: 'My Prompt',
  content: 'Generate a beautiful landscape',
  tags: ['landscape', 'nature'],
  folderId: 'folder-123'
};

// 2. Add to AppState
AppState.setPrompts([...AppState.getPrompts(), snippetData]);

// 3. Save to file system
await saveApplicationState();

// 4. Update UI
renderSidebar(AppState.getPromptFolders(), document.getElementById('sidebar'));
```

### **Creating a New Board**
```javascript
// 1. Create board data
const boardData = {
  id: generateId(),
  name: 'My Board',
  cards: [],
  groups: [],
  tags: ['personal'],
  createdAt: new Date(),
  modifiedAt: new Date()
};

// 2. Add to AppState
AppState.setBoards([...AppState.getBoards(), boardData]);

// 3. Set as active
AppState.setActiveBoardId(boardData.id);

// 4. Save and render
await saveApplicationState();
await renderBoard();
```

### **Handling Drag and Drop**
```javascript
// 1. Make element draggable
initializeDrag(snippetElement, {
  type: 'snippet',
  id: snippetId,
  content: snippetContent
});

// 2. Handle drop zone
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', (event) => {
  const data = JSON.parse(event.dataTransfer.getData('text'));
  if (data.type === 'snippet') {
    addSnippetToBoard(data.id, boardId);
  }
});
```

---

## 📝 API VERSIONING

### **VERSION COMPATIBILITY**
- **Current Version:** 1.3.1
- **API Stability:** Stable (no breaking changes planned)
- **Backward Compatibility:** Full support for v1.x APIs
- **Deprecation Policy:** 6-month notice for deprecated APIs

### **MIGRATION GUIDE**
```javascript
// Old API (deprecated)
AppState.prompts = newPrompts;

// New API (recommended)
AppState.setPrompts(newPrompts);
```

---

## 🚨 ERROR HANDLING

### **COMMON ERROR CODES**
```javascript
const ERROR_CODES = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_DATA: 'INVALID_DATA',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};
```

### **ERROR HANDLING PATTERNS**
```javascript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  
  // Handle specific error types
  if (error.code === ERROR_CODES.FILE_NOT_FOUND) {
    showUserMessage('File not found. Please check the path.');
  } else if (error.code === ERROR_CODES.PERMISSION_DENIED) {
    showUserMessage('Permission denied. Please check file permissions.');
  } else {
    showUserMessage('An unexpected error occurred. Please try again.');
  }
  
  throw error; // Re-throw for caller handling
}
```

---

**🔗 Related Documentation:**
- [MASTER_INDEX.md](../MASTER_INDEX.md) - Central navigation hub
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide

**📧 Contact:** PromptWaffle Team | **🏷️ Version:** 1.3.1 | **📅 Last Updated:** 2024-12-19

