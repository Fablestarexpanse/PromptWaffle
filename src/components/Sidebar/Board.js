import { escapeHtml } from '../../utils/escapeHtml.js';
import { createDragImage } from '../../ui/dnd.js';
import { AppState } from '../../state/appState.js';
/**
 * Creates a board element for the sidebar.
 * @param {Object} props - The properties for the board element.
 * @param {Object} props.board - The board object.
 * @param {string} props.id - The board ID.
 * @param {string} props.path - The board path.
 * @param {number} props.depth - The tree depth level.
 * @param {boolean} props.isLast - Whether this is the last item in the tree.
 * @param {Object} props.eventHandlers - The event handlers for the board.
 * @returns {HTMLElement} - The created board element.
 */
export function createBoardElement({
  board,
  id,
  path,
  depth = 0,
  isLast = false,
  eventHandlers
}) {
  const boardElement = document.createElement('div');
  boardElement.className = 'board-item';
  boardElement.id = id;
  boardElement.dataset.path = path;
  boardElement.draggable = true; // Make boards draggable like snippets
  boardElement.style.position = 'relative';
  // Check if this board is the active board
  const activeBoardId = AppState.getActiveBoardId();
  const isActiveBoard = board.id === activeBoardId;
  // Create tree structure indicator
  const treeIndicator = document.createElement('div');
  treeIndicator.className = 'tree-indicator';
  treeIndicator.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: ${depth * 20}px;
        height: 100%;
        pointer-events: none;
    `;
  // Add tree lines
  for (let i = 0; i < depth; i++) {
    const line = document.createElement('div');
    line.className = 'tree-line';
    line.style.cssText = `
            position: absolute;
            left: ${i * 20 + 10}px;
            top: 0;
            width: 1px;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
        `;
    treeIndicator.appendChild(line);
  }
  // Add connector line for current item
  if (depth > 0) {
    const connector = document.createElement('div');
    connector.className = 'tree-connector';
    connector.style.cssText = `
            position: absolute;
            left: ${(depth - 1) * 20 + 10}px;
            top: 25px;
            width: 10px;
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
        `;
    treeIndicator.appendChild(connector);
    // If this is the last item, cut the vertical line
    if (isLast) {
      const lastLine = treeIndicator.querySelector('.tree-line:last-child');
      if (lastLine) {
        lastLine.style.height = '25px';
      }
    }
  }
  // Board display info
  const cardCount = board.cards ? board.cards.length : 0;
  const imageCount = board.images ? board.images.length : 0;
  const displayName = board.name || 'Untitled Board';
  const tags = board.tags || [];
  // Build info text with snippets and images
  let infoText = `${cardCount} snippet${cardCount !== 1 ? 's' : ''}`;
  if (imageCount > 0) {
    infoText += ` • ${imageCount} image${imageCount !== 1 ? 's' : ''}`;
  }
  boardElement.innerHTML = `
        <span class="board-indicator">🧇</span>
        <div class="board-content">
            <div class="board-name">${escapeHtml(displayName)}</div>
            <div class="board-info">${infoText}</div>
            ${tags.length > 0 ? '<div class="board-tags"></div>' : ''}
        </div>
    `;
  // Insert tree indicator before content
  boardElement.insertBefore(treeIndicator, boardElement.firstChild);
  // Add individual clickable tags if they exist
  if (tags.length > 0) {
    const tagsContainer = boardElement.querySelector('.board-tags');
    tags.forEach((tag, index) => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'tag';
      tagSpan.textContent = tag;
      tagSpan.title = `Click to filter by tag: ${tag}`;
      // Style the individual tags
      tagSpan.style.cssText = `
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
            `;
      // Add hover effect
      tagSpan.addEventListener('mouseenter', () => {
        tagSpan.style.background = 'rgba(255, 255, 255, 0.3)';
        tagSpan.style.transform = 'translateY(-1px)';
      });
      tagSpan.addEventListener('mouseleave', () => {
        tagSpan.style.background = 'rgba(255, 255, 255, 0.2)';
        tagSpan.style.transform = 'translateY(0)';
      });
      // Add click handler to filter by this tag
      tagSpan.onclick = e => {
        e.stopPropagation(); // Prevent board switching
        eventHandlers.filterByTag(tag);
      };
      tagsContainer.appendChild(tagSpan);
    });
  }
  // Apply styling for board layout
  const baseStyles = `
        position: relative;
        display: flex;
        align-items: flex-start;
        min-height: 50px;
        padding: 8px;
        padding-left: ${depth * 20 + 8}px;
        margin: 2px 0;
        cursor: pointer;
        border-radius: 4px;
    `;
  // Apply different styling based on active state
  if (isActiveBoard) {
    boardElement.style.cssText = `${baseStyles}
            border-left: 3px solid #2ECC71;
            background: rgba(46, 204, 113, 0.2);
        `;
  } else {
    boardElement.style.cssText = `${baseStyles}
            border-left: 3px solid #f39c12;
            background: rgba(243, 156, 18, 0.1);
        `;
  }
  const indicator = boardElement.querySelector('.board-indicator');
  indicator.style.cssText = `
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
    `;
  const content = boardElement.querySelector('.board-content');
  content.style.cssText = `
        flex: 1;
        min-width: 0;
        overflow: hidden;
    `;
  const nameElement = boardElement.querySelector('.board-name');
  nameElement.style.cssText = `
        font-size: 13px;
        font-weight: 500;
        line-height: 1.3;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: ${isActiveBoard ? '#2ECC71' : '#f39c12'};
    `;
  const infoElement = boardElement.querySelector('.board-info');
  infoElement.style.cssText = `
        font-size: 11px;
        opacity: 0.7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    `;
  // Style the tags container if it exists
  const tagsElement = boardElement.querySelector('.board-tags');
  if (tagsElement) {
    tagsElement.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
            line-height: 1.2;
        `;
  }
  // Add click handler to switch to this board
  boardElement.addEventListener('click', e => {
    e.preventDefault();
    eventHandlers.setCurrentBoard(board.id);
  });
  // Add hover effect
  boardElement.addEventListener('mouseenter', e => {
    if (isActiveBoard) {
      boardElement.style.background = 'rgba(46, 204, 113, 0.3)';
    } else {
      boardElement.style.background = 'rgba(243, 156, 18, 0.2)';
    }
  });
  boardElement.addEventListener('mouseleave', () => {
    if (isActiveBoard) {
      boardElement.style.background = 'rgba(46, 204, 113, 0.2)';
    } else {
      boardElement.style.background = 'rgba(243, 156, 18, 0.1)';
    }
  });
  // Add drag and drop functionality
  boardElement.addEventListener('dragstart', e => {
    // Set global drag state
    window.isDragging = true;
    // Hide any image previews when dragging starts
    eventHandlers.hideImagePreview();
    // Create enhanced drag image with better cleanup
    const dragImageData = createDragImage(displayName, 'board');
    e.dataTransfer.setDragImage(dragImageData.element, 10, 10);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'board-drag',
        path,
        board,
        fileName: path.split('/').pop(),
        currentFolder: path.includes('/')
          ? path.split('/').slice(0, -1).join('/')
          : ''
      })
    );
  });
  boardElement.addEventListener('dragend', e => {
    // Clear global drag state
    window.isDragging = false;
  });
  // Add context menu for board actions
  boardElement.addEventListener('contextmenu', e => {
    e.preventDefault();
    eventHandlers.showBoardFileContextMenu(e, board, path);
  });
  // Add image indicator and hover preview if board has images
  if (board.images && board.images.length > 0) {
    const indicator = document.createElement('div');
    indicator.className = 'board-image-indicator';
    indicator.innerHTML =
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
    indicator.title = `${board.images.length} image${board.images.length > 1 ? 's' : ''}`;
    const content = boardElement.querySelector('.board-content');
    content.appendChild(indicator);
    // Add hover preview functionality
    boardElement.addEventListener('mouseenter', e => {
      if (isActiveBoard) {
        boardElement.style.background = 'rgba(46, 204, 113, 0.3)';
      } else {
        boardElement.style.background = 'rgba(243, 156, 18, 0.2)';
      }
      eventHandlers.showImagePreview(board.images, boardElement);
    });
    boardElement.addEventListener('mouseleave', e => {
      if (isActiveBoard) {
        boardElement.style.background = 'rgba(46, 204, 113, 0.2)';
      } else {
        boardElement.style.background = 'rgba(243, 156, 18, 0.1)';
      }
      eventHandlers.hideImagePreview();
    });
  } else {
    // Add hover effect for boards without images
    boardElement.addEventListener('mouseenter', e => {
      if (isActiveBoard) {
        boardElement.style.background = 'rgba(46, 204, 113, 0.3)';
      } else {
        boardElement.style.background = 'rgba(243, 156, 18, 0.2)';
      }
    });
    boardElement.addEventListener('mouseleave', e => {
      if (isActiveBoard) {
        boardElement.style.background = 'rgba(46, 204, 113, 0.2)';
      } else {
        boardElement.style.background = 'rgba(243, 156, 18, 0.1)';
      }
    });
  }
  return boardElement;
}
