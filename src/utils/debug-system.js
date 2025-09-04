/**
 * 🐛 PROMPTWAFLE DEBUG SYSTEM
 * Comprehensive debugging and auditing system for development and production
 * 
 * Features:
 * - Performance monitoring
 * - Error tracking and logging
 * - State change auditing
 * - File operation logging
 * - User action tracking
 * - Memory usage monitoring
 */

class DebugSystem {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.logs = [];
    this.errors = [];
    this.performanceMetrics = {};
    this.stateChanges = [];
    this.fileOperations = [];
    this.userActions = [];
    
    this.maxLogs = 1000;
    this.maxErrors = 100;
    this.maxStateChanges = 500;
    this.maxFileOperations = 200;
    this.maxUserActions = 300;
    
    this.performanceThresholds = {
      renderTime: 16, // 60fps target
      fileOperationTime: 100, // 100ms
      stateUpdateTime: 10 // 10ms
    };
    
    this.init();
  }
  
  init() {
    if (!this.isEnabled) return;
    
    // Setup global error handlers
    this.setupErrorHandlers();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup state change monitoring
    this.setupStateMonitoring();
    
    // Setup file operation monitoring
    this.setupFileOperationMonitoring();
    
    // Setup user action monitoring
    this.setupUserActionMonitoring();
    
    // Setup console overrides
    this.setupConsoleOverrides();
    
    console.log('🔍 Debug System initialized');
  }
  
  // ===== ERROR HANDLING =====
  
  setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
    
    // Electron IPC error handler
    if (window.electronAPI) {
      window.addEventListener('ipc-error', (event) => {
        this.logError('IPC Error', {
          channel: event.channel,
          data: event.data,
          error: event.error
        });
      });
    }
  }
  
  logError(type, details) {
    const error = {
      id: this.generateId(),
      type,
      details,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }
    
    // Log to console in development
    if (this.isEnabled) {
      console.error(`🚨 ${type}:`, details);
    }
    
    // Store in localStorage for persistence
    this.persistErrors();
  }
  
  // ===== PERFORMANCE MONITORING =====
  
  setupPerformanceMonitoring() {
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    
    const monitorFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.performanceMetrics.fps = fps;
        
        if (fps < 30) {
          this.logWarning('Low FPS detected', { fps, threshold: 30 });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(monitorFPS);
    };
    
    monitorFPS();
    
    // Monitor memory usage (if available)
    if (performance.memory) {
      setInterval(() => {
        this.performanceMetrics.memory = {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
        
        if (this.performanceMetrics.memory.used > 100) {
          this.logWarning('High memory usage', this.performanceMetrics.memory);
        }
      }, 5000);
    }
  }
  
  // ===== STATE MONITORING =====
  
  setupStateMonitoring() {
    // Monitor AppState changes
    const originalAppState = window.AppState;
    if (originalAppState) {
      this.wrapAppStateMethods(originalAppState);
    }
  }
  
  wrapAppStateMethods(appState) {
    const methods = ['setPrompts', 'setBoards', 'setPromptFolders', 'setActiveBoardId'];
    
    methods.forEach(method => {
      if (appState[method]) {
        const original = appState[method];
        appState[method] = (...args) => {
          const startTime = performance.now();
          const result = original.apply(appState, args);
          const endTime = performance.now();
          
          this.logStateChange(method, {
            args,
            result,
            executionTime: endTime - startTime,
            timestamp: new Date()
          });
          
          return result;
        };
      }
    });
  }
  
  logStateChange(method, details) {
    const change = {
      id: this.generateId(),
      method,
      details,
      timestamp: new Date()
    };
    
    this.stateChanges.unshift(change);
    if (this.stateChanges.length > this.maxStateChanges) {
      this.stateChanges.pop();
    }
    
    // Check performance threshold
    if (details.executionTime > this.performanceThresholds.stateUpdateTime) {
      this.logWarning('Slow state update', {
        method,
        executionTime: details.executionTime,
        threshold: this.performanceThresholds.stateUpdateTime
      });
    }
  }
  
  // ===== FILE OPERATION MONITORING =====
  
  setupFileOperationMonitoring() {
    if (window.electronAPI) {
      // Wrap file operation methods
      const methods = ['readFile', 'writeFile', 'exists', 'stat', 'readdir'];
      
      methods.forEach(method => {
        if (window.electronAPI[method]) {
          const original = window.electronAPI[method];
          window.electronAPI[method] = async (...args) => {
            const startTime = performance.now();
            
            try {
              const result = await original.apply(window.electronAPI, args);
              const endTime = performance.now();
              
              this.logFileOperation(method, {
                args,
                result,
                executionTime: endTime - startTime,
                success: true,
                timestamp: new Date()
              });
              
              return result;
            } catch (error) {
              const endTime = performance.now();
              
              this.logFileOperation(method, {
                args,
                error: error.message,
                executionTime: endTime - startTime,
                success: false,
                timestamp: new Date()
              });
              
              throw error;
            }
          };
        }
      });
    }
  }
  
  logFileOperation(operation, details) {
    const fileOp = {
      id: this.generateId(),
      operation,
      details,
      timestamp: new Date()
    };
    
    this.fileOperations.unshift(fileOp);
    if (this.fileOperations.length > this.maxFileOperations) {
      this.fileOperations.pop();
    }
    
    // Check performance threshold
    if (details.executionTime > this.performanceThresholds.fileOperationTime) {
      this.logWarning('Slow file operation', {
        operation,
        executionTime: details.executionTime,
        threshold: this.performanceThresholds.fileOperationTime
      });
    }
  }
  
  // ===== USER ACTION MONITORING =====
  
  setupUserActionMonitoring() {
    // Monitor clicks
    document.addEventListener('click', (event) => {
      this.logUserAction('click', {
        target: event.target.tagName,
        className: event.target.className,
        id: event.target.id,
        dataset: event.target.dataset,
        timestamp: new Date()
      });
    });
    
    // Monitor drag and drop
    document.addEventListener('dragstart', (event) => {
      this.logUserAction('dragstart', {
        target: event.target.tagName,
        dataTransfer: event.dataTransfer.types,
        timestamp: new Date()
      });
    });
    
    document.addEventListener('drop', (event) => {
      this.logUserAction('drop', {
        target: event.target.tagName,
        dataTransfer: event.dataTransfer.types,
        timestamp: new Date()
      });
    });
    
    // Monitor keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        this.logUserAction('keyboard_shortcut', {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          timestamp: new Date()
        });
      }
    });
  }
  
  logUserAction(action, details) {
    const userAction = {
      id: this.generateId(),
      action,
      details,
      timestamp: new Date()
    };
    
    this.userActions.unshift(userAction);
    if (this.userActions.length > this.maxUserActions) {
      this.userActions.pop();
    }
  }
  
  // ===== CONSOLE OVERRIDES =====
  
  setupConsoleOverrides() {
    if (!this.isEnabled) return;
    
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      this.log('log', args);
      originalLog.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.log('warn', args);
      originalWarn.apply(console, args);
    };
    
    console.error = (...args) => {
      this.log('error', args);
      originalError.apply(console, args);
    };
  }
  
  log(level, args) {
    const logEntry = {
      id: this.generateId(),
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '),
      timestamp: new Date()
    };
    
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }
  
  // ===== UTILITY METHODS =====
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  logWarning(message, details) {
    console.warn(`⚠️ ${message}:`, details);
  }
  
  // ===== PERSISTENCE =====
  
  persistErrors() {
    try {
      localStorage.setItem('promptwaffle-debug-errors', JSON.stringify(this.errors));
    } catch (error) {
      console.warn('Failed to persist debug errors:', error);
    }
  }
  
  loadPersistedErrors() {
    try {
      const stored = localStorage.getItem('promptwaffle-debug-errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load persisted debug errors:', error);
    }
  }
  
  // ===== DEBUG INTERFACE =====
  
  getDebugInfo() {
    return {
      isEnabled: this.isEnabled,
      logs: this.logs.length,
      errors: this.errors.length,
      stateChanges: this.stateChanges.length,
      fileOperations: this.fileOperations.length,
      userActions: this.userActions.length,
      performanceMetrics: this.performanceMetrics,
      timestamp: new Date()
    };
  }
  
  getErrors() {
    return [...this.errors];
  }
  
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  getStateChanges() {
    return [...this.stateChanges];
  }
  
  getFileOperations() {
    return [...this.fileOperations];
  }
  
  getUserActions() {
    return [...this.userActions];
  }
  
  // ===== CLEANUP =====
  
  clearLogs() {
    this.logs = [];
    this.errors = [];
    this.stateChanges = [];
    this.fileOperations = [];
    this.userActions = [];
    this.performanceMetrics = {};
  }
  
  exportDebugData() {
    return {
      errors: this.errors,
      performanceMetrics: this.performanceMetrics,
      stateChanges: this.stateChanges,
      fileOperations: this.fileOperations,
      userActions: this.userActions,
      exportTimestamp: new Date(),
      version: '1.3.1'
    };
  }
}

// Create global instance
const debugSystem = new DebugSystem();

// Export for use in other modules
export { debugSystem };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.debugSystem = debugSystem;
}

