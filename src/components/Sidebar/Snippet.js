import { CONSTANTS } from '../../state/appState.js';
import { createTreeStyles, applyStyles } from '../../utils/index.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
import { createDragImage } from '../../ui/dnd.js';
/**
 * Create a snippet element with improved error handling and defensive programming
 * @param {Object} props - The properties for the snippet element.
 * @param {Object} props.snippet - Snippet object
 * @param {string} props.id - Snippet ID
 * @param {string} props.path - Snippet path
 * @param {number} props.depth - Tree depth level
 * @param {boolean} props.isLast - Whether this is the last item in the tree
 * @param {Function} props.showSnippetContextMenu - Function to show the context menu.
 * @returns {Element|null} - The created snippet element or null if creation fails
 */
export function createSnippetElement({
  snippet,
  id,
  path,
  depth = 0,
  isLast = false
}) {
  try {
    // Input validation
    if (!snippet || typeof snippet !== 'object') {
      console.error('Invalid snippet object:', snippet);
      return null;
    }
    if (typeof id !== 'string' || !id.trim()) {
      console.error('Invalid snippet ID:', id);
      return null;
    }
    if (typeof path !== 'string') {
      console.error('Invalid snippet path:', path);
      return null;
    }
    depth = Math.max(0, parseInt(depth, 10) || 0);
    isLast = Boolean(isLast);
    const snippetElement = document.createElement('div');
    snippetElement.className = 'snippet-item';
    snippetElement.id = id;
    snippetElement.dataset.path = path;
    snippetElement.draggable = true;
    snippetElement.style.position = 'relative';
    // Create tree structure indicator
    const treeIndicator = document.createElement('div');
    treeIndicator.className = 'tree-indicator';
    const treeStyles = createTreeStyles(depth, isLast);
    applyStyles(treeIndicator, treeStyles.treeIndicator);
    // Add tree lines
    for (let i = 0; i < depth; i++) {
      const line = document.createElement('div');
      line.className = 'tree-line';
      const lineStyles = createTreeStyles(i, isLast && i === depth - 1);
      applyStyles(line, lineStyles.treeLine);
      treeIndicator.appendChild(line);
    }
    // Add connector line for current item
    if (depth > 0) {
      const connector = document.createElement('div');
      connector.className = 'tree-connector';
      applyStyles(connector, treeStyles.treeConnector);
      treeIndicator.appendChild(connector);
    }
    // Check if this is a character snippet and add special styling
    const isCharacterSnippet = snippet.type === 'character';
    
    // Use textContent instead of innerHTML for better security
    const indicator = document.createElement('span');
    indicator.className = 'snippet-indicator';
    
    if (isCharacterSnippet) {
      // Add character icon and styling
      indicator.innerHTML = '<i data-feather="user" style="width: 12px; height: 12px;"></i>';
      indicator.className += ' character-indicator';
      snippetElement.className += ' character-snippet';
    } else {
      indicator.textContent = '•';
    }
    
    // For character snippets, show only name and tags
    let displayText, displayTags;
    if (isCharacterSnippet) {
      // Use character name or fallback to first part of text
      displayText = snippet.name || (snippet.text ? snippet.text.split(',')[0] : 'Unnamed Character');
      displayTags = Array.isArray(snippet.tags) 
        ? snippet.tags.join(', ') 
        : (snippet.tags || '');
    } else {
      // Regular snippet display
      const maxLength = 80;
      displayText =
        snippet.text && snippet.text.length > maxLength
          ? `${snippet.text.substring(0, maxLength)}...`
          : snippet.text || '';
      displayTags = Array.isArray(snippet.tags)
        ? snippet.tags.map(tag => escapeHtml(tag)).join(', ')
        : '';
    }
    const content = document.createElement('div');
    content.className = 'snippet-content';
    const textElement = document.createElement('div');
    textElement.className = 'snippet-text';
    textElement.textContent = displayText;
    const tagsElement = document.createElement('div');
    tagsElement.className = 'snippet-tags';
    tagsElement.textContent = displayTags;
    content.appendChild(textElement);
    content.appendChild(tagsElement);
    snippetElement.appendChild(indicator);
    snippetElement.appendChild(content);
    // Insert tree indicator before content
    snippetElement.insertBefore(treeIndicator, snippetElement.firstChild);
    
    // Initialize feather icons for character snippets
    if (isCharacterSnippet && typeof feather !== 'undefined') {
      try {
        feather.replace();
      } catch (error) {
        console.warn('Error initializing feather icons for character snippet:', error);
      }
    }
    // Apply styling for compact 3-line layout using Utils
    const snippetStyles = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      minHeight: '60px',
      maxHeight: '60px',
      overflow: 'hidden',
      padding: '8px',
      paddingLeft: `${depth * CONSTANTS.TREE_DEPTH_SPACING + CONSTANTS.TREE_HEADER_PADDING}px`,
      margin: '2px 0'
    };
    applyStyles(snippetElement, snippetStyles);
    const indicatorStyles = {
      flexShrink: '0',
      width: '8px',
      height: '8px',
      marginRight: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      lineHeight: '1'
    };
    applyStyles(indicator, indicatorStyles);
    const contentStyles = {
      flex: '1',
      minWidth: '0',
      overflow: 'hidden'
    };
    applyStyles(content, contentStyles);
    const textStyles = {
      fontSize: '13px',
      lineHeight: '1.3',
      marginBottom: '4px',
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: '2',
      WebkitBoxOrient: 'vertical',
      wordWrap: 'break-word'
    };
    applyStyles(textElement, textStyles);
    const tagsStyles = {
      fontSize: '11px',
      opacity: '0.7',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };
    applyStyles(tagsElement, tagsStyles);
    // Add hover tooltip for full text preview with error handling
    let tooltip = null;
    snippetElement.addEventListener('mouseenter', e => {
      try {
        // For character snippets, always show tooltip with full description
        // For regular snippets, only show if text is truncated
        const shouldShowTooltip = isCharacterSnippet 
          ? (snippet.text && snippet.text.trim())
          : (snippet.text && snippet.text.length > 80);
          
        if (shouldShowTooltip) {
          tooltip = document.createElement('div');
          tooltip.className = 'snippet-tooltip';
          const tooltipStyles = {
            position: 'fixed',
            background: '#2c3e50',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            maxWidth: '400px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: '10000',
            fontSize: '14px',
            lineHeight: '1.4',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #34495e'
          };
          applyStyles(tooltip, tooltipStyles);
          // Show full character description for character snippets, or full text for regular snippets
          tooltip.textContent = isCharacterSnippet ? snippet.text : snippet.text;
          document.body.appendChild(tooltip);
          // Position tooltip near cursor with bounds checking
          const tooltipRect = tooltip.getBoundingClientRect();
          const maxX = window.innerWidth - tooltipRect.width - 20;
          const maxY = window.innerHeight - tooltipRect.height - 20;
          tooltip.style.left = `${Math.min(e.clientX + 10, maxX)}px`;
          tooltip.style.top = `${Math.min(e.clientY - 10, maxY)}px`;
        }
      } catch (error) {
        console.error('Error creating tooltip:', error);
      }
    });
    snippetElement.addEventListener('mouseleave', () => {
      if (tooltip) {
        try {
          tooltip.remove();
        } catch (error) {
          console.error('Error removing tooltip:', error);
        }
        tooltip = null;
      }
    });
    // Update tooltip position on mouse move with error handling
    snippetElement.addEventListener('mousemove', e => {
      if (tooltip) {
        try {
          const tooltipRect = tooltip.getBoundingClientRect();
          const maxX = window.innerWidth - tooltipRect.width - 20;
          const maxY = window.innerHeight - tooltipRect.height - 20;
          tooltip.style.left = `${Math.min(e.clientX + 10, maxX)}px`;
          tooltip.style.top = `${Math.min(e.clientY - 10, maxY)}px`;
        } catch (error) {
          console.error('Error updating tooltip position:', error);
        }
      }
    });
    // Add drag and drop functionality with error handling
    let currentDragImage = null;
    snippetElement.addEventListener('dragstart', e => {
      try {
        // Set global drag state
        window.isDragging = true;
        // Hide tooltip during drag
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
        // Create enhanced drag image with better cleanup
        const dragImageData = createDragImage(snippet.text || '', 'snippet');
        if (dragImageData && dragImageData.element) {
          e.dataTransfer.setDragImage(dragImageData.element, 10, 10);
          currentDragImage = dragImageData;
        }
        const dragData = {
          type: 'snippet-drag',
          path,
          snippet
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      } catch (error) {
        console.error('Error setting up drag data:', error);
        e.preventDefault();
      }
    });
    snippetElement.addEventListener('dragend', e => {
      try {
        // Clear global drag state
        window.isDragging = false;
        // Clean up drag image
        if (currentDragImage && currentDragImage.cleanup) {
          currentDragImage.cleanup();
          currentDragImage = null;
        }
      } catch (error) {
        console.error('Error cleaning up drag image:', error);
      }
    });
    // Add context menu for snippet actions with error handling
    snippetElement.addEventListener('contextmenu', async e => {
      e.preventDefault();
      try {
        // Hide tooltip during context menu
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
        const { showSnippetContextMenu } = await import(
          '../../ui/menus/context.js'
        );
        showSnippetContextMenu(e, snippet, path);
      } catch (error) {
        console.error('Error showing context menu:', error);
      }
    });

    // Add click event for quick actions including Wildcard Studio Profile creation
    snippetElement.addEventListener('click', async e => {
      try {
        // Hide tooltip during click
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }

        // Create quick action menu
        const quickMenu = document.createElement('div');
        quickMenu.className = 'quick-action-menu';
        quickMenu.style.cssText = `
          position: fixed;
          background: #2c3e50;
          border: 1px solid #34495e;
          border-radius: 8px;
          padding: 8px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10001;
          min-width: 200px;
          font-size: 14px;
        `;

        // Position menu near the snippet
        const rect = snippetElement.getBoundingClientRect();
        quickMenu.style.left = `${rect.left}px`;
        quickMenu.style.top = `${rect.bottom + 5}px`;

        // Create Wildcard Studio Profile option
        const createProfileOption = document.createElement('div');
        createProfileOption.className = 'quick-action-item';
        createProfileOption.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: white;
          transition: background-color 0.2s;
        `;
        createProfileOption.innerHTML = '<i data-feather="smile" style="margin-right: 8px; width: 16px; height: 16px;"></i>Create Wildcard Studio Profile';
        createProfileOption.onmouseenter = () => {
          createProfileOption.style.backgroundColor = '#34495e';
        };
        createProfileOption.onmouseleave = () => {
          createProfileOption.style.backgroundColor = 'transparent';
        };
        createProfileOption.onclick = async () => {
          try {
            quickMenu.remove();
            // Open the PromptKit modal and create a new profile from this snippet
            const { promptKitUI } = await import('../../utils/promptkit-ui.js');
            await promptKitUI.openModal();
            promptKitUI.createProfileFromSnippet(snippet);
          } catch (error) {
            console.error('Error creating profile from snippet:', error);
            const { showToast } = await import('../../utils/index.js');
            showToast('Error opening Wildcard Studio', 'error');
          }
        };

        // Create Edit Snippet option
        const editOption = document.createElement('div');
        editOption.className = 'quick-action-item';
        editOption.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: white;
          transition: background-color 0.2s;
        `;
        editOption.innerHTML = '<i data-feather="edit-3" style="margin-right: 8px; width: 16px; height: 16px;"></i>Edit Snippet';
        editOption.onmouseenter = () => {
          editOption.style.backgroundColor = '#34495e';
        };
        editOption.onmouseleave = () => {
          editOption.style.backgroundColor = 'transparent';
        };
        editOption.onclick = async () => {
          try {
            quickMenu.remove();
            // Open the edit snippet modal
            const { openEditSnippetModal } = await import(
              '../../bootstrap/sidebar.js'
            );
            openEditSnippetModal(snippet, path);
          } catch (error) {
            console.error('Error opening edit modal:', error);
          }
        };

        // Add options to menu
        quickMenu.appendChild(createProfileOption);
        quickMenu.appendChild(editOption);

        // Add menu to document
        document.body.appendChild(quickMenu);

        // Replace feather icons
        try {
          if (typeof feather !== 'undefined') {
            feather.replace();
          }
        } catch (iconError) {
          console.warn('Error replacing feather icons:', iconError);
        }

        // Close menu when clicking elsewhere
        const closeMenu = event => {
          try {
            if (event && quickMenu && !quickMenu.contains(event.target) && !snippetElement.contains(event.target)) {
              quickMenu.remove();
              document.removeEventListener('click', closeMenu);
            }
          } catch (error) {
            console.error('Error in quick menu close handler:', error);
          }
        };

        // Add slight delay to prevent immediate closing
        setTimeout(() => {
          try {
            document.addEventListener('click', closeMenu);
          } catch (error) {
            console.error('Error adding quick menu close listener:', error);
          }
        }, 10);

      } catch (error) {
        console.error('Error showing quick action menu:', error);
      }
    });
    return snippetElement;
  } catch (error) {
    console.error('Error creating snippet element:', error);
    return null;
  }
}
