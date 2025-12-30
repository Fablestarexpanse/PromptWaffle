# PromptWaffle Backup & Restore Guide

## Overview

This guide explains how to backup and restore your PromptWaffle data for fresh installs or system migrations.

---

## What Gets Backed Up

### ✅ **Fully Portable Data**

These folders contain all data needed for a complete restore:

1. **`snippets/`** - Contains:
   - All your snippets (JSON files)
   - All your boards (JSON files in folder structure)
   - All character data (JSON files in `characters/` subfolder)
   - All character images (in `characters/images/` subfolder)
   - Your folder organization structure

2. **`boards/`** - Contains:
   - Application state (`app-state.json`)
   - Board index (`boards.json` - legacy)
   - Settings (sort preferences, color toggles, etc.)
   - UI state (expanded folders, current board, etc.)

3. **`profiles/`** (Optional) - Wildcard Studio profiles

4. **`wildcards/`** (Optional) - Wildcard Studio categories

### ⚠️ **Partially Portable Data**

- **Board Reference Images**: Stored with absolute paths
  - If images are in external folders (e.g., `F:\ComfyUI\output\`), they won't work on new install
  - **Solution**: Copy images to a location that will exist on new system, or use images in app directory
  - **Note**: App will automatically remove invalid image references on startup

- **Monitored Folder**: Stored as absolute path
  - Will be cleared automatically if path doesn't exist on new install
  - You'll need to re-select the folder after restore

---

## Backup Process

### Step 1: Locate Your PromptWaffle Directory

The location depends on how you installed:

- **Source Installation**: Where you cloned/downloaded the repository
- **Portable Build**: Where you extracted the portable version
- **Installed Version**: Check installation directory

### Step 2: Copy Required Folders

Copy these folders to your backup location:

```
PromptWaffle/
├── snippets/          ← COPY THIS (Required)
├── boards/            ← COPY THIS (Required)
├── profiles/          ← COPY THIS (Optional - Wildcard Studio)
└── wildcards/         ← COPY THIS (Optional - Wildcard Studio)
```

### Step 3: Verify Backup

Check that your backup includes:
- ✅ `snippets/` folder with all subfolders
- ✅ `snippets/characters/` folder (if you have characters)
- ✅ `snippets/characters/images/` folder (if you have character images)
- ✅ `boards/` folder with `app-state.json` and/or `boards.json`

### Step 4: Test Backup (Optional but Recommended)

1. Create a test folder
2. Copy your backup there
3. Install fresh PromptWaffle in test location
4. Copy backup folders to test installation
5. Launch and verify all data loads correctly

---

## Restore Process

### Step 1: Fresh Install

Install PromptWaffle in your new location (or reinstall in same location).

### Step 2: Stop the Application

Make sure PromptWaffle is not running.

### Step 3: Copy Backup Folders

Copy your backed-up folders to the new PromptWaffle installation directory:

```
New PromptWaffle Installation/
├── snippets/          ← PASTE YOUR BACKUP HERE
├── boards/            ← PASTE YOUR BACKUP HERE
├── profiles/          ← PASTE YOUR BACKUP HERE (if backed up)
└── wildcards/         ← PASTE YOUR BACKUP HERE (if backed up)
```

**Important**: 
- Replace the existing folders (or merge if you want to keep defaults)
- Preserve the folder structure exactly as it was

### Step 4: Launch Application

Start PromptWaffle. The application will:
- ✅ Automatically discover all snippets
- ✅ Automatically discover all boards
- ✅ Load application state and settings
- ✅ Validate and clean up any invalid references
- ⚠️ Remove invalid board image references (if paths don't exist)
- ⚠️ Clear monitored folder if path doesn't exist

### Step 5: Verify Restore

Check the following:

1. **Snippets**: All snippets appear in sidebar
2. **Boards**: All boards appear in board selector
3. **Characters**: Character library shows all characters
4. **Character Images**: Character images load correctly
5. **Board Images**: Board reference images load (if paths still valid)
6. **Settings**: Sort preferences, colors, etc. are restored

### Step 6: Reconfigure (If Needed)

1. **Monitored Folder**: If you were monitoring a folder, re-select it:
   - Click "Monitor" button in board header
   - Select your folder (may need to adjust path if moved)

2. **Board Images**: If board images are missing:
   - Images with absolute paths that don't exist will be automatically removed
   - Re-add images if needed
   - Consider copying images to app directory for better portability

---

## Troubleshooting

### Issue: Snippets Not Appearing

**Symptoms**: Sidebar is empty or missing snippets

**Solutions**:
1. Verify `snippets/` folder was copied correctly
2. Check folder structure is preserved
3. Check file permissions (should be readable)
4. Check console for errors (launch with `--dev` flag)

### Issue: Boards Not Loading

**Symptoms**: Board selector is empty or missing boards

**Solutions**:
1. Verify `boards/` folder was copied
2. Check `boards/app-state.json` exists and is valid JSON
3. Check board files in `snippets/` folder exist
4. Try loading legacy `boards/boards.json` if app-state.json is missing

### Issue: Character Images Not Showing

**Symptoms**: Characters appear but images are missing

**Solutions**:
1. Verify `snippets/characters/images/` folder was copied
2. Check image filenames match character IDs in JSON files
3. Verify image file permissions
4. Check console for loading errors

### Issue: Board Images Not Showing

**Symptoms**: Board reference images don't appear

**Cause**: Images use absolute paths that don't exist on new system

**Solutions**:
1. Images are automatically removed if paths invalid (this is expected)
2. Re-add images if needed
3. For better portability, consider copying images to app directory before backup

### Issue: Settings Not Restored

**Symptoms**: Sort order, colors, etc. reset to defaults

**Solutions**:
1. Verify `boards/app-state.json` was copied
2. Check file is valid JSON (not corrupted)
3. Check file permissions

---

## Best Practices

### Regular Backups

1. **Backup Frequency**: Back up regularly, especially before:
   - System updates
   - Application updates
   - System migrations
   - Before making major changes

2. **Backup Location**: Store backups in:
   - Cloud storage (Dropbox, Google Drive, etc.)
   - External drive
   - Version control (git) - for snippets/boards folders

### Data Organization

1. **Keep It Clean**: Periodically review and organize:
   - Remove unused snippets
   - Clean up orphaned cards
   - Organize folders logically

2. **Test Backups**: Periodically test your backup by restoring to a test location

### Portability Tips

1. **Board Images**: For better portability:
   - Copy images to app directory before adding to boards
   - Or use images that will exist on all systems (e.g., in app directory)

2. **Monitored Folder**: 
   - Use consistent folder names across systems
   - Or document the folder path for easy reconfiguration

3. **Character Images**: 
   - Always backup `snippets/characters/images/` folder
   - Verify images folder structure is preserved

---

## Automated Backup (Future)

A future version may include:
- Built-in backup/export tool
- Automatic backup scheduling
- Cloud backup integration
- One-click restore

For now, manual folder copying is required.

---

## File Structure Reference

### Complete Backup Structure

```
Backup/
├── snippets/
│   ├── Start Here/
│   │   ├── default_board.json
│   │   └── *.json
│   ├── characters/
│   │   ├── *.json
│   │   └── images/
│   │       └── {characterId}_*.{ext}
│   └── {your folders}/
│       └── *.json
├── boards/
│   ├── app-state.json
│   └── boards.json
├── profiles/          (Optional)
│   └── *.json
└── wildcards/         (Optional)
    └── {category}/
        └── *.txt
```

---

## Quick Reference

### Minimum Backup (Essential)
- `snippets/` folder
- `boards/` folder

### Complete Backup (Recommended)
- `snippets/` folder
- `boards/` folder
- `profiles/` folder (if using Wildcard Studio)
- `wildcards/` folder (if using Wildcard Studio)

### Not Needed
- `node_modules/` (dependencies)
- `dist/` (build artifacts)
- `.git/` (version control)
- `comfyui/` (ComfyUI integration files - regenerated)

---

**Last Updated**: December 2025  
**Version**: 1.5.1

