# PromptWaffel

**Break it. Remix it. Generate better.**

PromptWaffel is a desktop application for managing, organizing, and composing AI prompts. Built with Electron, it provides an intuitive visual interface for creating complex prompts from reusable components with drag-and-drop functionality.

## 🚀 Quick Start

### Installation & Setup

#### **Option 1: Download Pre-built Release (Recommended)**

1. **Download**: Get the latest release for your platform from [GitHub Releases](https://github.com/PromptWaffle/PromptWaffle/releases)
2. **Install**: Run the installer for your operating system
3. **Launch**:
   - **Windows**: Use `npm run launch` from PowerShell/Command Prompt (recommended)
   - **macOS/Linux**: Use the provided launcher scripts

#### **Option 2: Development Setup**

```bash
# Clone the repository
git clone https://github.com/PromptWaffle/PromptWaffle.git
cd PromptWaffle

# Install dependencies
npm install

# Launch with launcher (recommended)
npm run launch

# Or launch directly (development)
npm start
```

### Launching the Application

#### **Windows Users:**

```powershell
# Option 1: Use npm (recommended - bypasses SmartScreen)
npm run launch

# Option 2: PowerShell launcher (better error handling)
.\launch-promptwaffel.ps1

# Option 3: Batch file (may trigger SmartScreen warning)
launch-promptwaffel.bat
```

**⚠️ Windows SmartScreen Warning:**
If you see a "Windows protected your PC" warning when double-clicking the launcher:

1. Click "More info" in the warning dialog
2. Click "Run anyway" to proceed
3. **Alternative**: Use `npm run launch` from PowerShell/Command Prompt (bypasses SmartScreen)

#### **macOS/Linux Users:**

```bash
# Make executable and run
chmod +x launch-promptwaffel.sh
./launch-promptwaffel.sh

# Or use npm
npm run launch
```

#### **First Time Setup:**

1. **Welcome Tutorial**: Complete the interactive tutorial to learn the basics
2. **Create Your First Snippet**: Use the "+" button or right-click on the board
3. **Organize**: Create folders to organize your snippets by category
4. **Build Prompts**: Drag snippets onto boards to compose complex prompts

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 100MB free space
- **Internet**: Required for update checking (optional for core functionality)

### Troubleshooting

#### **Windows SmartScreen Issues**

If you encounter "Windows protected your PC" warnings:

- **Use npm**: `npm run launch` bypasses SmartScreen completely
- **PowerShell**: Right-click → "Run with PowerShell" for better compatibility
- **Trust the app**: Click "More info" → "Run anyway" if you trust the source

#### **Common Issues**

- **"npm not found"**: Install Node.js from https://nodejs.org/
- **"package.json not found"**: Make sure you're in the PromptWaffel directory
- **Permission errors**: Run PowerShell as Administrator if needed

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

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
git clone https://github.com/Fablestarexpanse/PromptWaffel.git
cd PromptWaffel
npm install
npm start
```

### Building

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## License

This project is licensed under the ISC License.

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

_PromptWaffel - Making AI prompt creation more organized, visual, and efficient._
