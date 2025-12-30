# Changelog

All notable changes to PromptWaffle will be documented in this file.

## [1.5.2] - 2025-12-29

### Fixed

- **Character Update Duplicates**: Fixed issue where updating a character in the character builder would create duplicate snippet cards instead of updating the existing one
- **Path Matching**: Improved path normalization to handle both forward and backslashes for better cross-platform compatibility when updating character snippets
- **Board Select Dropdown**: Fixed dropdown to properly show and load all available boards (previously appeared empty)
- **Live Preview Expand**: Fixed expand button functionality for live preview images (controls overlay now visible on hover)
- **Export Markdown Dialog**: Added save dialog to choose export location for markdown files (previously saved to default folder)

### Changed

- **Board Name Display**: Board name now displays on the canvas in the top-left corner for better visual identification
- **Reference Image Persistence**: Reference images now persist with their boards across program restarts (stored in app directory)
- **Card Resizing Performance**: Optimized card resizing with requestAnimationFrame, GPU acceleration hints, and CSS transitions disabled during resize
- **Optimal Card Sizing**: New cards now open at optimal size based on content length for better readability
- **Character Update Synchronization**: Character updates now immediately reflect on the board without requiring a reload (cache updates and forced re-render)

### Technical

- **Path Normalization**: Added `normalizePath` utility function for consistent path comparison across platforms
- **Sidebar Tree Updates**: Improved logic to update existing sidebar entries instead of creating duplicates
- **AppState Cache**: Enhanced immediate cache updates for character snippets to ensure real-time board updates

## [1.5.1] - 2025-12-23

### Fixed

- **Build Configuration**: Removed non-existent `launcher.js` reference from build files
- **Security**: Removed debug comments that disabled security validation in IPC handlers
- **Version Display**: Updated version displays in README and UI to match current version (1.5.1)
- **Feature Implementation**: Implemented board modal in folder functionality (previously TODO)

### Changed

- **Dependencies**: Downgraded Electron from 37.4.0 to 33.2.1 for better stability
- **Project Cleanup**: Removed experimental ComfyUI extension and browser version
- **Repository**: Updated .gitignore to reflect removed projects

## [1.3.1] - 2024-12-30

### Changed

- **Layout Optimization**: Significantly improved space efficiency throughout the application
  - Reduced header padding and margins for better space utilization
  - Tightened section spacing and control element sizing
  - Optimized button heights and padding for more compact layout
  - Reduced container heights and padding across all sections
  - Improved grid spacing and card element sizing
  - Enhanced overall information density by 15-20%

### Fixed

- **Space Efficiency**: Eliminated unnecessary scrolling by optimizing vertical spacing
- **UI Density**: Better utilization of available screen real estate
- **Layout Consistency**: Standardized spacing and sizing across all components

## [1.3.0] - 2024-12-30

### Added

- **Wildcard Studio**: Revolutionary dynamic prompt building system
  - Profile-based prompt templates with customizable positive prompts
  - Folder-based wildcard system with .txt files for easy customization
  - Dice button interface for randomizing wildcard selections
  - Section-based prompt organization (Top, Middle, Bottom)
  - Real-time prompt assembly with automatic deduplication
  - Profile creation tool integrated into the interface
  - Auto-refresh system that detects new wildcard files and folders
  - Seamless integration with existing snippet system

### Changed

- **Loading Screen**: Updated with new waffle-themed loading image
- **Tutorial System**: Enhanced with Wildcard Studio introduction and improved explanations
- **UI Improvements**: Better alignment and spacing throughout the application
- **Metadata Panel**: Repositioned collapse button for better accessibility

### Fixed

- Fixed alignment issues in Wildcard Studio modal
- Improved input field overflow handling in save options
- Enhanced wildcard category layout and spacing
- Fixed horizontal line artifacts in profile creation form
- Improved section selector styling and positioning

### Technical

- **File Structure**: New `wildcards/` and `profiles/` folders for user customization
- **Profile System**: JSON and TXT file support for profile definitions
- **Wildcard System**: Category-based organization with individual .txt files
- **Auto-Detection**: Real-time scanning for new wildcard categories and files

## [1.2.5] - 2024-12-23

### Added

- **Auto-Updater Test Release**: Testing the complete auto-updater workflow
  - Repository name updated from PromptWaffel to PromptWaffle
  - Auto-updater system fully integrated and tested
  - GitHub Actions workflow configured for automated releases
  - Seamless update experience for users

### Changed

- **Repository Migration**: Successfully migrated to new repository name
- **Auto-Updater Integration**: Complete electron-updater implementation
- **Release Process**: Automated release workflow with GitHub Actions

## [1.2.2] - 2024-12-18

### Added

- **Version Checking System**: Automatic update notifications with GitHub integration
  - Automatic startup checks for new versions (once per day)
  - Beautiful update modal with changelog display
  - Manual update checking via sidebar button or keyboard shortcut (Ctrl+Shift+U)
  - Reminder system to postpone update notifications (7-day delay)
  - Direct download links to GitHub releases
  - Loading states and error handling for update checks

### Changed

- **Version Management**: Centralized version tracking and update notifications
- **Security Enhancements**: Proper Content Security Policy compliance for external API calls
- **Electron Integration**: Moved GitHub API calls to main process for better security

### Fixed

- Fixed Content Security Policy blocking external API calls for version checking
- Improved error handling for network requests with proper timeouts
- Enhanced security with proper IPC communication between renderer and main process

## [1.2.1-beta] - 2024-12-15

### Added

- **Board Context Menu**: Right-click on the board area to access quick actions
  - Create New Snippet: Opens snippet creation modal and automatically adds the snippet to the current board
  - Create from Clipboard: Creates a snippet from clipboard content and adds it to the board
  - Create New Board: Opens board creation modal
  - Add Reference Image: Opens image upload dialog
- **Automatic Board Integration**: Newly created snippets from context menu are automatically added to the current board

### Fixed

- Fixed snippet background color chooser opening board color picker instead
- Fixed board background color picker not setting colors properly
- Fixed right-click "delete snippet" in sidebar not working
- Fixed board context menu not appearing when right-clicking on board area

## [1.2.0-beta] - 2024-12-15

### Added

- **Live Image Preview System**: Monitor a folder and automatically display the newest image as a live thumbnail with "LIVE" badge
- **Enhanced Image Management**: Expand and remove buttons on image thumbnails for better control
- **Floating Image Viewer**: Resizable floating window for viewing live preview images (removed in favor of modal)
- **Improved Image Handling**: Better path handling and error management for image loading

### Changed

- **Sidebar Active Board Highlighting**: Clear visual indication of the currently active board
- **Folder Sorting and Management**: Improved folder collapse/expand functionality with bulk operations
- **Deletion Safety**: Protected default boards from accidental deletion
- **Confirmation Modals**: Added confirmation dialogs for destructive actions like clearing boards
- **UI Polish**: Removed debug borders and improved overall visual consistency

### Fixed

- Fixed duplicate live preview thumbnails when switching boards
- Resolved image path issues with proper IPC handling
- Fixed flickering issues with live preview updates
- Corrected image expand functionality to show current images instead of previous ones
- Fixed thumbnail persistence across application restarts
- Fixed drag and drop functionality for snippets between folders
- Fixed folder tree closing during drag operations

## [1.1.0-beta.1] - 2024-12-01

### Added

- **Image Management System**: Add reference images to boards with thumbnail generation and full-size viewing
- **Advanced Folder Organization**: Better nested folder structure with improved drag-and-drop functionality
- **Card Locking System**: Lock cards in position to prevent accidental movement during board composition
- **Color Toggle in Compiled Output**: Option to show/hide color coding in the final compiled prompt
- **Bulk Operations**: Collapse all folders and clear board functionality for better workspace management

### Changed

- **Performance Optimization**: Faster loading times and smoother drag-and-drop interactions
- **UI Enhancements**: Improved visual feedback and toast notifications
- **Search Functionality**: Enhanced tag-based search with better filtering options
- **Keyboard Shortcuts**: Additional shortcuts for improved workflow efficiency

### Fixed

- Fixed card resizing issues on different screen resolutions
- Resolved folder nesting depth limitations
- Fixed clipboard import functionality
- Corrected auto-save timing issues

## [1.1.0-beta] - 2024-11-15

### Added

- **Visual Board System**: Drag-and-drop interface for composing prompts
- **Color Coding**: Assign colors to cards for visual organization
- **Resizable Cards**: Adjust card sizes to fit workspace layout
- **Real-time Preview**: See compiled prompt update as you modify the board

### Changed

- **Enhanced Snippet Management**: Better organization with hierarchical folders
- **Improved Tag System**: More intuitive tagging and filtering
- **Better File Management**: Enhanced drag-and-drop organization

## [1.0.0-beta] - 2024-10-01

### Added

- **Snippet Management**: Create and edit reusable prompt components
- **Tag System**: Categorize snippets with tags for easy discovery
- **Search Functionality**: Find snippets quickly using tag-based search
- **Duplicate & Split**: Clone existing snippets or split selected text
- **Import from Clipboard**: Create snippets directly from clipboard content
- **Compiled Prompt Generation**: Automatically combine board elements
- **Local Storage**: All data stored locally for privacy
- **Cross-platform Support**: Works on Windows, macOS, and Linux

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
