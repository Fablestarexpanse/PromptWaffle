/**
 * Drag and Drop utilities for creating visual drag images
 */
/**
 * Creates a drag image element for drag and drop operations
 * @param {string} text - The text content to display in the drag image
 * @param {string} type - The type of item being dragged ('snippet' or 'board')
 * @returns {Object} - Object containing the drag image element and cleanup function
 */
export function createDragImage(text, type = 'snippet') {
  try {
    // Create drag image container
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-image';
    // Apply styles for the drag image
    const styles = {
      position: 'fixed',
      top: '-1000px',
      left: '-1000px',
      background:
        type === 'board'
          ? 'rgba(243, 156, 18, 0.9)'
          : 'rgba(52, 152, 219, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      maxWidth: '200px',
      maxHeight: '100px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      zIndex: '10000',
      pointerEvents: 'none',
      userSelect: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.2)'
    };
    // Apply styles
    Object.assign(dragImage.style, styles);
    // Set content
    const displayText = text.length > 50 ? `${text.substring(0, 50)}...` : text;
    dragImage.textContent = displayText;
    // Add to DOM temporarily
    document.body.appendChild(dragImage);
    // Return the element and cleanup function
    return {
      element: dragImage,
      cleanup: () => {
        try {
          if (dragImage && dragImage.parentNode) {
            dragImage.parentNode.removeChild(dragImage);
          }
        } catch (error) {
          console.error('Error cleaning up drag image:', error);
        }
      }
    };
  } catch (error) {
    console.error('Error creating drag image:', error);
    return {
      element: null,
      cleanup: () => {
        // No cleanup needed for null element
      }
    };
  }
}
/**
 * Cleanup function to remove any existing drag images
 */
export function cleanupDragImages() {
  try {
    const existingDragImages = document.querySelectorAll('.drag-image');
    existingDragImages.forEach(img => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
  } catch (error) {
    console.error('Error cleaning up drag images:', error);
  }
}
