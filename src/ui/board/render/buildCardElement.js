export function buildCardElement(
  card,
  snippet,
  {
    AppState,
    filterByTag,
    showToast,
    getActiveBoard,
    cardColorPalette,
    changeCardColor,
    toggleCardLock,
    removeCardFromBoard,
    startResize,
    startDrag,
    openSnippetModalForEdit
  }
) {
  // Create card element
  const cardDiv = document.createElement('div');
  cardDiv.id = card.id;
  cardDiv.className = 'board-card';
  if (card.locked) cardDiv.classList.add('locked');
  cardDiv.style.left = `${card.x || 50}px`;
  cardDiv.style.top = `${card.y || 50}px`;
  cardDiv.style.width = `${card.width || 220}px`;
  cardDiv.style.height = `${card.height || 120}px`;
  const showCardColors = AppState.getShowCardColors();
  cardDiv.style.backgroundColor = showCardColors
    ? card.color || '#40444b'
    : '#36393f';
  // Add min-width class if card is at minimum width
  if ((card.width || 220) <= 220) {
    cardDiv.classList.add('min-width');
  }
  // Card header
  const header = document.createElement('div');
  header.className = 'card-header';
  header.title = 'Drag to move card';
  if (snippet.tags.length > 0) {
    // Create individual tag elements
    snippet.tags.forEach((tag, index) => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'tag-item';
      tagSpan.textContent = tag;
      tagSpan.title = `Click to filter by tag: ${tag}`;
      // Add click handler to filter by this tag
      tagSpan.onclick = e => {
        e.stopPropagation(); // Prevent card dragging
        filterByTag(tag);
      };
      header.appendChild(tagSpan);
      // Add comma separator if not the last tag
      if (index < snippet.tags.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'tag-separator';
        separator.textContent = ', ';
        header.appendChild(separator);
      }
    });
  } else {
    header.textContent = 'Snippet';
  }
  // Card content
  const content = document.createElement('div');
  content.className = 'card-content';
  content.title = 'Right-click to edit snippet or select text to split';
  const displayText = card.customText || snippet.text || 'No text available';
  // Create a text node to ensure proper text selection
  content.textContent = displayText;
  content.style.userSelect = 'text';
  content.style.webkitUserSelect = 'text';
  content.style.mozUserSelect = 'text';
  content.style.msUserSelect = 'text';
  content.style.cursor = 'text';
  content.style.pointerEvents = 'auto';
  content.style.whiteSpace = 'pre-wrap';
  content.style.wordWrap = 'break-word';
  content.setAttribute('data-text', displayText);
  content.setAttribute('contenteditable', 'false');
  content.setAttribute('spellcheck', 'false');
  // Card actions
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  // Color button
  const colorBtn = document.createElement('button');
  colorBtn.innerHTML = '<i data-feather="droplet"></i>';
  colorBtn.title = card.locked
    ? 'Cannot change color - card is locked'
    : 'Change card color (opens color picker)';
  colorBtn.onclick = async e => {
    e.stopPropagation();
    // Prevent color change if card is locked
    if (card.locked) {
      showToast('Cannot change color - card is locked', 'warning');
      return;
    }
    // Import and use the color picker
    try {
      const { showColorPicker } = await import('../../ui/menus/color.js');
      const currentColor = card.color || '#40444b';
      showColorPicker(card.id, currentColor, changeCardColor);
    } catch (error) {
      console.error('Error opening color picker:', error);
      showToast('Error opening color picker', 'error');
    }
  };
  // Lock button
  const lockBtn = document.createElement('button');
  lockBtn.innerHTML = card.locked
    ? '<i data-feather="lock"></i>'
    : '<i data-feather="unlock"></i>';
  lockBtn.title = card.locked
    ? 'Unlock card (allow moving and resizing)'
    : 'Lock card (prevent moving and resizing)';
  lockBtn.onclick = e => {
    e.stopPropagation();
    toggleCardLock(card.id);
  };
  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '<i data-feather="trash-2"></i>';
  deleteBtn.title = 'Remove card from board';
  deleteBtn.onclick = e => {
    e.stopPropagation();
    removeCardFromBoard(card.id);
  };
  actions.appendChild(colorBtn);
  actions.appendChild(lockBtn);
  actions.appendChild(deleteBtn);
  // Resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  resizeHandle.title = 'Drag to resize card';
  resizeHandle.onmousedown = e => startResize(e, card.id);
  // Assemble card
  cardDiv.appendChild(header);
  cardDiv.appendChild(content);
  cardDiv.appendChild(actions);
  cardDiv.appendChild(resizeHandle);
  // Add drag functionality only to the card header (not content area)
  header.onmousedown = e => {
    e.preventDefault(); // Prevent text selection on header
    startDrag(e, card.id);
  };
  // Enable card dragging between boards - only from header
  cardDiv.draggable = false; // Disable dragging from the entire card
  header.draggable = true; // Enable dragging only from header
  header.addEventListener('dragstart', e => {
    if (card.locked) {
      e.preventDefault();
      return;
    }
    const activeBoard = getActiveBoard();
    // Create drag data for card transfer
    const dragData = {
      type: 'card-drag',
      cardId: card.id,
      sourceBoard: activeBoard.id,
      snippetPath: card.snippetPath,
      cardData: {
        width: card.width,
        height: card.height,
        color: card.color
      }
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    cardDiv.style.opacity = '0.5';
    setTimeout(() => {
      if (cardDiv.style.opacity === '0.5') {
        cardDiv.style.opacity = '1';
      }
    }, 100);
  });
  header.addEventListener('dragend', () => {
    cardDiv.style.opacity = '1';
  });
  // Allow text selection on content area
  content.onmousedown = e => {
    e.stopPropagation(); // Stop event from bubbling to parent
    // Don't prevent default - allow text selection
  };
  // Add mouseup event to help with text selection
  content.onmouseup = e => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
      }
    }, 10);
  };
  content.onclick = e => {
    // Allow text selection and editing
  };
  // Prevent drag events on content area
  content.ondragstart = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  // Add context menu for right-click on the card
  cardDiv.oncontextmenu = async e => {
    const { showCardContextMenu } = await import('../../ui/menus/context.js');
    const { showColorPicker } = await import('../../ui/menus/color.js');
    showCardContextMenu(e, card.id, card.snippetPath, {
      openSnippetModalForEdit,
      showColorPicker,
      toggleCardLock,
      removeCardFromBoard,
      changeCardColor
    });
  };
  return cardDiv;
}
