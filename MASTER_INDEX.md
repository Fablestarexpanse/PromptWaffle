# 🎯 PROMPTWAFLE MASTER INDEX
**Version:** 1.3.1 | **Last Updated:** 2024-12-19 | **Status:** ACTIVE DEVELOPMENT

## 📋 QUICK NAVIGATION
- [🏗️ ARCHITECTURE OVERVIEW](#️-architecture-overview)
- [📁 FILE STRUCTURE](#-file-structure)
- [🔗 CORE INTERCONNECTIONS](#-core-interconnections)
- [🎨 UI COMPONENTS](#-ui-components)
- [⚡ STATE MANAGEMENT](#-state-management)
- [🔄 DATA FLOW](#-data-flow)
- [🐛 DEBUGGING & AUDITING](#-debugging--auditing)
- [🚀 DEVELOPMENT WORKFLOW](#-development-workflow)
- [📚 AI INTEGRATION METADATA](#-ai-integration-metadata)

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Application Type:** Desktop Electron Application
### **Primary Purpose:** AI Prompt Management & Composition System
### **Core Technology Stack:** Electron + Node.js + Vanilla JavaScript + HTML/CSS
### **Data Storage:** Local JSON files + File system
### **UI Framework:** Custom component system with drag-and-drop

### **Key Architectural Patterns:**
- **Event-Driven Architecture** with IPC communication
- **Component-Based UI** with modular state management
- **File-Based Data Persistence** with JSON serialization
- **Observer Pattern** for state synchronization
- **Factory Pattern** for component creation

---

## 📁 FILE STRUCTURE

### **ROOT LEVEL FILES**
```
📄 main.js                    # Electron main process entry point
📄 preload.js                 # Preload script for IPC communication
📄 launcher.js               # Application launcher script
📄 package.json              # Dependencies and build configuration
📄 MASTER_INDEX.md           # This file - Central navigation hub
```

### **SOURCE CODE (`src/`)**
```
📁 src/
├── 📄 index.html            # Main application HTML
├── 📄 app.js                # Application initialization & lifecycle
├── 📄 style.css             # Global styles and component styles
├── 📄 tutorial.js           # Interactive tutorial system
├── 📁 assets/               # Images, icons, and static resources
├── 📁 bootstrap/            # Application startup and initialization
├── 📁 components/           # Reusable UI components
├── 📁 events/               # Event handling and IPC communication
├── 📁 state/                # State management and data persistence
├── 📁 ui/                   # UI utilities and drag-and-drop
└── 📁 utils/                # Utility functions and helpers
```

### **DATA STORAGE**
```
📁 boards/                   # Board definitions and configurations
📁 snippets/                 # Prompt snippet library
📁 profiles/                 # Prompt generation profiles
📁 exports/                  # Exported prompts and boards
📁 wildcards/                # Wildcard system for dynamic prompts
```

### **CONFIGURATION & BUILD**
```
📁 scripts/                  # Build and deployment scripts
📁 .github/                  # GitHub Actions and workflows
📁 screenshots/              # Application screenshots
📄 .eslintrc.json           # ESLint configuration
📄 .prettierrc              # Prettier formatting rules
📄 eslint.config.js         # Modern ESLint configuration
```

---

## 🔗 CORE INTERCONNECTIONS

### **MAIN PROCESS → RENDERER PROCESS**
```
main.js (Electron Main)
    ↓ IPC Communication
preload.js (Bridge)
    ↓ Exposed APIs
app.js (Renderer Entry)
    ↓ State Management
AppState (Central State)
    ↓ Component Updates
UI Components (React-like updates)
```

### **DATA FLOW ARCHITECTURE**
```
File System (JSON files)
    ↓
Bootstrap System (loadApplicationState)
    ↓
AppState (Centralized State)
    ↓
Component Rendering (bootstrap.renderSidebar)
    ↓
UI Updates (Event-driven updates)
```

### **COMPONENT DEPENDENCY TREE**
```
AppState (Root)
├── Sidebar Components
│   ├── Folder Tree
│   ├── Snippet List
│   └── Search System
├── Board Components
│   ├── Board Canvas
│   ├── Card System
│   └── Drop Zones
└── Utility Components
    ├── Image Viewer
    ├── Tutorial System
    └── Update Dialog
```

---

## 🎨 UI COMPONENTS

### **CORE COMPONENTS**
| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| **Sidebar** | `src/components/Sidebar/` | Navigation & snippet management | AppState, bootstrap |
| **Board Canvas** | `src/ui/board/` | Main workspace for prompt composition | AppState, dnd.js |
| **Drag & Drop** | `src/ui/dnd.js` | Inter-component interaction system | HTML5 DnD API |
| **Image Viewer** | `src/image-viewer.*` | Image preview and management | File system API |

### **COMPONENT HIERARCHY**
```
App Layout
├── Sidebar (Left)
│   ├── Logo & Version
│   ├── Action Buttons
│   ├── Folder Tree
│   └── Snippet List
├── Main Content
│   ├── Board Selector
│   ├── Board Canvas
│   └── Compiled Prompt
└── Image Viewer (Modal)
```

---

## ⚡ STATE MANAGEMENT

### **APPSTATE STRUCTURE**
```javascript
const AppState = {
  // Data Arrays
  promptFolders: [],        // Folder hierarchy
  prompts: [],              // Snippet collection
  boardFolders: [],         // Board organization
  boards: [],               // Board definitions
  
  // UI State
  activeBoardId: null,      // Currently active board
  currentBoard: null,       // Board object reference
  currentSearchTerm: '',    // Search functionality
  
  // Configuration
  sortConfig: {},           // Sorting preferences
  showCompiledColors: true, // Visual preferences
  showCardColors: true,     // Card styling
  
  // Live Preview
  monitoredFolder: null,    // File watching
  boardBackgroundColor: null // Customization
}
```

### **STATE PERSISTENCE**
- **Primary Storage:** `boards/app-state.json`
- **Legacy Support:** `boards/boards.json`
- **Individual Files:** Each board saved separately
- **Auto-save:** 2-second delay after changes

---

## 🔄 DATA FLOW

### **APPLICATION STARTUP SEQUENCE**
```
1. Electron Main Process (main.js)
   ↓
2. Load HTML (src/index.html)
   ↓
3. Initialize App (src/app.js)
   ↓
4. Bootstrap System (src/bootstrap/)
   ↓
5. Load Application State
   ↓
6. Render UI Components
   ↓
7. Setup Event Listeners
   ↓
8. Application Ready
```

### **DATA MODIFICATION FLOW**
```
User Action (Click/Drag/Drop)
    ↓
Event Handler (src/events/)
    ↓
State Update (AppState)
    ↓
UI Re-render (bootstrap functions)
    ↓
Auto-save (2s delay)
    ↓
File System Update
```

---

## 🐛 DEBUGGING & AUDITING

### **BUILT-IN DEBUGGING FEATURES**
- **Console Logging:** Comprehensive logging throughout
- **Error Boundaries:** Graceful error handling
- **State Inspection:** AppState debugging tools
- **Performance Monitoring:** File operation timing

### **AUDITING SYSTEM**
- **File Operations:** Track all file changes
- **State Changes:** Monitor AppState modifications
- **User Actions:** Log user interactions
- **Performance Metrics:** Track rendering times

### **DEBUGGING COMMANDS**
```bash
# Development mode with DevTools
npm run dev

# Linting and formatting
npm run lint:format

# Build verification
npm run build
```

---

## 🚀 DEVELOPMENT WORKFLOW

### **CURRENT WORKFLOW**
1. **Development:** `npm run dev` (Electron with DevTools)
2. **Testing:** Manual testing in Electron environment
3. **Building:** `npm run build` (Electron Builder)
4. **Distribution:** `npm run dist` (Platform-specific builds)

### **RECOMMENDED ENHANCEMENTS**
1. **Automated Testing:** Jest + Electron testing
2. **CI/CD Pipeline:** GitHub Actions automation
3. **Code Quality:** Pre-commit hooks
4. **Documentation:** Auto-generated API docs

---

## 📚 AI INTEGRATION METADATA

### **CHROMADB TAGS**
```
# Core Application
- promptwaffle
- electron-app
- prompt-management
- ai-tools

# Architecture
- component-based
- event-driven
- state-management
- file-persistence

# Technologies
- javascript
- html-css
- node-js
- electron

# Features
- drag-and-drop
- snippet-library
- board-composition
- wildcard-system
- image-management
```

### **RAG SYSTEM METADATA**
```
# Codebase Understanding
- Main entry: main.js
- UI entry: src/index.html
- State management: src/state/appState.js
- Component system: src/components/
- Event system: src/events/
- Bootstrap: src/bootstrap/

# Key Functions
- loadApplicationState()
- renderSidebar()
- renderBoard()
- setupEventListeners()
- saveApplicationState()

# Data Models
- Snippet: {id, name, content, tags, folderId}
- Board: {id, name, cards, groups, tags}
- Folder: {id, name, parentId, children}
```

### **AI DEVELOPMENT ASSISTANCE**
```
# Code Generation Prompts
- "Create a new component following the existing pattern in src/components/"
- "Add a new feature to the AppState system"
- "Implement drag-and-drop for a new UI element"
- "Create a new bootstrap function for data loading"

# Debugging Prompts
- "Analyze the data flow from user action to file save"
- "Identify potential performance bottlenecks in the rendering system"
- "Check for memory leaks in the event listener system"
- "Verify state consistency across components"

# Architecture Prompts
- "How does the IPC communication work between main and renderer?"
- "Explain the component lifecycle and state updates"
- "Describe the file persistence strategy and error handling"
```

---

## 🔍 QUICK REFERENCE

### **FREQUENTLY USED FILES**
- **Main Entry:** `main.js` (line 1)
- **UI Entry:** `src/index.html` (line 1)
- **App Logic:** `src/app.js` (line 1)
- **State Management:** `src/state/appState.js` (line 1)
- **Bootstrap:** `src/bootstrap/index.js` (line 1)

### **KEY FUNCTIONS**
- **State Loading:** `bootstrap.loadApplicationState()`
- **State Saving:** `bootstrap.saveApplicationState()`
- **UI Rendering:** `bootstrap.renderSidebar()`, `bootstrap.renderBoard()`
- **Event Setup:** `setupEventListeners()`

### **IMPORTANT CONSTANTS**
- **Auto-save Delay:** 2000ms (2 seconds)
- **Default Board BG:** #2F3136
- **Card Colors:** 15 predefined colors
- **File Extensions:** .json, .txt, .md

---

## 📝 MAINTENANCE LOG

| Date | Change | Author | Impact |
|------|--------|--------|---------|
| 2024-12-19 | Created Master Index | AI Assistant | High - New documentation system |
| 2024-12-19 | Documented current architecture | AI Assistant | High - Complete codebase mapping |
| 2024-12-19 | Added AI integration metadata | AI Assistant | High - RAG/ChromaDB support |

---

## 🎯 NEXT STEPS

1. **Immediate:** Review and validate this Master Index
2. **Short-term:** Create detailed sub-branch documentation
3. **Medium-term:** Implement enhanced debugging systems
4. **Long-term:** Expand AI integration capabilities

---

**🔗 Related Documentation:**
- [README.md](./README.md) - User-facing documentation
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Detailed architecture (to be created)
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development guide (to be created)
- [API_REFERENCE.md](./docs/API_REFERENCE.md) - API documentation (to be created)

**📧 Contact:** PromptWaffle Team | **🏷️ Version:** 1.3.1 | **📅 Last Updated:** 2024-12-19

