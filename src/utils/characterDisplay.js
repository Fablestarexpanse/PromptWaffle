/**
 * Character Display Utility
 * Handles displaying character images when character snippets are active on the board
 */

import { AppState } from '../state/appState.js';

export class CharacterDisplay {
  constructor() {
    this.characterImagesDisplay = document.getElementById('characterImagesDisplay');
    this.characterImagesContainer = document.getElementById('characterImagesContainer');
    this.closeCharacterImagesBtn = document.getElementById('closeCharacterImagesBtn');
    this.currentActiveCharacter = null;
    
    console.log('CharacterDisplay: Initializing...');
    console.log('CharacterDisplay: characterImagesDisplay found:', !!this.characterImagesDisplay);
    console.log('CharacterDisplay: characterImagesContainer found:', !!this.characterImagesContainer);
    console.log('CharacterDisplay: closeCharacterImagesBtn found:', !!this.closeCharacterImagesBtn);
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button
    if (this.closeCharacterImagesBtn) {
      this.closeCharacterImagesBtn.addEventListener('click', () => {
        this.hideCharacterDisplay();
      });
    }
  }

  /**
   * Show character images for a character snippet
   * @param {Object} snippet - The character snippet
   */
  async showCharacterImages(snippet) {
    console.log('CharacterDisplay: showCharacterImages called with snippet:', snippet);
    
    if (!snippet || snippet.type !== 'character' || !snippet.characterData) {
      console.log('CharacterDisplay: Invalid snippet or missing characterData:', {
        snippet: !!snippet,
        type: snippet?.type,
        characterData: !!snippet?.characterData
      });
      return;
    }

    this.currentActiveCharacter = snippet;
    const characterData = snippet.characterData;
    console.log('CharacterDisplay: Character data:', characterData);

    // Clear existing images
    this.characterImagesContainer.innerHTML = '';

    // Show the display area
    this.characterImagesDisplay.style.display = 'block';
    console.log('CharacterDisplay: Display area shown');

    // Add character images if they exist
    if (characterData.imagePath1 || characterData.imagePath2) {
      await this.loadCharacterImages(characterData);
    } else {
      // Show message if no images
      const noImagesMsg = document.createElement('div');
      noImagesMsg.className = 'no-character-images';
      noImagesMsg.style.cssText = `
        color: #72767d;
        font-style: italic;
        font-size: 0.9rem;
        text-align: center;
        padding: 2rem;
        grid-column: 1 / -1;
      `;
      noImagesMsg.textContent = 'No reference images for this character';
      this.characterImagesContainer.appendChild(noImagesMsg);
    }

    // Refresh feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  /**
   * Load and display character images
   * @param {Object} characterData - The character data
   */
  async loadCharacterImages(characterData) {
    const imagePaths = [
      { path: characterData.imagePath1, label: 'Image 1' },
      { path: characterData.imagePath2, label: 'Image 2' }
    ].filter(img => img.path);

    for (const imageInfo of imagePaths) {
      try {
        const imageElement = await this.createCharacterImageThumb(imageInfo.path, imageInfo.label);
        if (imageElement) {
          this.characterImagesContainer.appendChild(imageElement);
        }
      } catch (error) {
        console.error('Error loading character image:', error);
      }
    }
  }

  /**
   * Create a character image thumbnail element
   * @param {string} imagePath - Path to the image
   * @param {string} label - Label for the image
   * @returns {Promise<HTMLElement>} The image thumbnail element
   */
  async createCharacterImageThumb(imagePath, label) {
    try {
      // Check if image exists
      const imageExists = await window.electronAPI.imageExists(imagePath);
      if (!imageExists) {
        console.warn('Character image does not exist:', imagePath);
        return null;
      }

      // Load the image
      const imageData = await window.electronAPI.loadImage(imagePath);
      if (!imageData) {
        console.warn('Failed to load character image:', imagePath);
        return null;
      }

      // Create thumbnail element
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'character-image-thumb';
      thumbDiv.title = `Click to view full size: ${label}`;

      // Create image element
      const img = document.createElement('img');
      img.src = imageData;
      img.alt = label;
      img.loading = 'lazy';

      // Create label element
      const labelDiv = document.createElement('div');
      labelDiv.className = 'image-label';
      labelDiv.textContent = label;

      // Add click handler for full-size view
      thumbDiv.addEventListener('click', () => {
        this.showFullSizeImage(imageData, label);
      });

      thumbDiv.appendChild(img);
      thumbDiv.appendChild(labelDiv);

      return thumbDiv;
    } catch (error) {
      console.error('Error creating character image thumbnail:', error);
      return null;
    }
  }

  /**
   * Show full-size image in a modal
   * @param {string} imageSrc - Source of the image
   * @param {string} title - Title for the modal
   */
  showFullSizeImage(imageSrc, title) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'image-viewer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
    `;

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      position: relative;
      cursor: default;
    `;

    // Create image
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = title;
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i data-feather="x"></i>';
    closeBtn.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      background: #ed4245;
      border: none;
      border-radius: 50%;
      color: white;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'scale(1.1)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'scale(1)';
    });

    // Create title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = title;
    titleDiv.style.cssText = `
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 1rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    `;

    // Assemble modal
    imageContainer.appendChild(img);
    imageContainer.appendChild(closeBtn);
    modal.appendChild(titleDiv);
    modal.appendChild(imageContainer);

    // Add to document
    document.body.appendChild(modal);

    // Event handlers
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC key handler
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Refresh feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  /**
   * Hide the character display area
   */
  hideCharacterDisplay() {
    this.characterImagesDisplay.style.display = 'none';
    this.characterImagesContainer.innerHTML = '';
    this.currentActiveCharacter = null;
  }

  /**
   * Check if a snippet is a character and show its images
   * @param {Object} snippet - The snippet to check
   */
  checkAndShowCharacterImages(snippet) {
    if (snippet && snippet.type === 'character') {
      this.showCharacterImages(snippet);
    } else {
      this.hideCharacterDisplay();
    }
  }

  /**
   * Update character display based on active board cards
   * @param {Array} cards - Array of cards on the active board
   */
  updateCharacterDisplayForBoard(cards) {
    console.log('CharacterDisplay: updateCharacterDisplayForBoard called with cards:', cards);
    
    // Find the first character snippet on the board
    const characterCard = cards.find(card => {
      const snippet = AppState.getSnippetByPath(card.snippetPath);
      console.log('CharacterDisplay: Checking card:', card.snippetPath, 'snippet type:', snippet?.type);
      return snippet && snippet.type === 'character';
    });

    console.log('CharacterDisplay: Found character card:', characterCard);

    if (characterCard) {
      const snippet = AppState.getSnippetByPath(characterCard.snippetPath);
      console.log('CharacterDisplay: Showing character images for snippet:', snippet);
      this.showCharacterImages(snippet);
    } else {
      console.log('CharacterDisplay: No character cards found, hiding display');
      this.hideCharacterDisplay();
    }
  }
}

// Create global instance
export const characterDisplay = new CharacterDisplay();
