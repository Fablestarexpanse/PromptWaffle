# File Handling & Data Portability Audit
**Date:** December 2025  
**Version:** 1.5.1  
**Purpose:** Ensure user data can be easily backed up and restored on fresh installs

---

## Executive Summary

The file handling system is **mostly portable** but has several areas that need attention to ensure seamless data restoration on fresh installs. The main concerns are:

1. ✅ **Snippets**: Fully portable (relative paths, folder structure preserved)
2. ✅ **Boards**: Mostly portable (saved in multiple locations)
3. ⚠️ **Character Images**: Paths stored but may break on new install
4. ⚠️ **Board Images**: Paths may be absolute or relative
5. ⚠️ **Settings**: Saved but may reference old paths
6. ⚠️ **Monitored Folder**: Absolute path stored (not portable)

**Overall Assessment:** **GOOD** with **recommended improvements**

---

## 1. Data Storage Structure

### Current File Organization

```
PromptWaffle/
├── snippets/                    # User snippets and boards
│   ├── Start Here/             # Default snippets
│   │   ├── default_board.json
│   │   ├── default_*.json
│   │   └── README.md
│   ├── characters/             # Character data
│   │   ├── *.json              # Character definitions
│   │   └── images/             # Character images
│   │       └── {characterId}_*.{ext}
│   ├── {folders}/              # User-created folders
│   │   └── {snippets}.json     # Snippet files
│   └── {boards}.json           # Board files (can be in any folder)
│
├── boards/                      # Board state files
│   ├── boards.json             # Legacy: All boards array
│   └── app-state.json          # Complete application state
│
├── profiles/                    # Wildcard Studio profiles
│   └── *.json
│
└── wildcards/                   # Wildcard Studio categories
    └── {category}/
        └── *.txt
```

---

## 2. Data Portability Analysis

### ✅ **Snippets** - FULLY PORTABLE

**Storage:**
- Location: `snippets/` folder structure
- Format: JSON files (`.json`) or text files (`.txt` - migrated to JSON)
- Paths: Relative paths (e.g., `snippets/Start Here/default_photorealistic.json`)

**Portability:**
- ✅ Folder structure is preserved
- ✅ Relative paths work on any install location
- ✅ All snippet data is self-contained in JSON files
- ✅ Text snippets are automatically migrated to JSON

**Restoration:**
- ✅ Simply copy `snippets/` folder to new install
- ✅ Application automatically discovers all snippets via `buildSidebarTree()`
- ✅ No path adjustments needed

**Code References:**
- `main.js:667-769` - `buildSidebarTree()` recursively loads all files
- `src/bootstrap/load-initial-data.js:255-318` - Loads snippets on startup
- `src/utils/utils.js:162-204` - `loadSnippetsFromFiles()` loads from disk

---

### ✅ **Boards** - MOSTLY PORTABLE

**Storage:**
- **Primary**: Individual board files in `snippets/` folder structure
  - Path: `snippets/{folder}/{board}.json`
  - Contains: `id`, `name`, `tags`, `cards`, `groups`, `images`, `createdAt`, `modifiedAt`
- **Secondary**: `boards/boards.json` (legacy, all boards array)
- **Tertiary**: `boards/app-state.json` (complete application state including boards)

**Portability:**
- ✅ Board files in `snippets/` folder are portable
- ✅ Board data is self-contained
- ⚠️ Cards reference snippets via `snippetPath` (relative paths - should work)
- ⚠️ Board images may have absolute paths (see Board Images section)

**Restoration:**
- ✅ Copy `snippets/` folder (includes board files)
- ✅ Copy `boards/` folder for app state
- ⚠️ May need to verify snippet paths in cards still resolve

**Code References:**
- `src/bootstrap/state.js:191-221` - Saves boards to individual files
- `src/bootstrap/state.js:234-387` - Loads boards from files
- `main.js:711-727` - Detects board files in sidebar tree

**Issues Found:**
1. **Duplicate Storage**: Boards saved in 3 places (individual files, boards.json, app-state.json)
   - **Impact**: Medium - Can cause confusion, but provides redundancy
   - **Recommendation**: Document which is authoritative (individual files)

2. **Card Snippet Paths**: Cards store `snippetPath` as relative path
   - **Example**: `"snippetPath": "snippets/Start Here/default_photorealistic.json"`
   - **Status**: ✅ Should work if folder structure is preserved
   - **Risk**: If snippet is moved/deleted, card becomes orphaned

---

### ⚠️ **Character Data** - PORTABLE WITH CAVEATS

**Storage:**
- Location: `snippets/characters/*.json`
- Format: JSON files with character data
- Image References: `imagePath1`, `imagePath2` stored as relative paths

**Portability:**
- ✅ Character JSON files are portable
- ✅ Image paths are relative: `snippets/characters/images/{characterId}_*.{ext}`
- ✅ Character data includes all attributes (name, gender, age, etc.)

**Restoration:**
- ✅ Copy `snippets/characters/` folder (includes JSON files)
- ✅ Copy `snippets/characters/images/` folder (includes image files)
- ⚠️ Must preserve folder structure exactly

**Code References:**
- `src/utils/characterBuilder.js:784-827` - Saves character with image paths
- `main.js:444-468` - Saves character images to `snippets/characters/images/`
- `main.js:677-680` - Skips `images/` folder in sidebar tree (correct)

**Issues Found:**
1. **Image Path Resolution**: Character images use relative paths
   - **Status**: ✅ Should work if folder structure preserved
   - **Risk**: If images folder is missing, images won't load (graceful degradation)

2. **Character Detection**: Characters detected as snippets in sidebar
   - **Status**: ✅ Works correctly
   - **Note**: Characters appear as special snippets with unique styling

---

### ⚠️ **Character Images** - PORTABLE BUT VERIFY

**Storage:**
- Location: `snippets/characters/images/{characterId}_{1|2}.{ext}`
- Format: Binary image files (PNG, JPG, etc.)
- Naming: `{characterId}_1.{ext}`, `{characterId}_2.{ext}`

**Portability:**
- ✅ Images are stored in relative path structure
- ✅ Filenames include character ID for matching
- ⚠️ Must preserve exact folder structure: `snippets/characters/images/`

**Restoration:**
- ✅ Copy entire `snippets/characters/images/` folder
- ⚠️ Verify character JSON files reference correct image paths
- ⚠️ Image paths in character JSON: `snippets/characters/images/{filename}`

**Code References:**
- `main.js:444-468` - `save-image` handler saves to `snippets/characters/images/`
- `src/utils/characterBuilder.js:810,825` - Sets `imagePath1` and `imagePath2` in character data
- `src/utils/characterDisplay.js:88-104` - Loads character images using stored paths

**Potential Issues:**
1. **Missing Images**: If images folder is not copied, images won't load
   - **Impact**: Low - App handles gracefully, shows character without images
   - **Mitigation**: Document backup requirements

2. **Path Mismatch**: If character JSON has wrong path, images won't load
   - **Impact**: Low - App handles gracefully
   - **Mitigation**: Paths are relative, should work if structure preserved

---

### 🔴 **Board Images** - NOT PORTABLE (ABSOLUTE PATHS)

**Storage:**
- Location: Stored in board JSON as `images` array
- Format: Each image has `id`, `filename`, `path`, `addedAt`
- Path Type: **ABSOLUTE PATHS** (from file picker dialog)

**Portability:**
- 🔴 **CRITICAL ISSUE**: Paths are absolute (e.g., `F:\ComfyUI\output\image.png`)
- 🔴 Will break on new install if images are not in same location
- 🔴 Images are NOT copied to app directory - they remain in original location

**Code References:**
- `src/bootstrap/ui.js:204-213` - Stores absolute path from file picker
- `src/bootstrap/ui.js:139-159` - `validateAndCleanupImages()` validates paths exist
- `src/bootstrap/ui.js:250` - Uses `file://` protocol with absolute path

**Issues Found:**
1. **Absolute Paths**: Board images use absolute paths from file picker
   - **Example**: `"path": "F:\\ComfyUI\\output\\image.png"`
   - **Priority**: HIGH
   - **Impact**: Images won't load on new install if path doesn't exist
   - **Current Mitigation**: ✅ `validateAndCleanupImages()` removes invalid paths on startup
   - **Recommendation**: 
     - Option A: Copy images to app directory (e.g., `snippets/boards/images/`)
     - Option B: Store relative path if image is in app directory
     - Option C: Keep absolute but improve validation/error handling

2. **Images Not Copied**: Board images remain in original location
   - **Impact**: User must manually copy images or they won't load
   - **Recommendation**: Copy images to app directory for portability

---

### ⚠️ **Application Settings** - MOSTLY PORTABLE

**Storage:**
- Location: `boards/app-state.json`
- Contains:
  - `settings`: Sort config, color toggles, autosave, monitored folder, board background color
  - `uiState`: Expanded folders, current board, search term, compiled prompt state
  - `tutorial`: Tutorial completion state
  - `performance`: Performance settings

**Portability:**
- ✅ Most settings are portable (sort config, colors, etc.)
- ⚠️ **Monitored Folder**: Stored as absolute path (NOT portable)
- ✅ UI state is portable (folder expansion, search terms)
- ✅ Tutorial state is portable

**Issues Found:**
1. **Monitored Folder Path**: Stored as absolute path
   - **Example**: `"monitoredFolder": "F:\\ComfyUI\\output"`
   - **Impact**: HIGH - Will break on new install if folder doesn't exist
   - **Recommendation**: 
     - Option A: Clear on restore (user re-selects)
     - Option B: Store relative to app directory if possible
     - Option C: Validate and clear if path doesn't exist

**Code References:**
- `src/bootstrap/state.js:67-108` - `captureApplicationState()` saves settings
- `src/bootstrap/state.js:389-413` - `restoreApplicationState()` restores settings
- `src/app.js:80-99` - Validates monitored folder on startup (good!)

---

### ✅ **Wildcard Studio Data** - FULLY PORTABLE

**Storage:**
- Profiles: `profiles/*.json`
- Wildcards: `wildcards/{category}/*.txt`

**Portability:**
- ✅ All relative paths
- ✅ Self-contained files
- ✅ No external dependencies

**Restoration:**
- ✅ Copy `profiles/` folder
- ✅ Copy `wildcards/` folder
- ✅ No path adjustments needed

---

## 3. Critical Issues for Fresh Install

### 🔴 **HIGH PRIORITY**

#### 1. Board Image Paths - ABSOLUTE PATHS (NOT PORTABLE)
**Issue**: Board images use absolute paths from file picker, not portable  
**Impact**: Images won't load on new install if path doesn't exist  
**Current Status**: 
- ✅ `validateAndCleanupImages()` removes invalid paths on startup
- ⚠️ Images are not copied to app directory
- ⚠️ User must manually ensure images exist at same path

**Action Required**: 
- **Option A (Recommended)**: Copy images to app directory on upload
  - Store in `snippets/boards/images/{boardId}/` or similar
  - Update path to relative path
  - Ensures full portability
- **Option B**: Improve user guidance
  - Document that board images must be manually copied
  - Add warning when adding images about portability
  - Provide export tool that includes images

#### 2. Monitored Folder Path
**Issue**: Stored as absolute path, breaks on new install  
**Impact**: Live preview feature won't work  
**Current Mitigation**: ✅ Code validates and clears invalid paths (`src/app.js:80-99`)  
**Recommendation**: Consider storing relative path or user-friendly identifier

### 🟡 **MEDIUM PRIORITY**

#### 3. Duplicate Board Storage
**Issue**: Boards saved in 3 locations (individual files, boards.json, app-state.json)  
**Impact**: Confusion about which is authoritative, potential data inconsistency  
**Recommendation**: Document authoritative source (individual files in snippets/)

#### 4. Orphaned Card References
**Issue**: Cards reference snippets via `snippetPath`, may break if snippet moved/deleted  
**Impact**: Cards show but snippet content missing  
**Current Mitigation**: ✅ `cleanupOrphanedCards()` function exists  
**Status**: Handled, but should verify on restore

### 🟢 **LOW PRIORITY**

#### 5. Character Image Paths
**Issue**: Relative paths should work, but need verification  
**Impact**: Low - graceful degradation if images missing  
**Status**: Should work if folder structure preserved

#### 6. Default Board Creation
**Issue**: Creates default board if none exist  
**Impact**: Low - helpful for new users  
**Status**: ✅ Working correctly

---

## 4. Restoration Process Analysis

### Current Restoration Flow

1. **Application Startup** (`src/app.js:init()`)
   - Loads application state from `boards/app-state.json`
   - Falls back to `boards/boards.json` (legacy)
   - Validates and merges with defaults

2. **Initial Data Loading** (`src/bootstrap/load-initial-data.js`)
   - Builds sidebar tree from `snippets/` folder
   - Loads all snippets from files
   - Migrates text snippets to JSON
   - Populates snippet cache

3. **Board Loading** (`src/bootstrap/state.js:loadApplicationState()`)
   - Loads from `boards/app-state.json`
   - Falls back to `boards/boards.json`
   - Also discovers boards in `snippets/` folder via sidebar tree
   - Validates board data
   - Creates default board if none exist

4. **State Restoration** (`src/bootstrap/state.js:restoreApplicationState()`)
   - Restores boards to AppState
   - Restores settings
   - Restores UI state
   - Validates monitored folder path

### Restoration Strengths ✅

1. **Multiple Fallbacks**: Tries app-state.json → boards.json → defaults
2. **Automatic Discovery**: Discovers boards and snippets from file system
3. **Validation**: Validates data and uses safe defaults if invalid
4. **Migration**: Automatically migrates text snippets to JSON
5. **Orphaned Card Cleanup**: Removes cards with missing snippets
6. **Path Validation**: Validates monitored folder path on startup

### Restoration Weaknesses ⚠️

1. **No Import/Export Tool**: Users must manually copy folders
2. **No Path Migration**: Absolute paths not converted to relative
3. **No Backup Verification**: No check that all required files exist
4. **Silent Failures**: Missing images fail silently (graceful but user may not notice)

---

## 5. Recommendations

### Immediate Actions

1. **Audit Board Image Paths** (HIGH)
   - Check actual saved board JSON files
   - Verify if paths are absolute or relative
   - Update code to use relative paths if needed

2. **Document Backup Process** (HIGH)
   - Create user guide for backing up data
   - List all folders that need to be copied
   - Provide step-by-step restoration instructions

3. **Add Path Validation** (MEDIUM)
   - Validate all image paths on startup
   - Clear invalid paths with user notification
   - Log missing files for debugging

### Short-term Improvements

4. **Create Import/Export Tool** (MEDIUM)
   - Add "Export All Data" button
   - Creates single archive with all user data
   - Add "Import Data" button for easy restoration

5. **Improve Monitored Folder Handling** (MEDIUM)
   - Store folder name/identifier instead of absolute path
   - Prompt user to reselect on restore if path invalid
   - Add "Remember this folder" option

6. **Add Data Integrity Check** (LOW)
   - Verify all referenced files exist on startup
   - Report missing files to user
   - Offer to clean up orphaned references

### Long-term Enhancements

7. **Version Migration System** (LOW)
   - Detect data format version
   - Automatically migrate old formats
   - Preserve backward compatibility

8. **Cloud Backup Integration** (FUTURE)
   - Optional cloud backup
   - Automatic sync
   - Cross-device access

---

## 6. Backup Checklist for Users

### Required Folders to Backup:
- ✅ `snippets/` - All snippets, boards, characters, and character images
- ✅ `boards/` - Application state and settings
- ✅ `profiles/` - Wildcard Studio profiles (optional)
- ✅ `wildcards/` - Wildcard Studio categories (optional)

### Folders NOT Needed:
- ❌ `node_modules/` - Dependencies (reinstalled)
- ❌ `dist/` - Build artifacts
- ❌ `.git/` - Version control (if using git)

### Restoration Steps:
1. Install PromptWaffle fresh
2. Copy backed-up folders to new installation directory
3. Launch application
4. Verify all data loaded correctly
5. Re-select monitored folder if needed (if path changed)

---

## 7. Code Quality Assessment

### Strengths ✅
- Good separation of concerns
- Multiple fallback mechanisms
- Data validation on load
- Graceful error handling
- Automatic migration support

### Areas for Improvement ⚠️
- Some absolute paths (monitored folder)
- Duplicate storage locations (boards)
- Missing import/export tools
- No backup verification

---

## 8. Testing Recommendations

### Test Scenarios:
1. **Fresh Install with Backup**
   - Copy `snippets/` and `boards/` folders
   - Verify all snippets load
   - Verify all boards load
   - Verify character images load
   - Verify board images load (if applicable)

2. **Partial Backup**
   - Copy only `snippets/` folder
   - Verify app handles missing `boards/` gracefully
   - Verify default board created

3. **Broken Paths**
   - Modify board JSON to have invalid snippet path
   - Verify orphaned card cleanup works
   - Verify app doesn't crash

4. **Missing Images**
   - Remove character images folder
   - Verify app handles gracefully
   - Verify characters still load (without images)

---

## 9. Conclusion

The file handling system is **mostly portable** and **well-designed** for data restoration. The main concerns are:

1. **Board image paths** need verification (absolute vs relative)
2. **Monitored folder** uses absolute path (but validated on startup)
3. **No import/export tool** for easy backup/restore

**Overall Grade: B+ (Good with room for improvement)**

The system handles most edge cases gracefully and provides multiple fallback mechanisms. With the recommended improvements, it would be excellent for data portability.

---

**Next Steps:**
1. Audit actual board JSON files for image path format
2. Create user documentation for backup/restore
3. Consider adding import/export functionality
4. Test full backup/restore scenario

