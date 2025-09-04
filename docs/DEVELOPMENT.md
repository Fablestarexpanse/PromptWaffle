# 🚀 PROMPTWAFLE DEVELOPMENT GUIDE
**Version:** 1.3.1 | **Last Updated:** 2024-12-19 | **Status:** ACTIVE DEVELOPMENT

## 📋 TABLE OF CONTENTS
- [🛠️ DEVELOPMENT SETUP](#️-development-setup)
- [📚 CODING STANDARDS](#-coding-standards)
- [🔧 DEVELOPMENT WORKFLOW](#-development-workflow)
- [🐛 DEBUGGING & TROUBLESHOOTING](#-debugging--troubleshooting)
- [🧪 TESTING STRATEGY](#-testing-strategy)
- [📦 BUILD & DEPLOYMENT](#-build--deployment)
- [🔍 CODE REVIEW PROCESS](#-code-review-process)
- [📝 DOCUMENTATION STANDARDS](#-documentation-standards)
- [🚨 COMMON ISSUES & SOLUTIONS](#-common-issues--solutions)
- [🎯 PERFORMANCE OPTIMIZATION](#-performance-optimization)

---

## 🛠️ DEVELOPMENT SETUP

### **PREREQUISITES**
```bash
# Required software
- Node.js 18.x or higher
- npm 8.x or higher
- Git 2.x or higher
- Code editor (VS Code recommended)

# VS Code Extensions (recommended)
- ESLint
- Prettier
- GitLens
- Auto Rename Tag
- Bracket Pair Colorizer
```

### **INITIAL SETUP**
```bash
# 1. Clone the repository
git clone https://github.com/Fablestarexpanse/PromptWaffle.git
cd PromptWaffle

# 2. Install dependencies
npm install

# 3. Verify installation
npm run lint:format

# 4. Start development mode
npm run dev
```

### **ENVIRONMENT CONFIGURATION**
```bash
# Create .env.local for local development
cp .env.example .env.local

# Configure development settings
NODE_ENV=development
ELECTRON_ENABLE_LOGGING=true
ELECTRON_ENABLE_STACK_DUMPING=true
```

### **DEVELOPMENT TOOLS**
```bash
# Available npm scripts
npm run dev          # Start Electron with DevTools
npm run start        # Start Electron normally
npm run build        # Build for distribution
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run lint:format  # Run both lint and format
```

---

## 📚 CODING STANDARDS

### **JAVASCRIPT STANDARDS**
```javascript
// Use ES6+ features
const { destructuring } = object;
const arrowFunction = () => {};

// Prefer const over let, avoid var
const immutableValue = 'cannot change';
let mutableValue = 'can change';

// Use template literals
const message = `Hello, ${user.name}!`;

// Use async/await over promises
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

### **NAMING CONVENTIONS**
```javascript
// Variables and functions: camelCase
const userName = 'john';
const getUserData = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// Classes: PascalCase
class UserManager {}
class PromptBuilder {}

// Files: kebab-case
// user-manager.js
// prompt-builder.js
```

### **CODE ORGANIZATION**
```javascript
// File structure
// 1. Imports
import { Component } from './component.js';

// 2. Constants
const DEFAULT_CONFIG = {};

// 3. Classes/Functions
class MyClass {
  constructor() {}
  
  // Public methods first
  publicMethod() {}
  
  // Private methods last
  #privateMethod() {}
}

// 4. Exports
export { MyClass };
```

### **COMMENTING STANDARDS**
```javascript
/**
 * Creates a new snippet with the given parameters
 * @param {string} name - The snippet name
 * @param {string} content - The snippet content
 * @param {string[]} tags - Array of tags
 * @returns {Promise<Snippet>} The created snippet
 * @throws {Error} If name or content is empty
 */
async function createSnippet(name, content, tags = []) {
  // Validate inputs
  if (!name || !content) {
    throw new Error('Name and content are required');
  }
  
  // Implementation...
}
```

---

## 🔧 DEVELOPMENT WORKFLOW

### **FEATURE DEVELOPMENT WORKFLOW**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature-name

# 2. Make changes and commit frequently
git add .
git commit -m "feat: add new feature description"

# 3. Push branch and create PR
git push origin feature/new-feature-name

# 4. Create Pull Request on GitHub
# 5. Code review and merge
```

### **COMMIT MESSAGE CONVENTIONS**
```bash
# Format: type(scope): description
feat(snippets): add drag and drop reordering
fix(boards): resolve memory leak in board rendering
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(state): simplify AppState structure
test(components): add unit tests for Sidebar
chore(deps): update electron to v37.4.0
```

### **BRANCH NAMING CONVENTIONS**
```bash
# Feature branches
feature/user-authentication
feature/cloud-sync

# Bug fix branches
fix/memory-leak
fix/crash-on-startup

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-bug

# Release branches
release/v1.4.0
release/v2.0.0
```

### **CODE REVIEW CHECKLIST**
- [ ] Code follows project standards
- [ ] Functions are properly documented
- [ ] Error handling is implemented
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Tests are included (if applicable)
- [ ] Documentation is updated

---

## 🐛 DEBUGGING & TROUBLESHOOTING

### **DEVELOPMENT DEBUGGING**
```javascript
// Console logging levels
console.log('Info message');           // General information
console.warn('Warning message');       // Warnings
console.error('Error message');        // Errors
console.debug('Debug message');        // Debug info (only in dev)

// Performance timing
console.time('operation-name');
// ... operation code ...
console.timeEnd('operation-name');

// Object inspection
console.table(arrayOfObjects);
console.dir(object, { depth: null });
```

### **ELECTRON DEBUGGING**
```javascript
// Main process debugging
console.log('Main process:', process.type);

// Renderer process debugging
console.log('Renderer process:', process.type);

// IPC debugging
ipcRenderer.on('debug-event', (event, data) => {
  console.log('IPC Event:', data);
});

// File system debugging
try {
  const result = await window.electronAPI.readFile(path);
  console.log('File read success:', result);
} catch (error) {
  console.error('File read failed:', error);
}
```

### **COMMON DEBUGGING SCENARIOS**

#### **UI Not Updating**
```javascript
// Check if state change triggered
console.log('State before:', AppState.getPrompts());
AppState.setPrompts(newPrompts);
console.log('State after:', AppState.getPrompts());

// Check if event listeners are attached
console.log('Event listeners:', document.querySelectorAll('[data-action]'));
```

#### **File Operations Failing**
```javascript
// Check file permissions
try {
  const stats = await window.electronAPI.stat(path);
  console.log('File stats:', stats);
} catch (error) {
  console.error('File access error:', error);
}

// Check file content
try {
  const content = await window.electronAPI.readFile(path);
  console.log('File content length:', content.length);
} catch (error) {
  console.error('File read error:', error);
}
```

#### **Performance Issues**
```javascript
// Monitor render performance
let frameCount = 0;
let lastTime = performance.now();

function monitorPerformance() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(monitorPerformance);
}

monitorPerformance();
```

### **DEBUGGING TOOLS**
```bash
# Chrome DevTools (in Electron)
# Press F12 or Ctrl+Shift+I

# Node.js debugging
node --inspect-brk main.js

# Electron debugging
electron --inspect-brk=5858 .

# VS Code debugging
# Use launch.json configuration
```

---

## 🧪 TESTING STRATEGY

### **TESTING PYRAMID**
```
        /\
       /  \     E2E Tests (Few)
      /____\    Integration Tests (Some)
     /      \   Unit Tests (Many)
    /________\
```

### **UNIT TESTING**
```javascript
// Example unit test structure
describe('SnippetManager', () => {
  let snippetManager;
  
  beforeEach(() => {
    snippetManager = new SnippetManager();
  });
  
  afterEach(() => {
    snippetManager = null;
  });
  
  describe('createSnippet', () => {
    it('should create a snippet with valid data', async () => {
      const snippet = await snippetManager.createSnippet({
        name: 'Test Snippet',
        content: 'Test content'
      });
      
      expect(snippet.name).toBe('Test Snippet');
      expect(snippet.content).toBe('Test content');
    });
    
    it('should throw error for invalid data', async () => {
      await expect(
        snippetManager.createSnippet({})
      ).rejects.toThrow('Name and content are required');
    });
  });
});
```

### **INTEGRATION TESTING**
```javascript
// Test component interactions
describe('Sidebar Integration', () => {
  it('should update snippet list when snippet is created', async () => {
    // Setup
    const sidebar = new Sidebar();
    const snippetManager = new SnippetManager();
    
    // Action
    const snippet = await snippetManager.createSnippet({
      name: 'Test',
      content: 'Content'
    });
    
    // Assert
    expect(sidebar.getSnippetCount()).toBe(1);
    expect(sidebar.hasSnippet(snippet.id)).toBe(true);
  });
});
```

### **E2E TESTING**
```javascript
// Test user workflows
describe('Snippet Creation Workflow', () => {
  it('should create snippet through UI', async () => {
    // Navigate to snippets page
    await page.goto('/snippets');
    
    // Click create button
    await page.click('[data-action="create-snippet"]');
    
    // Fill form
    await page.fill('[data-field="name"]', 'Test Snippet');
    await page.fill('[data-field="content"]', 'Test content');
    
    // Submit
    await page.click('[data-action="save-snippet"]');
    
    // Verify
    await expect(page.locator('.snippet-item')).toHaveText('Test Snippet');
  });
});
```

---

## 📦 BUILD & DEPLOYMENT

### **BUILD CONFIGURATION**
```json
{
  "build": {
    "appId": "com.promptwaffle.app",
    "productName": "PromptWaffle",
    "directories": {
      "output": "dist",
      "buildResources": "src/assets"
    },
    "files": [
      "src/**/*",
      "main.js",
      "preload.js",
      "package.json"
    ]
  }
}
```

### **BUILD COMMANDS**
```bash
# Development build
npm run build

# Platform-specific builds
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux

# All platforms
npm run build:all

# Portable build
npm run build:portable
```

### **DEPLOYMENT CHECKLIST**
- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] Documentation is updated
- [ ] Version number is incremented
- [ ] Changelog is updated
- [ ] Build artifacts are generated
- [ ] Release notes are written

---

## 🔍 CODE REVIEW PROCESS

### **REVIEW CRITERIA**
1. **Functionality** - Does the code work as intended?
2. **Code Quality** - Is the code clean and maintainable?
3. **Performance** - Are there performance implications?
4. **Security** - Are there security concerns?
5. **Testing** - Are tests included and adequate?
6. **Documentation** - Is documentation updated?

### **REVIEW COMMENTS**
```javascript
// Good review comment
// Consider using a Map instead of an object for better performance
// when dealing with large numbers of key-value pairs

// Better review comment
// Performance: This object lookup has O(n) complexity. 
// Consider using Map.set() and Map.get() for O(1) access.
// Example: const userMap = new Map(users.map(u => [u.id, u]));

// Actionable feedback
// Please add error handling for the file read operation
// and include a user-friendly error message
```

### **REVIEW WORKFLOW**
```bash
# 1. Create PR
# 2. Request review from team members
# 3. Address feedback and push changes
# 4. Re-request review if needed
# 5. Merge after approval
# 6. Delete feature branch
```

---

## 📝 DOCUMENTATION STANDARDS

### **CODE DOCUMENTATION**
```javascript
/**
 * Manages the lifecycle of prompt snippets
 * 
 * @class SnippetManager
 * @description Handles CRUD operations for prompt snippets including
 * creation, reading, updating, and deletion. Also manages snippet
 * metadata and relationships.
 * 
 * @example
 * const manager = new SnippetManager();
 * const snippet = await manager.createSnippet({
 *   name: 'My Prompt',
 *   content: 'Generate a beautiful landscape'
 * });
 */
class SnippetManager {
  /**
   * Creates a new snippet
   * 
   * @param {Object} snippetData - The snippet data
   * @param {string} snippetData.name - The snippet name
   * @param {string} snippetData.content - The snippet content
   * @param {string[]} [snippetData.tags] - Optional tags
   * @returns {Promise<Snippet>} The created snippet
   * @throws {Error} If required fields are missing
   */
  async createSnippet(snippetData) {
    // Implementation
  }
}
```

### **API DOCUMENTATION**
```javascript
/**
 * @api {post} /api/snippets Create Snippet
 * @apiName CreateSnippet
 * @apiGroup Snippets
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} name Snippet name
 * @apiParam {String} content Snippet content
 * @apiParam {String[]} [tags] Optional tags
 * 
 * @apiSuccess {Object} snippet Created snippet object
 * @apiSuccess {String} snippet.id Unique identifier
 * @apiSuccess {String} snippet.name Snippet name
 * @apiSuccess {String} snippet.content Snippet content
 * @apiSuccess {String[]} snippet.tags Snippet tags
 * @apiSuccess {Date} snippet.createdAt Creation timestamp
 * 
 * @apiError {String} error Error message
 * @apiError {String} error.code Error code
 */
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### **ELECTRON ISSUES**

#### **App Won't Start**
```bash
# Check Node.js version
node --version  # Should be 18.x or higher

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
netstat -an | grep 3000
```

#### **IPC Communication Failing**
```javascript
// Check preload script is loaded
console.log('electronAPI available:', !!window.electronAPI);

// Verify IPC handlers are registered
console.log('IPC handlers:', ipcMain.eventNames());

// Check context isolation
console.log('Context isolated:', process.contextIsolated);
```

#### **File System Access Issues**
```javascript
// Check file permissions
try {
  await fs.access(path, fs.constants.R_OK | fs.constants.W_OK);
  console.log('File access OK');
} catch (error) {
  console.error('File access denied:', error);
}

// Check path validity
const isValidPath = path => {
  try {
    path.resolve(path);
    return true;
  } catch {
    return false;
  }
};
```

### **UI ISSUES**

#### **Components Not Rendering**
```javascript
// Check if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Check for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error);
});

// Check for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

#### **Drag and Drop Not Working**
```javascript
// Check event listeners
console.log('Drag events:', document.querySelectorAll('[draggable="true"]'));

// Verify drop zones
console.log('Drop zones:', document.querySelectorAll('[data-drop-zone]'));

// Check event propagation
element.addEventListener('dragover', (e) => {
  e.preventDefault(); // Required for drop to work
  console.log('Drag over event fired');
});
```

---

## 🎯 PERFORMANCE OPTIMIZATION

### **RENDERING OPTIMIZATIONS**
```javascript
// Use requestAnimationFrame for smooth animations
function smoothScroll(target) {
  const start = window.pageYOffset;
  const distance = target - start;
  const duration = 1000;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, start, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  requestAnimationFrame(animation);
}

// Debounce expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}
```

### **MEMORY OPTIMIZATION**
```javascript
// Clean up event listeners
class Component {
  constructor() {
    this.boundHandlers = new Map();
  }
  
  addEventListener(element, event, handler) {
    const boundHandler = handler.bind(this);
    this.boundHandlers.set(handler, boundHandler);
    element.addEventListener(event, boundHandler);
  }
  
  removeEventListener(element, event, handler) {
    const boundHandler = this.boundHandlers.get(handler);
    if (boundHandler) {
      element.removeEventListener(event, boundHandler);
      this.boundHandlers.delete(handler);
    }
  }
  
  destroy() {
    // Clean up all bound handlers
    this.boundHandlers.clear();
  }
}

// Use WeakMap for object references
const cache = new WeakMap();
function cacheResult(obj, key, result) {
  if (!cache.has(obj)) {
    cache.set(obj, new Map());
  }
  cache.get(obj).set(key, result);
}
```

### **FILE I/O OPTIMIZATION**
```javascript
// Batch file operations
class FileOperationBatcher {
  constructor() {
    this.pendingOperations = new Map();
    this.batchTimeout = null;
  }
  
  scheduleOperation(path, operation, data) {
    this.pendingOperations.set(path, { operation, data });
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, 100); // 100ms batch window
  }
  
  async executeBatch() {
    const operations = Array.from(this.pendingOperations.entries());
    this.pendingOperations.clear();
    
    // Group by operation type
    const reads = operations.filter(([_, op]) => op.operation === 'read');
    const writes = operations.filter(([_, op]) => op.operation === 'write');
    
    // Execute in parallel
    await Promise.all([
      this.batchReads(reads),
      this.batchWrites(writes)
    ]);
  }
}
```

---

## 📊 DEVELOPMENT METRICS

### **CODE QUALITY METRICS**
- **Lines of Code:** ~15,000
- **Cyclomatic Complexity:** Target < 10 per function
- **Code Coverage:** Target > 80%
- **Technical Debt:** Target < 5%

### **PERFORMANCE METRICS**
- **Startup Time:** Target < 2 seconds
- **Memory Usage:** Target < 100MB
- **UI Responsiveness:** Target 60fps
- **File I/O:** Target < 100ms per operation

### **DEVELOPMENT VELOCITY**
- **Features per Sprint:** 3-5
- **Bug Fixes per Sprint:** 5-10
- **Code Review Time:** < 24 hours
- **Deployment Frequency:** Weekly

---

**🔗 Related Documentation:**
- [MASTER_INDEX.md](../MASTER_INDEX.md) - Central navigation hub
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation

**📧 Contact:** PromptWaffle Team | **🏷️ Version:** 1.3.1 | **📅 Last Updated:** 2024-12-19

