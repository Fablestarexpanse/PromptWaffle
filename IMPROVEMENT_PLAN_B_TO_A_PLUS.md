# Improvement Plan: B+ to A+ File Handling

## Current Status: B+ (85/100)

**Strengths:**
- Most data is portable
- Good error handling
- Automatic cleanup of invalid references
- Multiple fallback mechanisms

**Weaknesses:**
- Board images use absolute paths (not portable)
- No import/export tool
- No backup verification
- Manual backup process
- No path migration/conversion

---

## Target: A+ (95+/100)

### Key Improvements Needed

1. **Fix Board Image Portability** (Critical - 10 points)
2. **Add Import/Export Tool** (High - 8 points)
3. **Add Backup Verification** (High - 5 points)
4. **Improve Path Handling** (Medium - 3 points)
5. **Enhanced User Experience** (Medium - 2 points)
6. **Better Error Reporting** (Low - 2 points)

**Total Potential Improvement: +30 points → 115/100 (A+)**

---

## 1. Fix Board Image Portability 🔴 CRITICAL

### Current Problem
Board images use absolute paths from file picker, breaking on new installs.

### Solution: Copy Images to App Directory

**Implementation:**
- When user adds board image, copy it to `snippets/boards/images/{boardId}/`
- Store relative path in board JSON
- Handle image deletion when board/image is deleted

**Benefits:**
- ✅ Full portability (images travel with backup)
- ✅ Consistent with character image handling
- ✅ No external dependencies

**Code Changes:**

1. **Add IPC handler for board image saving** (`main.js`):
```javascript
ipcMain.handle('save-board-image', async (event, boardId, imageBuffer, filename) => {
  const imagesDir = path.join(__dirname, 'snippets', 'boards', 'images', boardId);
  await fs.mkdir(imagesDir, { recursive: true });
  const fullPath = path.join(imagesDir, filename);
  await fs.writeFile(fullPath, Buffer.from(imageBuffer));
  return { success: true, relativePath: `snippets/boards/images/${boardId}/${filename}` };
});
```

2. **Update image upload handler** (`src/bootstrap/ui.js`):
```javascript
// Instead of storing absolute path, copy image and store relative path
for (const filePath of result.filePaths) {
  // Read image file
  const imageBuffer = await window.electronAPI.loadImageFile(filePath);
  const filename = filePath.split(/[/\\]/).pop();
  const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Copy to app directory
  const result = await window.electronAPI.saveBoardImage(
    activeBoard.id, 
    imageBuffer, 
    `${imageId}_${filename}`
  );
  
  const imageObj = {
    id: imageId,
    filename: filename,
    path: result.relativePath, // Now relative!
    addedAt: new Date().toISOString()
  };
  activeBoard.images.push(imageObj);
}
```

3. **Update image loading** (`src/bootstrap/ui.js`):
```javascript
// Handle both absolute (legacy) and relative (new) paths
let imageSrc = '';
if (imageObj.path.startsWith('snippets/')) {
  // Relative path - construct full path
  const fullPath = path.join(__dirname, imageObj.path);
  imageSrc = `file://${fullPath}`;
} else {
  // Absolute path (legacy) - use as-is
  imageSrc = `file://${imageObj.path}`;
}
```

**Migration:**
- On startup, detect absolute paths in board images
- Offer to migrate: "Migrate board images to app directory for better portability?"
- Copy images and update paths

**Estimated Effort:** 4-6 hours
**Priority:** CRITICAL
**Impact:** +10 points

---

## 2. Add Import/Export Tool 🟡 HIGH

### Current Problem
Users must manually copy folders - error-prone and confusing.

### Solution: Built-in Export/Import

**Features:**

#### Export Tool
- Button in settings: "Export All Data"
- Creates single ZIP archive with:
  - `snippets/` folder
  - `boards/` folder
  - `profiles/` folder (if exists)
  - `wildcards/` folder (if exists)
  - `export_manifest.json` (metadata, version, timestamp)
- Saves to user-selected location
- Shows progress and completion

#### Import Tool
- Button in settings: "Import Data"
- Select ZIP file
- Validates archive structure
- Shows preview of what will be imported
- Option to merge or replace
- Backup current data before import
- Shows progress and completion

**Implementation:**

1. **Add export function** (`src/utils/export-import.js`):
```javascript
export async function exportAllData() {
  const { dialog } = require('electron').remote;
  const result = await dialog.showSaveDialog({
    title: 'Export PromptWaffle Data',
    defaultPath: `PromptWaffle_Backup_${new Date().toISOString().split('T')[0]}.zip`,
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
  });
  
  if (result.canceled) return;
  
  // Create ZIP with all data folders
  // Show progress
  // Return success
}
```

2. **Add import function**:
```javascript
export async function importData() {
  const { dialog } = require('electron').remote;
  const result = await dialog.showOpenDialog({
    title: 'Import PromptWaffle Data',
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
  });
  
  if (result.canceled) return;
  
  // Extract ZIP
  // Validate structure
  // Show preview
  // Backup current data
  // Import new data
  // Restart or reload
}
```

3. **Add UI buttons** (`src/index.html`):
```html
<!-- In settings or main menu -->
<button id="exportDataBtn">Export All Data</button>
<button id="importDataBtn">Import Data</button>
```

**Dependencies:**
- Need ZIP library: `adm-zip` or `jszip` + `node-stream-zip`
- Add to `package.json`

**Estimated Effort:** 8-12 hours
**Priority:** HIGH
**Impact:** +8 points

---

## 3. Add Backup Verification 🟡 HIGH

### Current Problem
No way to verify backup is complete and valid before restore.

### Solution: Backup Verification Tool

**Features:**
- Verify all required files exist
- Check file integrity (valid JSON, readable)
- Report missing files
- Check for orphaned references
- Generate verification report

**Implementation:**

1. **Add verification function** (`src/utils/backup-verifier.js`):
```javascript
export async function verifyBackup(backupPath) {
  const issues = [];
  const warnings = [];
  
  // Check required folders
  const requiredFolders = ['snippets', 'boards'];
  for (const folder of requiredFolders) {
    if (!await folderExists(`${backupPath}/${folder}`)) {
      issues.push(`Missing required folder: ${folder}`);
    }
  }
  
  // Verify snippets structure
  const snippets = await scanSnippetsFolder(`${backupPath}/snippets`);
  for (const snippet of snippets) {
    if (!await isValidJson(snippet.path)) {
      issues.push(`Invalid snippet: ${snippet.path}`);
    }
  }
  
  // Verify boards
  const boards = await scanBoards(`${backupPath}/boards`);
  // Check for orphaned card references
  // Check for missing images
  
  // Generate report
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: {
      snippets: snippets.length,
      boards: boards.length,
      characters: countCharacters(snippets)
    }
  };
}
```

2. **Add UI for verification**:
- "Verify Backup" button
- Shows report with issues/warnings
- Color-coded (green/yellow/red)
- Export report option

**Estimated Effort:** 4-6 hours
**Priority:** HIGH
**Impact:** +5 points

---

## 4. Improve Path Handling 🟢 MEDIUM

### Current Problem
Some paths are absolute, some relative - inconsistent.

### Solution: Path Normalization & Migration

**Features:**
- Detect absolute paths on startup
- Offer to convert to relative where possible
- Store path type metadata
- Better path resolution

**Implementation:**

1. **Path normalization utility** (`src/utils/path-utils.js`):
```javascript
export function normalizePath(filePath, baseDir) {
  if (path.isAbsolute(filePath)) {
    // Try to make relative to app directory
    const relative = path.relative(baseDir, filePath);
    if (!relative.startsWith('..')) {
      return relative.replace(/\\/g, '/');
    }
  }
  return filePath.replace(/\\/g, '/');
}

export function resolvePath(filePath, baseDir) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.join(baseDir, filePath);
}
```

2. **Migration on startup**:
- Scan all boards for absolute paths
- If path is outside app directory, keep absolute
- If path is inside app directory, convert to relative
- Update board files

**Estimated Effort:** 3-4 hours
**Priority:** MEDIUM
**Impact:** +3 points

---

## 5. Enhanced User Experience 🟢 MEDIUM

### Improvements

#### A. Backup Reminder
- Periodic reminder to backup (weekly/monthly)
- "Last backup: X days ago" indicator
- One-click backup button

#### B. Backup Status Indicator
- Show backup status in UI
- "Data backed up" / "Backup recommended"
- Link to backup guide

#### C. Automatic Backup Suggestions
- Suggest backup before major operations
- Suggest backup before app updates
- Suggest backup on first launch

#### D. Better Error Messages
- Clear messages when files are missing
- Suggestions for fixing issues
- Links to documentation

**Implementation:**

1. **Add backup reminder** (`src/utils/backup-reminder.js`):
```javascript
export function checkBackupStatus() {
  const lastBackup = localStorage.getItem('lastBackupDate');
  if (!lastBackup) {
    showBackupReminder('You haven\'t backed up your data yet.');
    return;
  }
  
  const daysSince = (Date.now() - parseInt(lastBackup)) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) {
    showBackupReminder(`Last backup: ${Math.floor(daysSince)} days ago`);
  }
}
```

2. **Add UI indicators**:
- Status bar or sidebar indicator
- Backup button with last backup date
- Reminder modal (dismissible)

**Estimated Effort:** 3-4 hours
**Priority:** MEDIUM
**Impact:** +2 points

---

## 6. Better Error Reporting 🟢 LOW

### Improvements

#### A. Detailed Error Logs
- Log all file operations
- Log missing file attempts
- Log path resolution issues

#### B. User-Friendly Error Messages
- Convert technical errors to user-friendly messages
- Provide actionable solutions
- Link to help documentation

#### C. Error Recovery
- Automatic recovery where possible
- Manual recovery options
- Data integrity reports

**Estimated Effort:** 2-3 hours
**Priority:** LOW
**Impact:** +2 points

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ Fix Board Image Portability
   - Copy images to app directory
   - Update path handling
   - Migration tool for existing images

### Phase 2: High Priority (Week 2-3)
2. ✅ Add Import/Export Tool
   - Export to ZIP
   - Import from ZIP
   - Validation and preview

3. ✅ Add Backup Verification
   - Verification function
   - UI for verification
   - Report generation

### Phase 3: Polish (Week 4)
4. ✅ Improve Path Handling
   - Path normalization
   - Migration on startup

5. ✅ Enhanced User Experience
   - Backup reminders
   - Status indicators

6. ✅ Better Error Reporting
   - Detailed logs
   - User-friendly messages

---

## Testing Checklist

### Board Image Portability
- [ ] Add board image → verify copied to app directory
- [ ] Restore backup → verify images load
- [ ] Migrate existing absolute paths → verify conversion
- [ ] Delete board → verify images deleted

### Import/Export
- [ ] Export all data → verify ZIP created
- [ ] Import ZIP → verify all data restored
- [ ] Import with conflicts → verify merge/replace options
- [ ] Import invalid ZIP → verify error handling

### Backup Verification
- [ ] Verify complete backup → all green
- [ ] Verify incomplete backup → shows issues
- [ ] Verify corrupted backup → shows errors
- [ ] Export verification report

### Path Handling
- [ ] Absolute paths converted to relative
- [ ] External paths remain absolute
- [ ] Path resolution works correctly
- [ ] Migration doesn't break existing data

---

## Success Metrics

### Before (B+):
- Manual backup process
- Board images not portable
- No verification
- Some absolute paths

### After (A+):
- ✅ One-click export/import
- ✅ All images portable
- ✅ Backup verification
- ✅ Consistent path handling
- ✅ User-friendly experience
- ✅ Better error reporting

**Target Score: 95+/100 (A+)**

---

## Estimated Total Effort

- **Phase 1 (Critical):** 4-6 hours
- **Phase 2 (High):** 12-18 hours
- **Phase 3 (Polish):** 8-11 hours
- **Testing:** 4-6 hours

**Total: 28-41 hours**

---

## Dependencies

### New Packages Needed:
```json
{
  "dependencies": {
    "adm-zip": "^0.5.10",  // For ZIP creation/extraction
    "path": "^0.12.7"      // Better path handling (if needed)
  }
}
```

### Code Changes:
- `main.js` - Add board image IPC handler
- `src/bootstrap/ui.js` - Update image upload
- `src/utils/export-import.js` - New file
- `src/utils/backup-verifier.js` - New file
- `src/utils/path-utils.js` - New file
- `src/index.html` - Add UI buttons
- `src/events/eventListeners.js` - Add event handlers

---

## Risk Assessment

### Low Risk:
- Path normalization (well-tested pattern)
- Backup verification (read-only operations)
- UI improvements (non-breaking)

### Medium Risk:
- Board image migration (data transformation)
- Import/export (file operations)

### Mitigation:
- Thorough testing before release
- Backup before migration
- Rollback capability
- User confirmation for destructive operations

---

## Conclusion

With these improvements, the file handling system will achieve **A+ rating**:

✅ **Full Portability** - All data portable, including images  
✅ **User-Friendly** - One-click backup/restore  
✅ **Reliable** - Verification and error handling  
✅ **Professional** - Polished user experience  

**Target: 95+/100 (A+)**

