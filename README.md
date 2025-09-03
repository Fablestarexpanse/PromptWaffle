# PromptWaffle

**Break it. Remix it. Generate better.**

PromptWaffle is a desktop application for managing, organizing, and composing AI prompts. Built with Electron, it provides an intuitive visual interface for creating complex prompts from reusable components with drag-and-drop functionality.

## 📸 Screenshots

![PromptWaffle Main Interface](screenshots/main-interface.png)

*The main interface showing snippet cards, image thumbnails, and compiled prompt output with color-coded organization.*

## 🚀 Quick Start - Beta Program

### **Getting Started (Source-Based Installation)**

Welcome to the PromptWaffle Beta Program! This is a source-based application that requires Node.js to run. Don't worry - we'll guide you through the setup process step by step.

#### **Step 1: Install Prerequisites**

**You need Node.js installed first:**

1. **Download Node.js**: Visit https://nodejs.org/
2. **Install**: Download the LTS version (18.x or higher) and run the installer
3. **Verify**: Open a terminal/command prompt and type:
   ```bash
   node --version
   npm --version
   ```
   Both should show version numbers if installed correctly.

#### **Step 2: Download & Setup PromptWaffle**

**Option A: Clone from GitHub (Recommended)**
```bash
# Clone the repository
git clone https://github.com/Fablestarexpanse/PromptWaffle.git

# Navigate to the project folder
cd PromptWaffle

# Install dependencies
npm install
```

**Option B: Download ZIP**
1. **Visit**: [GitHub Repository](https://github.com/Fablestarexpanse/PromptWaffle)
2. **Download**: Click the green "Code" button → "Download ZIP"
3. **Extract**: Extract the ZIP file to a folder of your choice
4. **Open terminal**: Navigate to the extracted folder
5. **Install dependencies**: Run `npm install`

#### **Step 3: Launch the Application**

```bash
# Start the application
npm start
```

**Alternative launch methods:**
```bash
# Development mode with dev tools
npm run dev

# Or use the launcher script (if available)
npm run launch
```

#### **Step 4: First Launch Experience**

1. **Welcome Tutorial**: Complete the interactive tutorial (takes 2-3 minutes)
2. **Create Your First Snippet**: Click the "+" button in the sidebar
3. **Organize**: Create folders to organize your snippets by category
4. **Build Prompts**: Drag snippets onto boards to compose complex prompts



## 🎯 **Beta Program Information**

### **What to Expect**

PromptWaffle is currently in **Beta** - this means:

✅ **What Works Great:**
- Core functionality is stable and production-ready
- All major features are implemented and tested
- Data is safe and backed up locally
- Regular updates with bug fixes and improvements

⚠️ **Beta Considerations:**
- Occasional minor bugs may occur
- UI refinements are ongoing
- Some advanced features are still being developed
- Performance optimizations are in progress

### **How to Report Issues**

Found a bug or have a suggestion?

1. **Check existing issues**: Search [GitHub Issues](https://github.com/Fablestarexpanse/PromptWaffle/issues) first
2. **Create new issue**: Use the "New Issue" button on GitHub
3. **Include details**: 
   - Your operating system and version
   - Steps to reproduce the problem
   - Screenshots if helpful
   - Error messages if any

### **Stay Updated**

- **Git updates**: Pull latest changes with `git pull origin main`
- **Dependencies**: Run `npm install` after pulling to update dependencies
- **Manual check**: Press `Ctrl+Shift+U` or use the update button in the app
- **Release notes**: Read what's new in each update via GitHub releases
- **GitHub**: Follow the repository for latest news and development updates

---

## Features

### Snippet Management

- **Create & Edit Snippets**: Build a library of reusable prompt components with customizable text and tags
- **Hierarchical Organization**: Organize snippets in nested folders with drag-and-drop support
- **Tag System**: Categorize snippets with tags for easy discovery and filtering
- **Search Functionality**: Find snippets quickly using tag-based search
- **Duplicate & Split**: Clone existing snippets or split selected text into new snippets
- **Import from Clipboard**: Create snippets directly from clipboard content

### Visual Board System

- **Drag-and-Drop Interface**: Visually compose prompts by dragging snippets onto boards
- **Multiple Boards**: Create and manage multiple prompt composition workspaces
- **Color Coding**: Assign colors to cards for visual organization and grouping
- **Resizable Cards**: Adjust card sizes to fit your workspace layout
- **Card Locking**: Lock cards in position to prevent accidental movement

### Advanced Composition Tools

- **Compiled Prompt Generation**: Automatically combine all board elements into a single prompt
- **Color Toggle**: Show/hide color coding in the compiled output
- **Text Selection Tools**: Select and extract portions of text for new snippets
- **Real-time Preview**: See your compiled prompt update as you modify the board
- **Save Compiled Prompts**: Export finished prompts as new reusable snippets

### Wildcard Studio

- **Dynamic Prompt Building**: Create complex prompts using wildcards and profiles
- **Profile System**: Pre-built prompt templates with customizable positive prompts
- **Wildcard Categories**: Organized folders with .txt files containing prompt variations
- **Dice Interface**: Click dice buttons to randomly select wildcard items
- **Section Organization**: Organize prompts into Top, Middle, and Bottom sections
- **Real-time Assembly**: Automatic prompt assembly with deduplication
- **Profile Creation**: Built-in tool to create custom profiles
- **Auto-refresh**: Automatically detects new wildcard files and folders
- **Seamless Integration**: Works alongside the existing snippet and board system

### Image Management

- **Reference Images**: Add reference images to boards for visual context
- **Image Thumbnails**: Automatic thumbnail generation for better performance
- **Image Viewer**: Full-size image viewing with overlay modal
- **Drag-and-Drop Support**: Easily add images to your prompt composition workspace
- **Live Image Preview**: Monitor a folder and automatically display the newest image as a live thumbnail
- **Image Controls**: Expand and remove buttons on each image thumbnail for easy management

### File Management

- **Hierarchical Folder Structure**: Organize content in nested folders
- **Drag-and-Drop Organization**: Move snippets and boards between folders
- **Sorting Options**: Sort by name, creation date, or modification date
- **Bulk Operations**: Collapse all folders, clear boards, and batch management
- **Context Menus**: Right-click access to edit, duplicate, and delete options
- **Board Context Menu**: Right-click on the board area for quick snippet creation, board creation, and image upload

### User Interface

- **Modern Design**: Clean, intuitive interface with dark theme
- **Expandable Sidebar**: Collapsible navigation for more workspace
- **Keyboard Shortcuts**: Quick access to common functions
- **Toast Notifications**: Real-time feedback for user actions
- **Responsive Layout**: Adapts to different screen sizes

### Data Management

- **Local Storage**: All data stored locally for privacy and offline access
- **JSON Format**: Human-readable file format for easy backup and portability
- **Auto-save**: Changes are automatically saved to prevent data loss
- **Cross-platform**: Works on Windows, macOS, and Linux

### Update Management

- **Automatic Version Checking**: Checks for updates on startup (once per day)
- **GitHub Integration**: Fetches latest releases from GitHub repository
- **Update Notifications**: Beautiful modal with changelog and download links
- **Manual Check**: Button in sidebar and keyboard shortcut (Ctrl+Shift+U)
- **Reminder System**: Option to postpone update notifications
- **Automatic Updates**: Download and install updates directly from within the app
- **Progress Tracking**: Real-time download progress with visual feedback
- **Seamless Installation**: Automatic restart and installation of updates

## Auto-Updater System

PromptWaffle now includes a comprehensive auto-updater system that allows users to download and install updates directly from within the application.

### How It Works

1. **Automatic Checks**: The app checks for updates on startup (once per day)
2. **Update Detection**: When a new version is available, users are notified
3. **Download Progress**: Users can download updates with real-time progress tracking
4. **Seamless Installation**: Updates are automatically installed and the app restarts
5. **Test Feature**: Added in v1.2.5 to verify auto-updater functionality

### For Developers

To release a new version:

1. **Update Version**: Run `npm run release <version>` (e.g., `npm run release 1.2.3`)
2. **Automatic Build**: GitHub Actions will automatically build and publish the release
3. **User Updates**: Users will receive update notifications and can install automatically

The release script will:
- Update the version in `package.json`
- Commit the changes
- Create and push a version tag
- Trigger the GitHub Actions workflow

### Manual Release Process

If you prefer to release manually:

```bash
# Update version in package.json
# Commit changes
git add package.json
git commit -m "Bump version to 1.2.3"

# Create and push tag
git tag v1.2.3
git push origin main
git push origin v1.2.3
```

## Release Notes

### Version 1.3.1 (Current)

#### New Features

- **Wildcard Studio**: Revolutionary dynamic prompt building system
  - Profile-based prompt templates with customizable positive prompts
  - Folder-based wildcard system with .txt files for easy customization
  - Dice button interface for randomizing wildcard selections
  - Section-based prompt organization (Top, Middle, Bottom)
  - Real-time prompt assembly with automatic deduplication
  - Profile creation tool integrated into the interface
  - Auto-refresh system that detects new wildcard files and folders
  - Seamless integration with existing snippet system

#### Improvements

- **Loading Screen**: Updated with new waffle-themed loading image
- **Tutorial System**: Enhanced with Wildcard Studio introduction and improved explanations
- **UI Improvements**: Better alignment and spacing throughout the application
- **Metadata Panel**: Repositioned collapse button for better accessibility

#### Bug Fixes

- Fixed alignment issues in Wildcard Studio modal
- Improved input field overflow handling in save options
- Enhanced wildcard category layout and spacing
- Fixed horizontal line artifacts in profile creation form
- Improved section selector styling and positioning

#### Technical

- **File Structure**: New `wildcards/` and `profiles/` folders for user customization
- **Profile System**: JSON and TXT file support for profile definitions
- **Wildcard System**: Category-based organization with individual .txt files
- **Auto-Detection**: Real-time scanning for new wildcard categories and files

### Version 1.2.2

#### New Features

- **Version Checking System**: Automatic update notifications with GitHub integration
  - Automatic startup checks for new versions
  - Beautiful update modal with changelog display
  - Manual update checking via button or keyboard shortcut (Ctrl+Shift+U)
  - Reminder system to postpone update notifications
  - Direct download links to GitHub releases
- **Board Context Menu**: Right-click on the board area to access quick actions
  - Create New Snippet: Opens snippet creation modal and automatically adds the snippet to the current board
  - Create from Clipboard: Creates a snippet from clipboard content and adds it to the board
  - Create New Board: Opens board creation modal
  - Add Reference Image: Opens image upload dialog
- **Automatic Board Integration**: Newly created snippets from context menu are automatically added to the current board
- **Live Image Preview System**: Monitor a folder and automatically display the newest image as a live thumbnail with "LIVE" badge
- **Enhanced Image Management**: Expand and remove buttons on image thumbnails for better control
- **Floating Image Viewer**: Resizable floating window for viewing live preview images (removed in favor of modal)
- **Improved Image Handling**: Better path handling and error management for image loading

#### Improvements

- **Version Management**: Centralized version tracking and update notifications
- **Security Enhancements**: Proper Content Security Policy compliance for external API calls
- **Sidebar Active Board Highlighting**: Clear visual indication of the currently active board
- **Folder Sorting and Management**: Improved folder collapse/expand functionality with bulk operations
- **Deletion Safety**: Protected default boards from accidental deletion
- **Confirmation Modals**: Added confirmation dialogs for destructive actions like clearing boards
- **UI Polish**: Removed debug borders and improved overall visual consistency

#### Bug Fixes

- Fixed Content Security Policy blocking external API calls for version checking
- Fixed snippet background color chooser opening board color picker instead
- Fixed board background color picker not setting colors properly
- Fixed right-click "delete snippet" in sidebar not working
- Fixed board context menu not appearing when right-clicking on board area
- Fixed duplicate live preview thumbnails when switching boards
- Resolved image path issues with proper IPC handling
- Fixed flickering issues with live preview updates
- Corrected image expand functionality to show current images instead of previous ones
- Fixed thumbnail persistence across application restarts
- Fixed drag and drop functionality for snippets between folders
- Fixed folder tree closing during drag operations

#### Production Improvements

- **Enhanced Error Recovery**: Graceful error handling with user-friendly messages
- **Performance Optimization**: Efficient handling of large files and batch operations
- **Reduced Logging**: Production-optimized logging with development-only verbose output
- **Security Enhancements**: Path sanitization and input validation
- **Testing Framework**: Comprehensive test suite for critical application paths

### Version 1.1.0-beta.1

#### New Features

- **Image Management System**: Add reference images to boards with thumbnail generation and full-size viewing
- **Advanced Folder Organization**: Better nested folder structure with improved drag-and-drop functionality
- **Card Locking System**: Lock cards in position to prevent accidental movement during board composition
- **Color Toggle in Compiled Output**: Option to show/hide color coding in the final compiled prompt
- **Bulk Operations**: Collapse all folders and clear board functionality for better workspace management

#### Improvements

- **Performance Optimization**: Faster loading times and smoother drag-and-drop interactions
- **UI Enhancements**: Improved visual feedback and toast notifications
- **Search Functionality**: Enhanced tag-based search with better filtering options
- **Keyboard Shortcuts**: Additional shortcuts for improved workflow efficiency

#### Bug Fixes

- Fixed card resizing issues on different screen resolutions
- Resolved folder nesting depth limitations
- Fixed clipboard import functionality
- Corrected auto-save timing issues

### Version 1.1.0-beta

#### New Features

- **Visual Board System**: Drag-and-drop interface for composing prompts
- **Color Coding**: Assign colors to cards for visual organization
- **Resizable Cards**: Adjust card sizes to fit workspace layout
- **Real-time Preview**: See compiled prompt update as you modify the board

#### Improvements

- **Enhanced Snippet Management**: Better organization with hierarchical folders
- **Improved Tag System**: More intuitive tagging and filtering
- **Better File Management**: Enhanced drag-and-drop organization

### Version 1.0.0-beta

#### Initial Release Features

- **Snippet Management**: Create and edit reusable prompt components
- **Tag System**: Categorize snippets with tags for easy discovery
- **Search Functionality**: Find snippets quickly using tag-based search
- **Duplicate & Split**: Clone existing snippets or split selected text
- **Import from Clipboard**: Create snippets directly from clipboard content
- **Compiled Prompt Generation**: Automatically combine board elements
- **Local Storage**: All data stored locally for privacy
- **Cross-platform Support**: Works on Windows, macOS, and Linux

---

## Getting Started

1. **Create Your First Snippet**: Click the "+" button in the sidebar or right-click on the board
2. **Try Wildcard Studio**: Click the "Wildcard Studio" button to create dynamic prompts with wildcards
3. **Organize with Folders**: Create folders to organize snippets by category (characters, styles, etc.)
4. **Build a Prompt**: Drag snippets onto the board to compose your prompt
5. **Add Visual Context**: Use "Add Image" for reference images or "Set Folder" for live preview
6. **Customize Layout**: Resize, color-code, and arrange cards as needed
7. **Export Results**: Copy the compiled prompt or save it as a new snippet

### Workflow Example

1. **Use Wildcard Studio**: Select a profile and roll wildcards for dynamic prompt generation
2. Create character description snippets
3. Create style and technique snippets
4. Create environment and lighting snippets
5. Drag combinations onto a board
6. Add reference images for visual context
7. Set up live preview to monitor AI generation output
8. Arrange and color-code for clarity
9. Copy the compiled result for use in AI tools

## Use Cases

- **AI Art Generation**: Compose complex prompts for Stable Diffusion, DALL-E, Midjourney with live image preview
- **Creative Writing**: Build character descriptions, world-building elements
- **Content Creation**: Organize and reuse marketing copy, social media content
- **Research**: Collect and organize information snippets with tagging
- **Template Management**: Create reusable templates for various projects

## Privacy & Security

- **Offline First**: All data stored locally, no cloud dependency
- **No Telemetry**: No data collection or tracking
- **Open Source**: Transparent codebase for security review
- **Local Control**: You own and control all your data



## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### What this means:

- **Open Source**: The source code is freely available and can be modified
- **Copyleft**: Any derivative works must also be licensed under AGPL-3.0
- **Network Use**: If you run a modified version on a server, you must provide the source code to users
- **Commercial Use**: You can use this software commercially, but must comply with the license terms

### Key Requirements:

1. **Source Code**: Any modifications must be made available to users
2. **License Notice**: Include the original license and copyright notices
3. **Network Access**: If providing network access to the software, users must be able to download the source
4. **Attribution**: Credit the original authors

For the full license text, see the [LICENSE](LICENSE) file in this repository.

**Note**: This is a strong copyleft license that ensures the software and its derivatives remain open source.

## Contributing

Thank you for your interest in contributing to PromptWaffle Prompt Manager! As this project is currently in its early stages and undergoing rapid development and refactoring, we are temporarily not accepting pull requests.

However, your feedback and ideas are extremely valuable to us:

- **🐛 Please feel free to open issues for any bugs you encounter**
- **💡 Submit feature requests through GitHub issues**
- **📝 Share your suggestions for improvements**

We appreciate your understanding and look forward to potentially accepting code contributions once the project architecture stabilizes.

## Support

If you find PromptWaffle useful, consider supporting its development through Ko-fi. Your support helps keep the project active and enables new features!

[![ko-fi](https://storage.ko-fi.com/cdn/kofi2.png?v=3)](https://ko-fi.com/promptwaffle)

**Other ways to support:**

- ⭐ **Star the repository** on GitHub
- 🐛 **Report bugs** and suggest features
- 📢 **Share** PromptWaffle with other creators

## Roadmap

Planned features for upcoming releases of PromptWaffle:

### Visual Feedback and Workflow

- [x] Allow users to set a custom image folder (e.g., ComfyUI or other AI output) to auto-display the most recent image inside the prompt writer for real-time visual reference.

### Prompt Intelligence

- [ ] Track which LoRAs are used per prompt and display them inline.
- [ ] Add LoRA selection and insertion tools directly to the prompt builder.
- [ ] Add image metadata extraction for AI-generated images (e.g., LoRA, CFG, seed, model).
- [ ] Implement prompt metadata extraction from image files.

### Snippet and Board System

- [ ] Expand nesting options for snippets and board elements.
- [ ] Enable drag-and-drop reordering of nested components.
- [ ] Improve UI clarity when working with deeply nested structures.

### Export and Integration

- [ ] Add more export options (e.g., Midjourney, ComfyUI, Flux, clipboard JSON).
- [ ] Define export presets for different AI platforms.

### User Experience and UI

- [ ] Clean up the overall UI for better readability and structure.
- [ ] Refine layout and theming for a more focused editing experience.

---

This roadmap will evolve over time. Feedback and feature suggestions are welcome.

---

_PromptWaffle - Making AI prompt creation more organized, visual, and efficient._
