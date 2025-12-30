# ComfyUI Integration - File-Based Approach

## Overview
PromptWaffle integrates with ComfyUI using a simple, reliable file-based approach. Compiled prompts are saved to a text file that ComfyUI nodes can read directly. This method is more stable than API-based approaches and requires no custom ComfyUI nodes.

## Current Implementation

### How It Works

1. **In PromptWaffle**: 
   - Compile your prompt on a board
   - Click "Send to ComfyUI" button
   - Prompt is automatically saved to `PromptWaffle/comfyui/promptwaffle_prompt.txt`

2. **In ComfyUI**:
   - Use standard ComfyUI nodes (no custom installation needed)
   - "Text Load Line From File" node reads the prompt file
   - Connect to your workflow nodes (CR-Prompt list, CLIP Text Encode, etc.)

### File Location
- **Default Path**: `PromptWaffle/comfyui/promptwaffle_prompt.txt`
- **Auto-created**: Folder is created automatically on first use
- **Overwrite**: Each save overwrites the previous file with the latest prompt

## Installation

### For PromptWaffle:
- ✅ **No installation needed** - feature is built-in
- ✅ **No dependencies** - uses Node.js built-in file system
- ✅ **Button appears automatically** in Compiled Prompt section

### For ComfyUI:
- ✅ **No custom nodes required** - uses standard ComfyUI nodes
- ✅ **No additional setup** - just configure the file path in your workflow

## Usage Guide

### Step 1: Save Prompt from PromptWaffle
1. Compile your prompt on a board in PromptWaffle
2. Click the **"Send to ComfyUI"** button in the Compiled Prompt section
3. The prompt will be saved to: `PromptWaffle/comfyui/promptwaffle_prompt.txt`
4. You'll see a success toast notification

### Step 2: Connect in ComfyUI

#### Using "Text Load Line From File" Node:
1. Add a **"Text Load Line From File"** node to your ComfyUI workflow
2. In the file path field, enter the full path to the prompt file:
   - Example: `F:\PromptWaffel\comfyui\promptwaffle_prompt.txt`
   - **Important**: Adjust the drive letter/path to match your PromptWaffle installation
3. Set the `index` parameter to `0` to read the first (and only) line
4. Click the refresh button (🔄) on the node to reload the file after updating in PromptWaffle

#### Connecting to Other Nodes:
- **CR-Prompt list** (ComfyUI-Impact-Pack): Connect `line_text` output to `positive` input
- **CR Text Replace**: Connect `line_text` output for text processing
- **CLIP Text Encode**: Connect `line_text` output to `text` input
- **Show Any**: Connect `line_text` output to `anything` input for debugging

### Workflow Example
```
PromptWaffle → [Save to File] → promptwaffle_prompt.txt
                                    ↓
ComfyUI → [Text Load Line From File] → [CR Text Replace] → [CR-Prompt list] → [Your Workflow]
                                                              or
                                                          [CLIP Text Encode] → [Your Workflow]
```

## Technical Details

### File Format
- **Format**: Plain text (UTF-8)
- **Content**: Single line with compiled prompt text
- **Location**: `{PromptWaffle_Install_Dir}/comfyui/promptwaffle_prompt.txt`
- **Encoding**: UTF-8

### File Operations
- **Write**: Overwrites existing file on each save
- **Directory**: Auto-created if it doesn't exist
- **Permissions**: Standard file system permissions apply

### Implementation Files
- **Frontend**: `src/utils/comfyui-integration.js`
  - `getPlainTextPrompt()`: Extracts plain text from compiled prompt
  - `savePromptToComfyUI()`: Saves prompt to default folder
  - `savePromptToFile()`: Generic file save function
  
- **Backend**: `main.js`
  - `save-prompt-to-file` IPC handler
  - `get-comfyui-folder` IPC handler
  
- **UI**: `src/index.html`
  - "Send to ComfyUI" button in Compiled Prompt section

## Advantages of File-Based Approach

✅ **Reliability**: No network dependencies or API compatibility issues  
✅ **Simplicity**: Uses standard ComfyUI nodes, no custom installation  
✅ **Stability**: File system operations are more reliable than API calls  
✅ **Flexibility**: Works with any ComfyUI workflow configuration  
✅ **No Dependencies**: No additional packages or custom nodes required  
✅ **Cross-Platform**: Works on Windows, macOS, and Linux  

## Tips & Best Practices

- **File Location**: The file is saved in `PromptWaffle/comfyui/` folder (created automatically)
- **Auto-Update**: Each time you click "Send to ComfyUI", the file is overwritten with the latest prompt
- **Refresh in ComfyUI**: Use the refresh button (🔄) on your file-reading node to reload after updating in PromptWaffle
- **Full Path**: For best results, use the full absolute path in ComfyUI (e.g., `F:\PromptWaffel\comfyui\promptwaffle_prompt.txt`)
- **Finding Your Path**: Check where you cloned/downloaded the PromptWaffle repository
- **Workflow Persistence**: Once configured, your ComfyUI workflow will remember the file path
- **Multiple Workflows**: You can use the same file in multiple ComfyUI workflows

## Troubleshooting

**File not found in ComfyUI:**
- Verify the full path is correct (including drive letter on Windows)
- Check that PromptWaffle has saved the file (look in `PromptWaffle/comfyui/` folder)
- Ensure the path uses forward slashes or double backslashes in ComfyUI

**Prompt not updating:**
- Click the refresh button (🔄) on the "Text Load Line From File" node
- Verify the file was saved successfully (check toast notification in PromptWaffle)
- Check file permissions if on Linux/macOS

**File path issues:**
- Use absolute paths for best results
- On Windows, include the drive letter (e.g., `F:\`)
- Paths are case-sensitive on Linux/macOS

## Status

✅ **Implementation Complete**
- File-based integration working
- No custom ComfyUI nodes required
- Ready for production use

✅ **Documentation**
- Main README includes detailed setup instructions
- This file provides technical reference

## Related Documentation

- See main `README.md` for detailed setup instructions with screenshots
- ComfyUI integration section in Quick Start guide



