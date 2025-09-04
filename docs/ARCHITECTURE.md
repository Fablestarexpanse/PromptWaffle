# 🏗️ PROMPTWAFLE ARCHITECTURE DOCUMENTATION
**Version:** 1.3.1 | **Last Updated:** 2024-12-19 | **Status:** ACTIVE DEVELOPMENT

## 📋 TABLE OF CONTENTS
- [🎯 ARCHITECTURAL OVERVIEW](#-architectural-overview)
- [🔌 ELECTRON ARCHITECTURE](#-electron-architecture)
- [🎨 UI ARCHITECTURE](#-ui-architecture)
- [⚡ STATE MANAGEMENT ARCHITECTURE](#-state-management-architecture)
- [📁 DATA PERSISTENCE ARCHITECTURE](#-data-persistence-architecture)
- [🔄 EVENT SYSTEM ARCHITECTURE](#-event-system-architecture)
- [🔧 BOOTSTRAP ARCHITECTURE](#-bootstrap-architecture)
- [🎭 COMPONENT ARCHITECTURE](#-component-architecture)
- [🚀 PERFORMANCE ARCHITECTURE](#-performance-architecture)
- [🛡️ SECURITY ARCHITECTURE](#️-security-architecture)

---

## 🎯 ARCHITECTURAL OVERVIEW

### **HIGH-LEVEL ARCHITECTURE**
PromptWaffle follows a **layered architecture pattern** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│                  COMPONENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                   STATE MANAGEMENT LAYER                   │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                    │
├─────────────────────────────────────────────────────────────┤
│                     DATA ACCESS LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                     FILE SYSTEM LAYER                      │
└─────────────────────────────────────────────────────────────┘
```

### **ARCHITECTURAL PRINCIPLES**
1. **Separation of Concerns** - Each layer has a single responsibility
2. **Dependency Inversion** - High-level modules don't depend on low-level modules
3. **Single Responsibility** - Each component has one reason to change
4. **Open/Closed Principle** - Open for extension, closed for modification
5. **Interface Segregation** - Components depend only on interfaces they use

---

## 🔌 ELECTRON ARCHITECTURE

### **PROCESS ARCHITECTURE**
```
┌─────────────────┐    IPC    ┌─────────────────┐
│   MAIN PROCESS │ ◄────────► │ RENDERER PROCESS│
│   (main.js)    │            │   (app.js)      │
└─────────────────┘            └─────────────────┘
        │                               │
        │                               │
        ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│  File System   │            │      DOM        │
│   Operations   │            │   Manipulation  │
└─────────────────┘            └─────────────────┘
```

### **IPC COMMUNICATION PATTERNS**
```javascript
// Main Process → Renderer Process
mainWindow.webContents.send('event-name', data);

// Renderer Process → Main Process
ipcRenderer.invoke('operation-name', data);

// Preload Script Bridge
window.electronAPI = {
  readFile: (path) => ipcRenderer.invoke('fs-read', path),
  writeFile: (path, data) => ipcRenderer.invoke('fs-write', path, data),
  // ... other file operations
};
```

### **SECURITY MODEL**
- **Context Isolation:** Enabled by default
- **Node Integration:** Disabled for security
- **Preload Scripts:** Only necessary APIs exposed
- **Content Security Policy:** Strict CSP headers

---

## 🎨 UI ARCHITECTURE

### **COMPONENT HIERARCHY**
```
AppLayout
├── Sidebar
│   ├── LogoSection
│   ├── ActionButtons
│   ├── FolderTree
│   └── SnippetList
├── MainContent
│   ├── BoardSelector
│   ├── BoardCanvas
│   │   ├── DropZones
│   │   ├── SnippetCards
│   │   └── GroupContainers
│   └── CompiledPrompt
└── Modals
    ├── ImageViewer
    ├── Tutorial
    └── UpdateDialog
```

### **RENDERING STRATEGY**
- **Imperative Rendering:** Direct DOM manipulation for performance
- **Event-Driven Updates:** UI updates triggered by state changes
- **Lazy Loading:** Components rendered on-demand
- **Virtual Scrolling:** Large lists use virtualization

### **CSS ARCHITECTURE**
```css
/* BEM Methodology */
.component {}
.component__element {}
.component--modifier {}

/* CSS Custom Properties */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --background-color: #2f3136;
  --text-color: #ffffff;
}
```

---

## ⚡ STATE MANAGEMENT ARCHITECTURE

### **STATE STRUCTURE DESIGN**
```javascript
const AppState = {
  // Immutable data arrays
  promptFolders: Object.freeze([]),
  prompts: Object.freeze([]),
  boards: Object.freeze([]),
  
  // Mutable UI state
  ui: {
    activeBoardId: null,
    currentSearchTerm: '',
    expandedFolders: new Set(),
    selectedItems: new Set()
  },
  
  // Configuration state
  config: {
    sortConfig: { field: 'name', direction: 'asc' },
    visualPreferences: {
      showCompiledColors: true,
      showCardColors: true,
      boardBackgroundColor: '#2F3136'
    }
  }
};
```

### **STATE UPDATE PATTERNS**
```javascript
// Immutable updates
setPrompts(newPrompts) {
  this.prompts = Object.freeze([...newPrompts]);
  this.notifyListeners('prompts-changed');
}

// UI state updates
setActiveBoard(id) {
  this.ui.activeBoardId = id;
  this.notifyListeners('active-board-changed');
}
```

### **OBSERVER PATTERN IMPLEMENTATION**
```javascript
class StateObserver {
  constructor() {
    this.listeners = new Map();
  }
  
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  
  notify(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}
```

---

## 📁 DATA PERSISTENCE ARCHITECTURE

### **STORAGE STRATEGY**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App State    │───►│  JSON Files    │───►│  File System   │
│   (Memory)     │    │  (Persistent)  │    │   (OS Level)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **FILE ORGANIZATION**
```
boards/
├── app-state.json          # Complete application state
├── boards.json            # Legacy board storage
└── individual-boards/     # Individual board files
    ├── board-1.json
    └── board-2.json

snippets/
├── folder-structure/      # Folder hierarchy
└── snippet-files.json     # Snippet metadata

profiles/
├── default.json           # Default prompt profile
├── photorealistic.json    # Photo-realistic profile
└── artistic.json          # Artistic profile
```

### **PERSISTENCE PATTERNS**
```javascript
// Auto-save with debouncing
class AutoSaveManager {
  constructor(delay = 2000) {
    this.delay = delay;
    this.timeout = null;
  }
  
  scheduleSave() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.performSave();
    }, this.delay);
  }
  
  async performSave() {
    try {
      await saveApplicationState();
      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
}
```

---

## 🔄 EVENT SYSTEM ARCHITECTURE

### **EVENT FLOW DIAGRAM**
```
User Action → DOM Event → Event Handler → State Update → UI Re-render → Auto-save
     │            │           │            │            │            │
     ▼            ▼           ▼            ▼            ▼            ▼
  Click/Drag   click/drag   handler     AppState    bootstrap    File I/O
```

### **EVENT HANDLER REGISTRATION**
```javascript
function setupEventListeners() {
  // Global event delegation
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('drop', handleDrop);
  
  // Component-specific events
  setupSidebarEvents();
  setupBoardEvents();
  setupSnippetEvents();
}

function handleGlobalClick(event) {
  const target = event.target;
  
  // Button clicks
  if (target.matches('[data-action]')) {
    const action = target.dataset.action;
    executeAction(action, event);
  }
  
  // Card interactions
  if (target.closest('[data-card-id]')) {
    handleCardInteraction(event);
  }
}
```

### **CUSTOM EVENT SYSTEM**
```javascript
class EventBus {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Usage
eventBus.on('snippet-created', (snippet) => {
  updateSnippetList(snippet);
  showNotification('Snippet created successfully');
});
```

---

## 🔧 BOOTSTRAP ARCHITECTURE

### **INITIALIZATION SEQUENCE**
```javascript
async function initializeApplication() {
  try {
    // 1. Show loading screen
    showLoadingScreen();
    
    // 2. Load application state
    const state = await loadApplicationState();
    if (!state) {
      throw new Error('Failed to load application state');
    }
    
    // 3. Restore state to AppState
    restoreApplicationState(state);
    
    // 4. Initialize UI components
    await initializeUIComponents();
    
    // 5. Setup event listeners
    setupEventListeners();
    
    // 6. Hide loading screen
    hideLoadingScreen();
    
    // 7. Application ready
    onApplicationReady();
    
  } catch (error) {
    handleInitializationError(error);
  }
}
```

### **BOOTSTRAP MODULES**
```javascript
// bootstrap/index.js
export * from './state.js';
export * from './ui.js';
export * from './data.js';
export * from './validation.js';

// bootstrap/state.js
export async function loadApplicationState() {
  // Implementation details
}

// bootstrap/ui.js
export async function initializeUIComponents() {
  // Implementation details
}
```

---

## 🎭 COMPONENT ARCHITECTURE

### **COMPONENT LIFECYCLE**
```javascript
class Component {
  constructor(element, config) {
    this.element = element;
    this.config = config;
    this.state = {};
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.render();
  }
  
  bindEvents() {
    // Event binding logic
  }
  
  render() {
    // Rendering logic
  }
  
  update(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
  
  destroy() {
    this.unbindEvents();
    this.element.remove();
  }
}
```

### **COMPONENT COMMUNICATION**
```javascript
// Parent-child communication
class ParentComponent {
  constructor() {
    this.children = new Map();
  }
  
  addChild(id, child) {
    this.children.set(id, child);
    child.setParent(this);
  }
  
  notifyChildren(event, data) {
    this.children.forEach(child => {
      child.handleParentEvent(event, data);
    });
  }
}

// Sibling communication via event bus
eventBus.on('component-updated', (data) => {
  // Handle component updates
});
```

---

## 🚀 PERFORMANCE ARCHITECTURE

### **OPTIMIZATION STRATEGIES**
1. **Lazy Loading** - Components loaded on-demand
2. **Debouncing** - User input throttled for performance
3. **Virtual Scrolling** - Large lists use virtualization
4. **Memoization** - Expensive calculations cached
5. **Event Delegation** - Single event listener for multiple elements

### **MEMORY MANAGEMENT**
```javascript
class MemoryManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // Move to front (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### **RENDERING OPTIMIZATIONS**
```javascript
// Batch DOM updates
class DOMBatchUpdater {
  constructor() {
    this.pendingUpdates = new Set();
    this.isScheduled = false;
  }
  
  scheduleUpdate(element, updateFn) {
    this.pendingUpdates.add({ element, updateFn });
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => this.processUpdates());
    }
  }
  
  processUpdates() {
    this.pendingUpdates.forEach(({ element, updateFn }) => {
      updateFn(element);
    });
    
    this.pendingUpdates.clear();
    this.isScheduled = false;
  }
}
```

---

## 🛡️ SECURITY ARCHITECTURE

### **SECURITY LAYERS**
1. **Electron Security** - Context isolation, disabled node integration
2. **Input Validation** - All user inputs sanitized
3. **File System Security** - Restricted to app directories
4. **Content Security Policy** - Strict CSP headers
5. **IPC Security** - Limited API exposure

### **INPUT SANITIZATION**
```javascript
class InputSanitizer {
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255);
  }
  
  static sanitizeHTML(content) {
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
  }
  
  static validateJSON(data) {
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }
}
```

### **FILE SYSTEM SECURITY**
```javascript
class FileSystemSecurity {
  static isPathSafe(path) {
    const appDir = process.cwd();
    const resolvedPath = path.resolve(path);
    
    // Ensure path is within app directory
    return resolvedPath.startsWith(appDir);
  }
  
  static sanitizePath(path) {
    // Remove any path traversal attempts
    return path.replace(/\.\./g, '');
  }
}
```

---

## 📊 ARCHITECTURE METRICS

### **COMPLEXITY METRICS**
- **Cyclomatic Complexity:** Low to Medium
- **Coupling:** Loose coupling between components
- **Cohesion:** High cohesion within components
- **Lines of Code:** ~15,000 LOC
- **Component Count:** 15+ reusable components

### **PERFORMANCE METRICS**
- **Startup Time:** < 2 seconds
- **Memory Usage:** < 100MB typical
- **File I/O:** Optimized with batching
- **UI Responsiveness:** 60fps target

### **MAINTAINABILITY METRICS**
- **Code Coverage:** To be implemented
- **Technical Debt:** Low
- **Documentation Coverage:** High
- **Test Coverage:** To be implemented

---

## 🔮 FUTURE ARCHITECTURE PLANS

### **SHORT-TERM IMPROVEMENTS**
1. **Testing Infrastructure** - Jest + Electron testing
2. **Error Boundaries** - Graceful error handling
3. **Performance Monitoring** - Real-time metrics
4. **Code Splitting** - Lazy loading of features

### **MEDIUM-TERM ENHANCEMENTS**
1. **Plugin System** - Extensible architecture
2. **Service Workers** - Offline capabilities
3. **WebAssembly** - Performance-critical operations
4. **Progressive Web App** - Web version

### **LONG-TERM VISION**
1. **Microservices** - Backend services
2. **Real-time Collaboration** - Multi-user editing
3. **AI Integration** - Smart prompt suggestions
4. **Cloud Sync** - Cross-device synchronization

---

## 📝 ARCHITECTURE DECISIONS LOG

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|------------|-------------------------|
| 2024-12-19 | File-based persistence | Simple, portable, no external dependencies | Database, cloud storage |
| 2024-12-19 | Vanilla JavaScript | No framework overhead, full control | React, Vue, Angular |
| 2024-12-19 | Event-driven architecture | Loose coupling, easy testing | Direct method calls |
| 2024-12-19 | Component-based UI | Reusability, maintainability | Monolithic UI |

---

**🔗 Related Documentation:**
- [MASTER_INDEX.md](../MASTER_INDEX.md) - Central navigation hub
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation

**📧 Contact:** PromptWaffle Team | **🏷️ Version:** 1.3.1 | **📅 Last Updated:** 2024-12-19

