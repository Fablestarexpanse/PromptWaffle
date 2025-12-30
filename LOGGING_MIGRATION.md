# Logging Migration Guide

## Overview

A production logging system has been implemented to replace console.log statements throughout the codebase. This guide explains how to migrate existing code to use the new logging system.

## New Logger Utility

**Location**: `src/utils/logger.js`

The logger automatically detects the environment:
- **Development mode** (`--dev` flag): Uses `console.log`, `console.error`, etc.
- **Production mode**: Uses `electron-log` for file-based logging

## Usage

### Basic Import

```javascript
import { log, logError, logWarn, logInfo, logDebug } from './utils/logger.js';
```

### Scoped Logger (Recommended)

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('MyComponent');
logger.log('Info message');
logger.error('Error message', error);
logger.warn('Warning message');
```

### Direct Usage

```javascript
import { log, logError } from './utils/logger.js';

log('This is an info message');
logError('This is an error', errorObject);
```

## Migration Examples

### Before (console.log)

```javascript
console.log('[Component] Starting operation...');
console.error('[Component] Error occurred:', error);
console.warn('[Component] Warning:', message);
```

### After (Logger)

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('Component');
logger.log('Starting operation...');
logger.error('Error occurred:', error);
logger.warn('Warning:', message);
```

## Main Process (main.js)

The main process has a logger instance available:

```javascript
// Logger is already set up at the top of main.js
logger.info('[Main] Message');
logger.error('[Main] Error:', error);
```

## Migration Strategy

### Phase 1: Critical Paths (Completed)
- ✅ Main process initialization
- ✅ Error handlers
- ✅ Security utilities

### Phase 2: High-Traffic Areas (Recommended Next)
- IPC handlers
- File operations
- State management

### Phase 3: UI Components (Optional)
- Event handlers
- Component lifecycle
- User interactions

## Benefits

1. **Production Logging**: Logs are saved to files in production
2. **Performance**: Console logging disabled in production builds
3. **Debugging**: Better log organization and filtering
4. **Security**: Sensitive information can be filtered out
5. **Consistency**: Unified logging interface across codebase

## Log Levels

- **log/logInfo**: General information
- **logError**: Errors and exceptions
- **logWarn**: Warnings
- **logDebug**: Debug information (development only)

## Notes

- Debug messages (`logDebug`) are only logged in development mode
- Production logs are written to Electron's log directory
- Console output is disabled in production builds
- All existing console statements continue to work (backward compatible)

## Status

- ✅ Logger utility created
- ✅ Main process logger setup
- ⚠️ Renderer process migration in progress
- 📝 Full migration is optional (console statements still work)

