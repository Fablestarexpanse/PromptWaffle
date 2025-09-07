/**
 * Global confirmation modal utility
 * Provides a consistent styled confirmation dialog throughout the application
 */

/**
 * Show a confirmation modal
 * @param {string} title - The title of the confirmation dialog
 * @param {string} message - The message to display
 * @param {Object} options - Optional configuration
 * @param {string} options.confirmText - Text for the confirm button (default: "Confirm")
 * @param {string} options.cancelText - Text for the cancel button (default: "Cancel")
 * @param {string} options.confirmClass - CSS class for the confirm button (default: "character-builder-btn-danger")
 * @param {string} options.cancelClass - CSS class for the cancel button (default: "character-builder-btn-secondary")
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export async function showConfirmationModal(title, message, options = {}) {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmClass = 'character-builder-btn-danger',
    cancelClass = 'character-builder-btn-secondary'
  } = options;

  return new Promise((resolve) => {
    const modal = document.getElementById('confirmationModal');
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    const cancelBtn = document.getElementById('confirmationCancel');
    const confirmBtn = document.getElementById('confirmationConfirm');

    if (!modal || !titleElement || !messageElement || !cancelBtn || !confirmBtn) {
      console.error('Confirmation modal elements not found');
      resolve(false);
      return;
    }

    // Set the title and message
    titleElement.textContent = title;
    messageElement.textContent = message;

    // Update button text and classes
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    
    // Update button classes
    confirmBtn.className = `character-builder-btn ${confirmClass}`;
    cancelBtn.className = `character-builder-btn ${cancelClass}`;

    // Show the modal
    modal.style.display = 'flex';

    // Handle cancel button
    const handleCancel = () => {
      modal.style.display = 'none';
      cancelBtn.removeEventListener('click', handleCancel);
      confirmBtn.removeEventListener('click', handleConfirm);
      resolve(false);
    };

    // Handle confirm button
    const handleConfirm = () => {
      modal.style.display = 'none';
      cancelBtn.removeEventListener('click', handleCancel);
      confirmBtn.removeEventListener('click', handleConfirm);
      resolve(true);
    };

    // Add event listeners
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Handle clicking outside modal
    const handleBackdropClick = (e) => {
      if (e.target === modal) {
        handleCancel();
        modal.removeEventListener('click', handleBackdropClick);
      }
    };
    modal.addEventListener('click', handleBackdropClick);
  });
}

/**
 * Show a delete confirmation modal with consistent styling
 * @param {string} itemName - The name of the item being deleted
 * @param {string} itemType - The type of item (e.g., "snippet", "folder", "character")
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export async function showDeleteConfirmation(itemName, itemType = 'item') {
  const title = `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const message = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
  
  return showConfirmationModal(title, message, {
    confirmText: 'Delete',
    confirmClass: 'character-builder-btn-danger'
  });
}
