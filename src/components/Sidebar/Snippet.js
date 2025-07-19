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
    // Truncate text for compact display (fits nicely in 3 lines with 2 lines for text)
    const maxLength = 80;
    const displayText =
      snippet.text && snippet.text.length > maxLength
        ? `${snippet.text.substring(0, maxLength)}...`
        : snippet.text || '';
    // Use textContent instead of innerHTML for better security
    const indicator = document.createElement('span');
    indicator.className = 'snippet-indicator';
    indicator.textContent = '•';
    const content = document.createElement('div');
    content.className = 'snippet-content';
    const textElement = document.createElement('div');
    textElement.className = 'snippet-text';
    textElement.textContent = displayText;
    const tagsElement = document.createElement('div');
    tagsElement.className = 'snippet-tags';
    tagsElement.textContent = Array.isArray(snippet.tags)
      ? snippet.tags.map(tag => escapeHtml(tag)).join(', ')
      : '';
    content.appendChild(textElement);
    content.appendChild(tagsElement);
    snippetElement.appendChild(indicator);
    snippetElement.appendChild(content);
    // Insert tree indicator before content
    snippetElement.insertBefore(treeIndicator, snippetElement.firstChild);
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
        // Only show tooltip if text is truncated
        if (snippet.text && snippet.text.length > maxLength) {
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
          tooltip.textContent = snippet.text;
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
    return snippetElement;
  } catch (error) {
    console.error('Error creating snippet element:', error);
    return null;
  }
}
