# PromptWaffel

**Break it. Remix it. Generate better.**
![Preview]https://imgur.com/a/55Gc63u
PromptWaffel is a desktop application for managing, organizing, and composing AI prompts. Built with Electron, it provides an intuitive visual interface for creating complex prompts from reusable components with drag-and-drop functionality.

## 🚀 Quick Start - Beta Program

### **Getting Started (Source-Based Installation)**

Welcome to the PromptWaffel Beta Program! This is a source-based application that requires Node.js to run. Don't worry - we'll guide you through the setup process step by step.

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

#### **Step 2: Download & Setup PromptWaffel**

**Option A: Clone from GitHub (Recommended)**
```bash
# Clone the repository
git clone https://github.com/Fablestarexpanse/PromptWaffel.git

# Navigate to the project folder
cd PromptWaffel

# Install dependencies
npm install
```

**Option B: Download ZIP**
1. **Visit**: [GitHub Repository](https://github.com/Fablestarexpanse/PromptWaffel)
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

### **For Advanced Users & Contributors**

If you want to contribute or customize:

```bash
# Clone the repository
git clone https://github.com/Fablestarexpanse/PromptWaffel.git
cd PromptWaffel

# Install dependencies
npm install

# Run linting and formatting
npm run lint:format

# Launch in development mode
npm run dev

# Build for distribution (creates executables)
npm run build
```

### **Troubleshooting & Common Issues**

#### **Windows SmartScreen Warning**

If you see "Windows protected your PC" when launching:

1. **Click "More info"** in the warning dialog
2. **Click "Run anyway"** to proceed
3. **Alternative**: Use `npm run launch` from PowerShell (bypasses SmartScreen completely)

#### **"npm not found" Error**

If you get this error, you need to install Node.js:

1. **Download Node.js**: Visit https://nodejs.org/
2. **Install**: Download the LTS version (18.x or higher) and run the installer
3. **Restart**: Close and reopen PowerShell/Command Prompt
4. **Verify**: Type `node --version` and `npm --version` to confirm installation
5. **Alternative**: If you're on macOS, you can also use Homebrew: `brew install node`

#### **Permission Errors**

If you get permission errors:

1. **Run as Administrator**: Right-click PowerShell → "Run as Administrator"
2. **Check folder permissions**: Make sure you have write access to the PromptWaffel folder
3. **Antivirus**: Temporarily disable antivirus if it's blocking the application

#### **Application Won't Start**

1. **Check Node.js**: Ensure Node.js 18+ is installed (`node --version`)
2. **Check npm**: Ensure npm is installed (`npm --version`)
3. **Reinstall dependencies**: Run `npm install` in the PromptWaffel folder
4. **Clear cache**: Delete `node_modules` folder and run `npm install` again
5. **Check logs**: Look for error messages in the terminal/console
6. **Try development mode**: Run `npm run dev` for more detailed error information

### **Beta Program Notes**

- **This is beta software**: Expect occasional bugs and report them via GitHub Issues
- **Source-based**: This is a development version that requires Node.js to run
- **Regular updates**: Pull latest changes with `git pull` and run `npm install` if needed
- **Data safety**: All your data is stored locally in the `boards/` and `snippets/` folders
- **Feedback welcome**: Share your experience and suggestions via GitHub Issues
- **Development friendly**: Easy to modify and contribute to the codebase

### **System Requirements**

#### **Minimum Requirements**
- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **Memory**: 4GB RAM
- **Storage**: 100MB free space
- **Internet**: Required for initial download and update checking

#### **Recommended Requirements**
- **Memory**: 8GB RAM or more
- **Storage**: 500MB free space (for larger prompt libraries)
- **Display**: 1920x1080 or higher resolution
- **Internet**: Stable connection for updates and version checking

#### **For Development**
- **Node.js**: Version 18 or higher (LTS recommended)
- **npm**: Version 7 or higher
- **Git**: For cloning the repository
- **Electron**: Will be installed automatically via npm

### **Getting Started Guide**

#### **Your First 5 Minutes with PromptWaffel**

1. **Complete the Tutorial** (2-3 minutes)
   - Follow the interactive tutorial that appears on first launch
   - Learn the basics of creating snippets and boards
   - Understand the drag-and-drop interface

2. **Create Your First Snippet** (1 minute)
   - Click the "+" button in the sidebar
   - Add some text (e.g., "masterpiece, best quality")
   - Add tags (e.g., "quality, positive")
   - Click "Create"

3. **Organize with Folders** (2 minutes)
   - Right-click in the sidebar → "Create Folder"
   - Name it (e.g., "Character Descriptions")
   - Drag your snippet into the folder

4. **Build Your First Prompt** (2 minutes)
   - Drag snippets from the sidebar onto the board
   - Arrange them in the order you want
   - Watch the compiled prompt update in real-time
   - Copy the result for use in your AI tools

#### **Pro Tips for New Users**

- **Use tags**: Tag your snippets for easy searching later
- **Create folders**: Organize snippets by category (characters, styles, environments)
- **Color code**: Assign colors to cards for visual organization
- **Lock cards**: Right-click cards to lock them in position
- **Add images**: Use reference images for visual context
- **Live preview**: Set up folder monitoring for real-time AI output viewing

## 🎯 **Beta Program Information**

### **What to Expect**

PromptWaffel is currently in **Beta** - this means:

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

1. **Check existing issues**: Search [GitHub Issues](https://github.com/Fablestarexpanse/PromptWaffel/issues) first
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
- **Direct Downloads**: Links to GitHub release pages

## Release Notes

### Version 1.2.2 (Current)

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
2. **Organize with Folders**: Create folders to organize snippets by category (characters, styles, etc.)
3. **Build a Prompt**: Drag snippets onto the board to compose your prompt
4. **Add Visual Context**: Use "Add Image" for reference images or "Set Folder" for live preview
5. **Customize Layout**: Resize, color-code, and arrange cards as needed
6. **Export Results**: Copy the compiled prompt or save it as a new snippet

### Workflow Example

1. Create character description snippets
2. Create style and technique snippets
3. Create environment and lighting snippets
4. Drag combinations onto a board
5. Add reference images for visual context
6. Set up live preview to monitor AI generation output
7. Arrange and color-code for clarity
8. Copy the compiled result for use in AI tools

## Privacy & Security

- **Offline First**: All data stored locally, no cloud dependency
- **No Telemetry**: No data collection or tracking
- **Open Source**: Transparent codebase for security review
- **Local Control**: You own and control all your data

## Development

## License

This project is licensed under the GNU General Public License (GPL v3)
## Contributing

Thank you for your interest in contributing to PromptWaffle Prompt Manager! As this project is currently in its early stages and undergoing rapid development and refactoring, we are temporarily not accepting pull requests.

However, your feedback and ideas are extremely valuable to us:

- **🐛 Please feel free to open issues for any bugs you encounter**
- **💡 Submit feature requests through GitHub issues**
- **📝 Share your suggestions for improvements**

We appreciate your understanding and look forward to potentially accepting code contributions once the project architecture stabilizes.

## Support

If you find PromptWaffel useful, consider supporting its development through Ko-fi. Your support helps keep the project active and enables new features!

[![ko-fi](https://storage.ko-fi.com/cdn/kofi2.png?v=3)](https://ko-fi.com/promptwaffle)

**Other ways to support:**

- ⭐ **Star the repository** on GitHub
- 🐛 **Report bugs** and suggest features
- 📢 **Share** PromptWaffel with other creators
