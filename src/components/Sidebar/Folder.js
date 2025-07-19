import {
  createTreeStyles,
  applyStyles,
  safeJsonParse
} from '../../utils/index.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
import { showToast } from '../../utils/index.js';
/**
 * Create a folder element with improved error handling and defensive programming
 * @param {Object} props - The properties for the folder element.
 * @param {string} props.name - Folder name
 * @param {string} props.id - Folder ID
 * @param {string} props.path - Folder path
 * @param {number} props.depth - Tree depth level
 * @param {boolean} props.isLast - Whether this is the last item in the tree
 * @param {Object} props.eventHandlers - The event handlers for the folder.
 * @returns {Element|null} - The created folder element or null if creation fails
 */
export function createFolderElement({
  name,
  id,
  path,
  depth = 0,
  isLast = false,
  eventHandlers
}) {
  try {
    // Input validation
    if (typeof name !== 'string' || !name.trim()) {
      console.error('Invalid folder name:', name);
      return null;
    }
    if (typeof id !== 'string' || !id.trim()) {
      console.error('Invalid folder ID:', id);
      return null;
    }
    if (typeof path !== 'string') {
      console.error('Invalid folder path:', path);
      return null;
    }
    depth = Math.max(0, parseInt(depth, 10) || 0);
    isLast = Boolean(isLast);
    const folderElement = document.createElement('div');
    folderElement.className = 'folder';
    folderElement.id = id;
    folderElement.dataset.path = path;
    folderElement.classList.add('collapsed'); // All folders start collapsed by default
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
    const header = document.createElement('div');
    header.className = 'folder-header';
    applyStyles(header, treeStyles.header);
    // Custom instant tooltip for folder name
    // Remove default title
    // header.title = name;
    let tooltip = null;
    function removeTooltip() {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    }
    header.addEventListener('mouseenter', e => {
      removeTooltip();
      tooltip = document.createElement('div');
      tooltip.className = 'custom-folder-tooltip';
      tooltip.textContent = name;
      document.body.appendChild(tooltip);
      // Position tooltip near the header
      const rect = header.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.top - 32}px`;
      tooltip.style.background = '#222';
      tooltip.style.color = '#fff';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.fontSize = '13px';
      tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
      tooltip.style.zIndex = 10000;
      tooltip.style.pointerEvents = 'none';
      tooltip.style.whiteSpace = 'nowrap';
    });
    header.addEventListener('mouseleave', removeTooltip);
    header.addEventListener('mouseout', removeTooltip);
    header.addEventListener('click', removeTooltip);
    const leftPart = document.createElement('div');
    leftPart.className = 'folder-header-left';
    // Use textContent instead of innerHTML for better security
    const collapseIcon = document.createElement('i');
    collapseIcon.setAttribute('data-feather', 'chevron-right');
    collapseIcon.className = 'collapse-icon';
    const folderIcon = document.createElement('i');
    folderIcon.setAttribute('data-feather', 'folder');
    folderIcon.className = 'folder-icon';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = escapeHtml(name);
    leftPart.appendChild(collapseIcon);
    leftPart.appendChild(folderIcon);
    leftPart.appendChild(nameSpan);
    // Safe event handler attachment with null checks
    leftPart.onclick = e => {
      e.stopPropagation(); // Prevent clicks from bubbling up
      // Prevent folder collapse during drag operations
      if (window.isDragging) {
        return;
      }
      folderElement.classList.toggle('collapsed');

      const icon = leftPart.querySelector('.collapse-icon');
      if (icon) {
        const isCollapsed = folderElement.classList.contains('collapsed');
        icon.setAttribute(
          'data-feather',
          isCollapsed ? 'chevron-right' : 'chevron-down'
        );
        // Check if feather is available before calling
        if (
          typeof feather !== 'undefined' &&
          typeof feather.replace === 'function'
        ) {
          feather.replace();
        }
      }
    };
    const actions = document.createElement('div');
    actions.className = 'folder-actions';
    // Create action buttons with safe event handlers
    const createActionButton = (title, iconName, onClick) => {
      const button = document.createElement('button');
      button.className = 'action-button';
      button.title = title;
      const icon = document.createElement('i');
      icon.setAttribute('data-feather', iconName);
      button.appendChild(icon);
      button.onclick = e => {
        e.stopPropagation();
        if (typeof onClick === 'function') {
          try {
            onClick();
          } catch (error) {
            console.error(`Error in action button '${title}':`, error);
            showToast(`Error: ${error.message}`, 'error');
          }
        }
      };
      return button;
    };
    const addFolderBtn = createActionButton(
      'New subfolder',
      'folder-plus',
      () => {
        window.inlineFolderParentPath = path;
        eventHandlers.showInlineFolderCreation();
      }
    );
    const addSnippetBtn = createActionButton(
      'New snippet in folder',
      'file-plus',
      () => eventHandlers.openSnippetModal(path)
    );
    const addBoardBtn = createActionButton('New board in folder', 'grid', () =>
      eventHandlers.openBoardModalInFolder(path)
    );
    const deleteBtn = createActionButton('Delete folder', 'trash-2', () =>
      eventHandlers.deleteFolder(path)
    );
    actions.appendChild(addFolderBtn);
    actions.appendChild(addSnippetBtn);
    actions.appendChild(addBoardBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(leftPart);
    header.appendChild(actions);
    const content = document.createElement('div');
    content.className = 'folder-content';
    // Make folder element positioned for tree indicators
    folderElement.style.position = 'relative';
    folderElement.appendChild(treeIndicator);
    folderElement.appendChild(header);
    folderElement.appendChild(content);
    // Make only the header draggable, not the entire folder element
    header.draggable = true;
    header.addEventListener('dragstart', e => {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({
          type: 'folder-drag',
          path,
          name
        })
      );
      // Optionally, set a drag image
      if (typeof createDragImage === 'function') {
        const dragImageData = createDragImage(name, 'folder');
        if (dragImageData && dragImageData.element) {
          e.dataTransfer.setDragImage(dragImageData.element, 10, 10);
        }
      }
    });
    // Remove draggable and dragstart from folderElement
    folderElement.draggable = false;
    // Add drag and drop functionality with improved error handling
    header.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      header.classList.add('drag-over');
    });
    header.addEventListener('dragenter', e => {
      e.preventDefault();
      e.stopPropagation();
    });
    header.addEventListener('dragleave', e => {
      e.preventDefault();
      e.stopPropagation();
      // Only remove drag-over if we're actually leaving the header
      if (!header.contains(e.relatedTarget)) {
        header.classList.remove('drag-over');
      }
    });
    header.addEventListener('drop', async e => {
      e.preventDefault();
      e.stopPropagation();
      header.classList.remove('drag-over');
      try {
        const data = safeJsonParse(e.dataTransfer.getData('application/json'));
        if (!data) {
          console.warn('Invalid drag data received');
          return;
        }
        if (data.type === 'snippet-drag') {
          await eventHandlers.handleSnippetDrop(data, path);
        } else if (data.type === 'board-drag') {
          await eventHandlers.handleBoardDrop(data, path);
        } else if (data.type === 'folder-drag') {
          if (typeof eventHandlers.handleFolderDrop === 'function') {
            await eventHandlers.handleFolderDrop(data.path, path);
          }
        }
      } catch (error) {
        console.error('Error handling drop event:', error);
        showToast('Error processing drop operation', 'error');
      }
    });
    return folderElement;
  } catch (error) {
    console.error('Error creating folder element:', error);
    return null;
  }
}
