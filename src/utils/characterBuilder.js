/**
 * Character Builder System
 * Handles character creation, editing, and management
 */

import { AppState } from '../state/appState.js';
import { showConfirmationModal, showDeleteConfirmation } from './confirmationModal.js';

class CharacterBuilder {
  constructor() {
    this.characters = [];
    this.currentCharacter = null;
    this.isInitialized = false;
    this.modal = null;
    this.characterLibrary = null;
    this.characterEditor = null;
    this.characterPreview = null;
  }

  /**
   * Initialize the character builder
   */
  async init() {
    if (this.isInitialized) {
      console.log('Character Builder already initialized');
      return;
    }

    try {
      console.log('Initializing Character Builder...');
      
      // Get modal elements
      this.modal = document.getElementById('characterBuilderModal');
      this.characterLibrary = document.getElementById('characterLibrary');
      this.characterEditor = document.getElementById('characterEditor');
      this.characterPreview = document.getElementById('characterPreview');

      console.log('Modal elements found:', {
        modal: !!this.modal,
        characterLibrary: !!this.characterLibrary,
        characterEditor: !!this.characterEditor,
        characterPreview: !!this.characterPreview
      });

      // Setup event listeners
      this.setupEventListeners();

      // Setup draggable functionality
      this.setupDraggable();

      // Load existing characters
      await this.loadCharacters();

      // Update UI
      this.updateCharacterLibrary();
      this.updatePreview();

      this.isInitialized = true;
      console.log('Character Builder initialized successfully');
    } catch (error) {
      console.error('Error initializing Character Builder:', error);
    }
  }

  /**
   * Setup draggable functionality
   */
  setupDraggable() {
    if (!this.modal) return;

    const modalContent = this.modal.querySelector('.character-builder-modal-content');
    const header = this.modal.querySelector('.character-builder-header');
    
    if (!modalContent || !header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('close-btn')) return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        header.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        modalContent.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        header.style.cursor = 'move';
      }
    });

    // Reset position when modal is closed
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        modalContent.style.transform = 'translate(0px, 0px)';
        xOffset = 0;
        yOffset = 0;
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Modal controls
    const closeBtn = document.getElementById('closeCharacterBuilder');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
      this.closeModal();
    });
    } else {
      console.warn('Character Builder: closeCharacterBuilder button not found');
    }


    // Character editor controls
    const saveCharacterBtn = document.getElementById('saveCharacterBtn');
    if (saveCharacterBtn) {
      saveCharacterBtn.addEventListener('click', () => {
        console.log('Add Character button clicked');
      this.saveCharacter();
    });
    } else {
      console.warn('Character Builder: saveCharacterBtn button not found');
    }

    const clearCharacterBtn = document.getElementById('clearCharacterBtn');
    if (clearCharacterBtn) {
      clearCharacterBtn.addEventListener('click', () => {
        console.log('Clear Character button clicked');
        this.clearEditor();
      });
    } else {
      console.warn('Character Builder: clearCharacterBtn button not found');
    }

    const addToBoardBtn = document.getElementById('addToBoardBtn');
    if (addToBoardBtn) {
      addToBoardBtn.addEventListener('click', () => {
        console.log('Add to Board button clicked');
      this.addCharacterToBoard();
    });
    } else {
      console.warn('Character Builder: addToBoardBtn button not found');
    }

    const updateCharacterBtn = document.getElementById('updateCharacterBtn');
    if (updateCharacterBtn) {
      updateCharacterBtn.addEventListener('click', () => {
        console.log('Update Character button clicked');
        this.updateCharacter();
      });
    } else {
      console.warn('Character Builder: updateCharacterBtn button not found');
    }

    // Form inputs - update preview on change
    const formInputs = this.characterEditor.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updatePreview();
      });
    });

    // Image upload functionality
    const imageBtn1 = document.getElementById('characterImageBtn1');
    const imageInput1 = document.getElementById('characterImage1');
    const imagePreview1 = document.getElementById('characterImagePreview1');
    const imageBtn2 = document.getElementById('characterImageBtn2');
    const imageInput2 = document.getElementById('characterImage2');
    const imagePreview2 = document.getElementById('characterImagePreview2');
    const removeImageBtn1 = document.getElementById('removeImageBtn1');
    const removeImageBtn2 = document.getElementById('removeImageBtn2');
    const updateImageBtn1 = document.getElementById('updateImageBtn1');
    const updateImageBtn2 = document.getElementById('updateImageBtn2');

    if (imageBtn1 && imageInput1 && imagePreview1) {
      imageBtn1.addEventListener('click', () => {
        imageInput1.click();
      });

      imageInput1.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files[0], 1);
      });
    }

    if (imageBtn2 && imageInput2 && imagePreview2) {
      imageBtn2.addEventListener('click', () => {
        imageInput2.click();
      });

      imageInput2.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files[0], 2);
      });
    }

    if (removeImageBtn1) {
      removeImageBtn1.addEventListener('click', () => {
        this.removeCharacterImage(1);
      });
    }
    if (removeImageBtn2) {
      removeImageBtn2.addEventListener('click', () => {
        this.removeCharacterImage(2);
      });
    }

    // Update buttons for individual image sections
    if (updateImageBtn1) {
      updateImageBtn1.addEventListener('click', async () => {
        console.log('Update button 1 clicked - refreshing character library');
        
        // Check if character is saved (has filePath) before allowing image updates
        if (!this.currentCharacter || !this.currentCharacter.filePath) {
          const { showToast } = await import('./index.js');
          showToast('Please save the character first before updating images', 'warning');
          return;
        }
        
        // If there's a current character with images, update it first
        if (this.currentCharacter && (this.currentCharacterImage1 || this.currentCharacterImage2)) {
          console.log('Updating current character images before refreshing library');
          await this.updateCharacter();
          // Small delay to ensure file operations complete
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        // Update the character library display
        this.updateCharacterLibrary();
        console.log('Character library updated from editor');
      });
    }
    if (updateImageBtn2) {
      updateImageBtn2.addEventListener('click', async () => {
        console.log('Update button 2 clicked - refreshing character library');
        
        // Check if character is saved (has filePath) before allowing image updates
        if (!this.currentCharacter || !this.currentCharacter.filePath) {
          const { showToast } = await import('./index.js');
          showToast('Please save the character first before updating images', 'warning');
          return;
        }
        
        // If there's a current character with images, update it first
        if (this.currentCharacter && (this.currentCharacterImage1 || this.currentCharacterImage2)) {
          console.log('Updating current character images before refreshing library');
          await this.updateCharacter();
          // Small delay to ensure file operations complete
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        // Update the character library display
        this.updateCharacterLibrary();
        console.log('Character library updated from editor');
      });
    }
    if (!updateImageBtn1) {
      console.warn('Character Builder: updateImageBtn1 button not found');
    }
    if (!updateImageBtn2) {
      console.warn('Character Builder: updateImageBtn2 button not found');
    }

    // Copy to clipboard button
    const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
    if (copyToClipboardBtn) {
      copyToClipboardBtn.addEventListener('click', () => {
        console.log('Copy to Clipboard button clicked');
        this.copyToClipboard();
      });
    } else {
      console.warn('Character Builder: copyToClipboardBtn button not found');
    }

    // Export to markdown button
    const exportMarkdownBtn = document.getElementById('exportMarkdownBtn');
    if (exportMarkdownBtn) {
      exportMarkdownBtn.addEventListener('click', () => {
        console.log('Export Markdown button clicked');
        this.exportToMarkdown();
      });
    } else {
      console.warn('Character Builder: exportMarkdownBtn button not found');
    }

    // Close modal when clicking outside
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  /**
   * Load characters from storage
   */
  async loadCharacters() {
    try {
      // Ensure characters directory exists
      await this.ensureCharactersDirectory();

      // Read characters directory
      const charactersPath = 'snippets/characters';
      const files = await window.electronAPI.readdir(charactersPath);
      
      this.characters = [];
      
      for (const file of files) {
        if (file.isFile && file.name.endsWith('.json')) {
          try {
            const filePath = `${charactersPath}/${file.name}`;
            const content = await window.electronAPI.readFile(filePath);
            const data = JSON.parse(content);
            
            // Handle both old format (raw character data) and new format (snippet format)
            let character;
            if (data.type === 'character' && data.characterData) {
              // New snippet format - extract character data
              character = data.characterData;
            } else {
              // Old format - use data directly
              character = data;
            }
            
            // Add file path for saving
            character.filePath = filePath;
            this.characters.push(character);
          } catch (error) {
            console.error(`Error loading character ${file.name}:`, error);
          }
        }
      }

      console.log(`Loaded ${this.characters.length} characters`);
    } catch (error) {
      console.error('Error loading characters:', error);
      this.characters = [];
    }
  }

  /**
   * Ensure characters directory exists
   */
  async ensureCharactersDirectory() {
    try {
      await window.electronAPI.readdir('snippets/characters');
    } catch (error) {
      // Directory doesn't exist, create it
      try {
        await window.electronAPI.createFolder('snippets/characters');
        console.log('Created characters directory');
      } catch (createError) {
        console.error('Error creating characters directory:', createError);
      }
    }
  }

  /**
   * Update character library display
   */
  updateCharacterLibrary() {
    if (!this.characterLibrary) return;

    this.characterLibrary.innerHTML = '';

    if (this.characters.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'character-item';
      emptyMessage.innerHTML = `
        <div class="character-info">
          <div class="character-name">No characters yet</div>
          <div class="character-description">Use the Character Editor to create your first character</div>
        </div>
      `;
      this.characterLibrary.appendChild(emptyMessage);
      return;
    }

    this.characters.forEach(character => {
      const characterItem = document.createElement('div');
      characterItem.className = 'character-item';
      if (this.currentCharacter && this.currentCharacter.id === character.id) {
        characterItem.classList.add('selected');
      }

      // Get character image if available (use imagePath1 as the display image)
      let characterImage;
      if (character.imagePath1) {
        // Use a placeholder that will be replaced with the actual image
        characterImage = `<img src="" alt="${character.name}" class="character-library-image" data-image-path="${character.imagePath1}">`;
      } else {
        characterImage = '<div class="character-library-image-placeholder"><i data-feather="user"></i></div>';
      }

      characterItem.innerHTML = `
        <div class="character-image-container">
          ${characterImage}
        </div>
        <div class="character-info">
          <div class="character-name">${character.name || 'Unnamed Character'}</div>
          <div class="character-description">${this.generateCharacterDescription(character)}</div>
        </div>
        <div class="character-actions">
          <button class="character-action-btn secondary" data-action="duplicate" data-character-id="${character.id}">Duplicate</button>
          <button class="character-action-btn danger" data-action="delete" data-character-id="${character.id}">Delete</button>
        </div>
      `;

      characterItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('character-action-btn')) {
          this.selectCharacter(character.id);
        }
      });

      // Add event listeners for action buttons
      const actionButtons = characterItem.querySelectorAll('.character-action-btn');
      actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = button.dataset.action;
          const characterId = button.dataset.characterId;
          
          if (action === 'delete') {
            this.deleteCharacter(characterId);
          } else if (action === 'duplicate') {
            this.duplicateCharacter(characterId);
          }
        });
      });

      // Add error handler for character images and load the image
      const characterImg = characterItem.querySelector('.character-library-image');
      if (characterImg) {
        characterImg.addEventListener('error', () => {
          characterImg.style.display = 'none';
        });
        
        // Load the character image if it has a path
        const imagePath = characterImg.dataset.imagePath;
        if (imagePath) {
          console.log('Loading character image for:', character.name, 'Path:', imagePath);
          this.loadCharacterImage(characterImg, imagePath);
        } else {
          console.log('No image path for character:', character.name);
        }
      }

      this.characterLibrary.appendChild(characterItem);
    });
  }

  /**
   * Load character image using the loadImage API
   */
  async loadCharacterImage(imgElement, imagePath) {
    try {
      console.log('Loading character image from path:', imagePath);
      
      // Check if image exists
      const exists = await window.electronAPI.imageExists(imagePath);
      if (!exists) {
        console.warn('Character image does not exist:', imagePath);
        imgElement.style.display = 'none';
        return;
      }

      // Load the image buffer
      const imageBuffer = await window.electronAPI.loadImage(imagePath);
      if (imageBuffer) {
        // Determine image type from file extension
        const extension = imagePath.toLowerCase().split('.').pop();
        let mimeType = 'image/jpeg'; // default
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'bmp') mimeType = 'image/bmp';
        
        // Create blob URL from buffer
        const blob = new Blob([imageBuffer], { type: mimeType });
        const imageUrl = URL.createObjectURL(blob);
        imgElement.src = imageUrl;
        imgElement.style.display = 'block';
        console.log('Character image loaded successfully with type:', mimeType, 'URL:', imageUrl);
      } else {
        console.warn('Failed to load character image buffer:', imagePath);
        imgElement.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading character image:', error);
      imgElement.style.display = 'none';
    }
  }

  /**
   * Generate a short description for character display
   */
  generateCharacterDescription(character) {
    const parts = [];
    if (character.gender) parts.push(character.gender);
    if (character.age) parts.push(character.age);
    if (character.style) parts.push(character.style);
    
    return parts.length > 0 ? parts.join(', ') : 'No details set';
  }

  /**
   * Create a new character
   */
  createNewCharacter() {
    console.log('Creating new character...');
    this.currentCharacter = {
      id: this.generateCharacterId(),
      name: '',
      gender: '',
      age: '',
      hair: '',
      eyes: '',
      clothing: '',
      style: '',
      personality: '',
      tags: '',
      created: Date.now(),
      modified: Date.now()
    };
    console.log('New character created:', this.currentCharacter);

    this.populateEditor();
    this.updateCharacterLibrary();
    this.updatePreview();
    // Both buttons are always visible now
  }

  /**
   * Edit an existing character
   */
  editCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (character) {
      this.currentCharacter = { ...character };
      this.populateEditor();
      this.updateCharacterLibrary();
      this.updatePreview();
    }
  }

  /**
   * Select a character
   */
  selectCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (character) {
      this.currentCharacter = { ...character };
      this.populateEditor();
      this.updateCharacterLibrary();
      this.updatePreview();
      // Both buttons are always visible now
    }
  }

  /**
   * Update button visibility based on whether we're editing an existing character
   * Both buttons are now always visible
   */
  updateButtonVisibility(isEditing) {
    // Both buttons are now always visible - no need to hide/show them
    console.log('updateButtonVisibility called with isEditing:', isEditing);
    console.log('Both Add Character and Update Character buttons are always visible');
  }

  /**
   * Update an existing character
   */
  async updateCharacter() {
    try {
      if (!this.currentCharacter || !this.currentCharacter.id) {
        console.error('No character selected for update');
        return;
      }

      // Get form data
      const formData = this.getCharacterFromForm();
      console.log('Form data retrieved:', formData);
      
      // Validate that character has a name
      if (!formData.name || formData.name.trim() === '') {
        const { showToast } = await import('./index.js');
        showToast('Please enter a character name before updating the character', 'warning');
        return;
      }

      // Update current character with new data
      this.currentCharacter = {
        ...this.currentCharacter,
        ...formData,
        modified: Date.now()
      };

      // Save the updated character
      await this.saveCharacter();

      // Force clear compiled prompt cache to ensure updated content is shown
      try {
        const { clearCompiledPromptCache } = await import('../bootstrap/boards.js');
        if (clearCompiledPromptCache) {
          clearCompiledPromptCache();
        }
      } catch (error) {
        console.warn('Error clearing compiled prompt cache:', error);
      }

      // Re-render the board to update any cards using this character
      try {
        const { renderBoard, updateCompiledPrompt } = await import('../bootstrap/boards.js');
        await renderBoard();
        // Also update the compiled prompt to reflect changes
        updateCompiledPrompt(true); // Force update
        console.log('Board re-rendered after character update');
      } catch (error) {
        console.warn('Error re-rendering board after character update:', error);
      }

      // Show success notification
      const { showToast } = await import('./index.js');
      showToast(`Character "${this.currentCharacter.name || 'Unnamed'}" updated successfully!`, 'success');

      console.log('Character updated successfully');
    } catch (error) {
      console.error('Error updating character:', error);
      const { showToast } = await import('./index.js');
      showToast('Error updating character', 'error');
    }
  }

  /**
   * Populate the editor with current character data
   */
  populateEditor() {
    if (!this.currentCharacter) {
      console.warn('No current character to populate editor');
      return;
    }

    console.log('Populating editor with character:', this.currentCharacter);

    const fields = [
      'characterName', 'characterGender', 'characterAge', 'characterHair',
      'characterEyes', 'characterClothing', 'characterStyle', 'characterPersonality', 'characterGenitals', 'characterTags'
    ];

    fields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        const propertyName = fieldId.replace('character', '').toLowerCase();
        const value = this.currentCharacter[propertyName] || '';
        console.log(`Setting ${fieldId} (${propertyName}) to:`, value);
        element.value = value;
      } else {
        console.warn(`Element not found: ${fieldId}`);
      }
    });

    // Clear image previews first
    this.clearImagePreviews();
    
    // Handle character images
    if (this.currentCharacter.imagePath1) {
      this.loadCharacterImageForEditor(this.currentCharacter.imagePath1, 1);
    }
    if (this.currentCharacter.imagePath2) {
      this.loadCharacterImageForEditor(this.currentCharacter.imagePath2, 2);
    }
  }

  /**
   * Update the character preview
   */
  updatePreview() {
    if (!this.characterPreview) return;

    const character = this.getCharacterFromForm();
    const description = this.generateCharacterPrompt(character);
    
    this.characterPreview.textContent = description;
  }

  /**
   * Get character data from form
   */
  getCharacterFromForm() {
    const formData = {
      name: document.getElementById('characterName')?.value || '',
      gender: document.getElementById('characterGender')?.value || '',
      age: document.getElementById('characterAge')?.value || '',
      hair: document.getElementById('characterHair')?.value || '',
      eyes: document.getElementById('characterEyes')?.value || '',
      clothing: document.getElementById('characterClothing')?.value || '',
      style: document.getElementById('characterStyle')?.value || '',
      personality: document.getElementById('characterPersonality')?.value || '',
      genitals: document.getElementById('characterGenitals')?.value || '',
      tags: document.getElementById('characterTags')?.value || ''
    };
    console.log('Form data retrieved:', formData);
    return formData;
  }

  /**
   * Generate character prompt from character data
   */
  generateCharacterPrompt(character) {
    const parts = [];
    
    // Physical attributes (exclude name - it's just a reference)
    if (character.gender) parts.push(character.gender);
    if (character.age) parts.push(character.age);
    if (character.hair) parts.push(character.hair);
    if (character.eyes) parts.push(character.eyes);
    
    // Style and clothing
    if (character.clothing) parts.push(character.clothing);
    if (character.style) parts.push(character.style);
    
    // Personality
    if (character.personality) parts.push(character.personality);
    
    // Genitals
    if (character.genitals) parts.push(character.genitals);
    
    // Tags
    if (character.tags) {
      const tagList = character.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tagList.length > 0) {
        parts.push(...tagList);
      }
    }

    return parts.join(', ');
  }

  /**
   * Save the current character
   */
  async saveCharacter() {
    console.log('saveCharacter called, currentCharacter:', this.currentCharacter);
    if (!this.currentCharacter) {
      console.warn('No current character to save');
      return;
    }

    try {
      const characterData = this.getCharacterFromForm();
      
      // Validate that character has a name
      if (!characterData.name || characterData.name.trim() === '') {
        const { showToast } = await import('./index.js');
        showToast('Please enter a character name before adding the character', 'warning');
        return;
      }
      
      // Check if character with same name already exists in sidebar (unless it's the same character being updated)
      const characterName = characterData.name.trim();
      const existingCharacter = this.characters.find(c => 
        c.name === characterName && 
        c.id !== this.currentCharacter.id && 
        c.filePath // Only check characters that are actually saved
      );
      
      if (existingCharacter) {
        const { showToast } = await import('./index.js');
        showToast(`Character "${characterName}" already exists! Use "Update Character" to modify it, or choose a different name.`, 'warning');
        return;
      }
      
      // Update current character with form data
      Object.assign(this.currentCharacter, characterData);
      this.currentCharacter.modified = Date.now();

      // Generate file path if new character
      if (!this.currentCharacter.filePath) {
        const safeName = this.currentCharacter.name.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'character';
        const fileName = `${safeName}_${this.currentCharacter.id}.json`;
        this.currentCharacter.filePath = `snippets/characters/${fileName}`;
      }

      // Handle image saving
      if (this.currentCharacterImage1 || this.currentCharacterImage2) {
        try {
          // Create images directory if it doesn't exist
          const imagesDir = 'snippets/characters/images';
          try {
            await window.electronAPI.readdir(imagesDir);
          } catch (error) {
            await window.electronAPI.createFolder(imagesDir);
          }

          // Save first image if present
          if (this.currentCharacterImage1) {
            const imageExtension = this.currentCharacterImage1.name.split('.').pop();
            const imageFileName = `${this.currentCharacter.id}_1.${imageExtension}`;
            const imagePath = `${imagesDir}/${imageFileName}`;
            
            const arrayBuffer = await this.currentCharacterImage1.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const imageData = Array.from(uint8Array);
            
            await window.electronAPI.saveImage(this.currentCharacter.id, imageData, imageFileName);
            this.currentCharacter.imagePath1 = imagePath;
            console.log('Character image 1 saved:', imagePath);
          }

          // Save second image if present
          if (this.currentCharacterImage2) {
            const imageExtension = this.currentCharacterImage2.name.split('.').pop();
            const imageFileName = `${this.currentCharacter.id}_2.${imageExtension}`;
            const imagePath = `${imagesDir}/${imageFileName}`;
            
            const arrayBuffer = await this.currentCharacterImage2.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const imageData = Array.from(uint8Array);
            
            await window.electronAPI.saveImage(this.currentCharacter.id, imageData, imageFileName);
            this.currentCharacter.imagePath2 = imagePath;
            console.log('Character image 2 saved:', imagePath);
          }
        } catch (error) {
          console.error('Error saving character images:', error);
        }
      }

      // Create snippet format for the character
      const prompt = this.generateCharacterPrompt(characterData);
      
      // Build tags array - include character name and any additional tags
      const tags = ['character'];
      if (characterData.name && characterData.name.trim()) {
        tags.push(characterData.name.trim());
      }
      if (characterData.tags && characterData.tags.trim()) {
        const additionalTags = characterData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.push(...additionalTags);
      }
      
      const snippetData = {
        name: characterData.name || 'Character',
        text: prompt,
        tags: tags,
        type: 'character',
        created: this.currentCharacter.created || Date.now(),
        modified: Date.now(),
        // Keep original character data for internal use
        characterData: this.currentCharacter
      };

      // Save to file in snippet format
      await window.electronAPI.writeFile(this.currentCharacter.filePath, JSON.stringify(snippetData, null, 2));

      // Update snippet cache immediately (don't wait for file read)
      const snippets = AppState.getSnippets();
      snippets[this.currentCharacter.filePath] = snippetData;
      AppState.setSnippets(snippets);
      console.log('Snippet cache updated immediately with path:', this.currentCharacter.filePath);
      console.log('Updated snippet data:', snippetData);
      console.log('Cache now contains:', Object.keys(snippets).length, 'snippets');
      
      // Verify the update worked
      const verifySnippet = AppState.getSnippets()[this.currentCharacter.filePath];
      if (verifySnippet && verifySnippet.text === snippetData.text) {
        console.log('✓ Snippet cache update verified successfully');
      } else {
        console.error('✗ Snippet cache update verification failed!');
        console.error('Expected text:', snippetData.text);
        console.error('Actual text:', verifySnippet?.text);
      }

      // Update characters array
      const existingIndex = this.characters.findIndex(c => c.id === this.currentCharacter.id);
      if (existingIndex >= 0) {
        this.characters[existingIndex] = { ...this.currentCharacter };
      } else {
        this.characters.push({ ...this.currentCharacter });
      }

      // Update UI
      this.updateCharacterLibrary();
      this.updatePreview();

      // Also add to sidebar as a snippet (pass the snippetData to avoid re-reading)
      await this.addCharacterToSidebar(snippetData);

      // Show success notification
      const { showToast } = await import('./index.js');
      showToast(`Character "${characterData.name || 'Unnamed'}" added successfully!`, 'success');

      console.log('Character saved successfully');
    } catch (error) {
      console.error('Error saving character:', error);
    }
  }

  /**
   * Delete a character
   */
  async deleteCharacter(characterId = null) {
    const id = characterId || (this.currentCharacter ? this.currentCharacter.id : null);
    if (!id) return;

    const character = this.characters.find(c => c.id === id);
    if (!character) return;

    const confirmed = await showDeleteConfirmation(
      character.name || 'this character',
      'character'
    );

    if (confirmed) {
      try {
        // Delete file if it exists
        if (character.filePath) {
          try {
            await window.electronAPI.deleteFile(character.filePath);
          } catch (error) {
            console.warn('Could not delete character file:', error);
          }
        }

        // Remove from characters array
        this.characters = this.characters.filter(c => c.id !== id);

        // Clear current character if it was deleted
        if (this.currentCharacter && this.currentCharacter.id === id) {
          this.currentCharacter = null;
          this.clearEditor();
        }

        // Remove from AppState snippets
        if (character.filePath) {
          const snippets = AppState.getSnippets();
          delete snippets[character.filePath];
          AppState.setSnippets(snippets);
          console.log('Character removed from AppState snippets');
        }

        // Remove from sidebar tree and refresh sidebar
        if (window.sidebarTree && character.filePath) {
          console.log('Attempting to remove character from sidebar tree:', character.filePath);
          console.log('Current sidebar tree:', window.sidebarTree);
          
          // Find and remove from sidebar tree
          const removeFromTree = (tree) => {
            for (let i = tree.length - 1; i >= 0; i--) {
              const item = tree[i];
              console.log('Checking sidebar item:', item);
              console.log('Comparing paths - item.path:', item.path, 'character.filePath:', character.filePath);
              
              // Check for exact match or normalized path match
              if (item.type === 'snippet' && (
                item.path === character.filePath || 
                item.path === character.filePath.replace(/\\/g, '/') ||
                item.path === character.filePath.replace(/\//g, '\\')
              )) {
                tree.splice(i, 1);
                console.log('Character removed from sidebar tree at index:', i);
                return true;
              }
              if (item.type === 'folder' && item.children) {
                console.log('Checking folder children:', item.name);
                if (removeFromTree(item.children)) {
                  return true;
                }
              }
            }
            return false;
          };
          
          const removed = removeFromTree(window.sidebarTree);
          console.log('Character removal from sidebar tree result:', removed);
          
          // Refresh the sidebar display
          try {
            const { renderSidebar } = await import('../bootstrap/sidebar.js');
            const foldersContainer = document.getElementById('foldersContainer');
            if (foldersContainer) {
              console.log('Refreshing sidebar with updated tree');
              renderSidebar(window.sidebarTree, foldersContainer);
              console.log('Sidebar refreshed after character deletion');
            } else {
              console.error('foldersContainer not found');
            }
          } catch (error) {
            console.error('Error refreshing sidebar after deletion:', error);
          }
        } else {
          console.log('Cannot remove from sidebar - missing sidebarTree or filePath');
          console.log('sidebarTree exists:', !!window.sidebarTree);
          console.log('character.filePath:', character.filePath);
        }

        // Update UI
        this.updateCharacterLibrary();
        this.updatePreview();

        // Show success notification
        const { showToast } = await import('./index.js');
        showToast(`Character "${character.name || 'Unnamed'}" deleted successfully!`, 'success');

        console.log('Character deleted successfully');
      } catch (error) {
        console.error('Error deleting character:', error);
      }
    }
  }

  /**
   * Duplicate a character
   */
  async duplicateCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) {
      console.warn('Character not found for duplication:', characterId);
      return;
    }

    try {
      console.log('Duplicating character:', character.name);

      // Generate a new unique ID and file path
      const newId = this.generateCharacterId();
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 11);
      const newFileName = `${character.name}_copy_${timestamp}_${randomSuffix}.json`;
      const newFilePath = `snippets/characters/${newFileName}`;

      // Create a deep copy of the character data
      const duplicatedCharacter = {
        ...character,
        id: newId,
        name: this.generateDuplicateName(character.name),
        filePath: newFilePath,
        created: Date.now(),
        modified: Date.now(),
        // Clear image paths - they will be copied and updated below
        imagePath1: null,
        imagePath2: null
      };

      // Copy images if they exist
      if (character.imagePath1) {
        try {
          const newImagePath1 = await this.copyCharacterImage(character.imagePath1, newId, 1);
          duplicatedCharacter.imagePath1 = newImagePath1;
        } catch (error) {
          console.warn('Failed to copy image 1:', error);
        }
      }

      if (character.imagePath2) {
        try {
          const newImagePath2 = await this.copyCharacterImage(character.imagePath2, newId, 2);
          duplicatedCharacter.imagePath2 = newImagePath2;
        } catch (error) {
          console.warn('Failed to copy image 2:', error);
        }
      }

      // Generate the prompt for the duplicated character
      const prompt = this.generateCharacterPrompt(duplicatedCharacter);
      
      // Build tags array - include character name and any additional tags
      const tags = ['character'];
      if (duplicatedCharacter.name && duplicatedCharacter.name.trim()) {
        tags.push(duplicatedCharacter.name.trim());
      }
      if (duplicatedCharacter.tags && duplicatedCharacter.tags.trim()) {
        const additionalTags = duplicatedCharacter.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.push(...additionalTags);
      }

      // Create snippet data in the same format as the original
      const snippetData = {
        name: duplicatedCharacter.name,
          text: prompt,
        tags: tags,
          type: 'character',
        created: duplicatedCharacter.created,
        modified: duplicatedCharacter.modified,
        characterData: duplicatedCharacter
      };

      // Save the duplicated character to file
      await window.electronAPI.writeFile(newFilePath, JSON.stringify(snippetData, null, 2));

      // Add to characters array
      this.characters.push(duplicatedCharacter);

        // Add to AppState snippets
      const snippets = AppState.getSnippets();
      snippets[newFilePath] = snippetData;
      AppState.setSnippets(snippets);

      // Add to sidebar
      await this.addCharacterToSidebar();

      // Update UI
      this.updateCharacterLibrary();

      // Show success notification
      const { showToast } = await import('./index.js');
      showToast(`Character "${duplicatedCharacter.name}" duplicated successfully!`, 'success');

      console.log('Character duplicated successfully:', duplicatedCharacter.name);
    } catch (error) {
      console.error('Error duplicating character:', error);
      const { showToast } = await import('./index.js');
      showToast('Error duplicating character: ' + error.message, 'error');
    }
  }

  /**
   * Generate a duplicate name with proper numbering
   */
  generateDuplicateName(originalName) {
    // Check if the name already ends with a number pattern
    const numberMatch = originalName.match(/^(.+?)(_(\d+))?$/);
    if (numberMatch) {
      const baseName = numberMatch[1];
      const existingNumber = numberMatch[3] ? parseInt(numberMatch[3]) : 0;
      
      // Find the next available number
      let newNumber = existingNumber + 1;
      let newName = `${baseName}_${newNumber.toString().padStart(2, '0')}`;
      
      // Check if this name already exists
      while (this.characters.some(c => c.name === newName)) {
        newNumber++;
        newName = `${baseName}_${newNumber.toString().padStart(2, '0')}`;
      }
      
      return newName;
    }
    
    // If no number pattern, just add _01
    let newName = `${originalName}_01`;
    let counter = 1;
    
    // Check if this name already exists and increment if needed
    while (this.characters.some(c => c.name === newName)) {
      counter++;
      newName = `${originalName}_${counter.toString().padStart(2, '0')}`;
    }
    
    return newName;
  }

  /**
   * Copy a character image to a new file for the duplicated character
   */
  async copyCharacterImage(originalImagePath, newCharacterId, imageNumber) {
    try {
      console.log('Copying character image:', originalImagePath, 'to new character:', newCharacterId);
      
      // Read the original image file
      const imageBuffer = await window.electronAPI.readFile(originalImagePath);
      
      // Generate new image filename based on the new character ID
      const fileExtension = originalImagePath.split('.').pop();
      const newImageFilename = `${newCharacterId}_${imageNumber}.${fileExtension}`;
      const newImagePath = `snippets/characters/images/${newImageFilename}`;
      
      // Save the image to the new path
      await window.electronAPI.writeFile(newImagePath, imageBuffer);
      
      console.log('Image copied successfully to:', newImagePath);
      return newImagePath;
    } catch (error) {
      console.error('Error copying character image:', error);
      throw error;
    }
  }

  /**
   * Add character to board as a snippet
   */
  async addCharacterToBoard() {
    console.log('addCharacterToBoard called, currentCharacter:', this.currentCharacter);
    if (!this.currentCharacter) {
      console.warn('No current character to add to board');
      const { showToast } = await import('./index.js');
      showToast('No character selected to add to board', 'error');
      return;
    }

    const characterData = this.getCharacterFromForm();
    console.log('Character data from form:', characterData);
    const prompt = this.generateCharacterPrompt(characterData);
    console.log('Generated prompt:', prompt);

    if (!prompt.trim()) {
      console.warn('No prompt generated for character');
      const { showToast } = await import('./index.js');
      showToast('Character has no content to add to board', 'error');
      return;
    }

    try {
      console.log('Current character file path:', this.currentCharacter.filePath);
      
      // Check if character already exists in AppState
      let snippetData;
      const snippets = AppState.getSnippets();
      console.log('Current AppState snippets:', Object.keys(snippets));
      snippetData = snippets[this.currentCharacter.filePath];
      console.log('Snippet data from AppState:', snippetData);

      // Always ensure the snippet is in AppState before adding to board
      if (!snippetData) {
        console.log('Reading snippet data from file...');
        const content = await window.electronAPI.readFile(this.currentCharacter.filePath);
        snippetData = JSON.parse(content);
        console.log('Snippet data read from file:', snippetData);
      }

      // Always add to AppState snippets (even if it exists, to ensure it's current)
      const currentSnippets = AppState.getSnippets();
      currentSnippets[this.currentCharacter.filePath] = snippetData;
      AppState.setSnippets(currentSnippets);
      console.log('Character added to AppState snippets');
      console.log('Updated AppState snippets:', Object.keys(currentSnippets));
      
      // Verify it was added
      const updatedSnippets = AppState.getSnippets();
      const verifySnippet = updatedSnippets[this.currentCharacter.filePath];
      console.log('Verification - snippet in AppState:', !!verifySnippet);
      if (!verifySnippet) {
        console.error('Failed to add snippet to AppState!');
        throw new Error('Failed to add snippet to AppState');
        }

        // Add to board using the existing system
      console.log('Importing addCardToBoard...');
        const { addCardToBoard } = await import('../bootstrap/boards.js');
      console.log('addCardToBoard imported successfully');
      
        const x = 100 + (Math.random() * 200); // Random position
        const y = 100 + (Math.random() * 200);
      console.log('Calling addCardToBoard with path:', this.currentCharacter.filePath, 'x:', x, 'y:', y);
      
      await addCardToBoard(this.currentCharacter.filePath, x, y);
      console.log('addCardToBoard completed successfully');

        this.closeModal();
        console.log('Character added to board successfully');
      
      const { showToast } = await import('./index.js');
      showToast('Character added to board successfully!', 'success');
      } catch (error) {
        console.error('Error adding character to board:', error);
      const { showToast } = await import('./index.js');
      showToast('Error adding character to board: ' + error.message, 'error');
      
        // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(prompt);
        console.log('Character prompt copied to clipboard as fallback');
        showToast('Character prompt copied to clipboard as fallback', 'info');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  }

  /**
   * Add character to sidebar as a snippet (without adding to board)
   * @param {Object} snippetData - Optional snippet data to use instead of reading from file
   */
  async addCharacterToSidebar(snippetData = null) {
    console.log('addCharacterToSidebar called, currentCharacter:', this.currentCharacter);
    if (!this.currentCharacter) {
      console.warn('No current character to add to sidebar');
      return;
    }

    // Use provided snippetData or read from file
    if (!snippetData) {
      const characterData = this.getCharacterFromForm();
      console.log('Character data from form:', characterData);
      const prompt = this.generateCharacterPrompt(characterData);
      console.log('Generated prompt:', prompt);

      if (!prompt.trim()) {
        console.warn('No character prompt generated');
        return;
      }

      try {
        // Read the saved snippet data from the file
        console.log('Reading snippet data from file:', this.currentCharacter.filePath);
        const content = await window.electronAPI.readFile(this.currentCharacter.filePath);
        snippetData = JSON.parse(content);
        console.log('Snippet data read from file:', snippetData);
      } catch (error) {
        console.error('Error reading snippet data from file:', error);
        return;
      }
    }

    if (snippetData) {
      try {
        // Add to AppState snippets (update cache if not already updated)
        const snippets = AppState.getSnippets();
        snippets[this.currentCharacter.filePath] = snippetData;
        AppState.setSnippets(snippets);
        console.log('Character snippet added to AppState with path:', this.currentCharacter.filePath);
        console.log('Snippet data:', snippetData);
        console.log('All snippets in AppState after adding character:', Object.keys(AppState.getSnippets()));

        // Refresh the sidebar to show the new character snippet
        try {
          const { renderSidebar } = await import('../bootstrap/sidebar.js');
          const foldersContainer = document.getElementById('foldersContainer');
          if (foldersContainer && window.sidebarTree) {
            // Add the new snippet to the sidebar tree
            const snippetEntry = {
              type: 'snippet',
              path: this.currentCharacter.filePath,
              content: snippetData
            };
            
            // Find the characters folder in the sidebar tree
            let charactersFolder = null;
            for (const entry of window.sidebarTree) {
              if (entry.type === 'folder' && entry.name === 'characters') {
                charactersFolder = entry;
                break;
              }
            }
            
            // Normalize path for comparison (handle both forward and backslashes)
            const normalizePath = (path) => {
              if (!path) return '';
              return path.replace(/\\/g, '/').toLowerCase().trim();
            };
            
            const targetPathNormalized = normalizePath(this.currentCharacter.filePath);
            console.log('Looking for snippet with normalized path:', targetPathNormalized);
            
            // Check if snippet already exists in sidebar tree and update it instead of adding duplicate
            const findAndUpdateSnippet = (tree, targetPath) => {
              for (let i = 0; i < tree.length; i++) {
                const entry = tree[i];
                const entryPathNormalized = normalizePath(entry.path);
                
                if (entry.type === 'snippet' && entryPathNormalized === targetPath) {
                  // Update existing snippet entry
                  console.log('Found existing snippet at index', i, 'with path:', entry.path);
                  entry.content = snippetData;
                  console.log('Updated snippet content');
                  return true;
                }
                if (entry.children && entry.children.length > 0) {
                  if (findAndUpdateSnippet(entry.children, targetPath)) {
                    return true;
                  }
                }
              }
              return false;
            };
            
            // Try to update existing snippet first
            const snippetUpdated = findAndUpdateSnippet(window.sidebarTree, targetPathNormalized);
            console.log('Snippet update check result:', snippetUpdated, 'for path:', this.currentCharacter.filePath);
            
            if (!snippetUpdated) {
              // Snippet doesn't exist yet, add it
              console.log('Snippet not found in sidebar tree, adding new entry');
              
              // Check if it already exists in the characters folder before adding
              if (charactersFolder && charactersFolder.children) {
                const existsInFolder = charactersFolder.children.some(
                  child => child.type === 'snippet' && normalizePath(child.path) === targetPathNormalized
                );
                
                if (!existsInFolder) {
                  console.log('Adding snippet to characters folder');
                  charactersFolder.children.push(snippetEntry);
                } else {
                  console.log('Snippet already exists in characters folder, updating instead');
                  const existingIndex = charactersFolder.children.findIndex(
                    child => child.type === 'snippet' && normalizePath(child.path) === targetPathNormalized
                  );
                  if (existingIndex >= 0) {
                    charactersFolder.children[existingIndex].content = snippetData;
                    console.log('Updated existing snippet in characters folder');
                  }
                }
              } else {
                // Check if it exists in root before adding
                const existsInRoot = window.sidebarTree.some(
                  entry => entry.type === 'snippet' && normalizePath(entry.path) === targetPathNormalized
                );
                
                if (!existsInRoot) {
                  console.log('Adding snippet to root level');
                  window.sidebarTree.push(snippetEntry);
                } else {
                  console.log('Snippet already exists in root, updating instead');
                  const existingIndex = window.sidebarTree.findIndex(
                    entry => entry.type === 'snippet' && normalizePath(entry.path) === targetPathNormalized
                  );
                  if (existingIndex >= 0) {
                    window.sidebarTree[existingIndex].content = snippetData;
                    console.log('Updated existing snippet in root');
                  }
                }
              }
            }
            
            // Re-render the sidebar while preserving folder states
            const { schedulePartialSidebarUpdate } = await import('../bootstrap/sidebar.js');
            schedulePartialSidebarUpdate();
          }
        } catch (error) {
          console.error('Error refreshing sidebar:', error);
        }

        console.log('Character added to sidebar successfully');
      } catch (error) {
        console.error('Error adding character to sidebar:', error);
      }
    }
  }

  /**
   * Clear the editor
   */
  clearEditor() {
    // Clear form fields
    const fields = [
      'characterName', 'characterGender', 'characterAge', 'characterHair',
      'characterEyes', 'characterClothing', 'characterStyle', 'characterPersonality', 'characterTags', 'characterGenitals'
    ];

    fields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.value = '';
      }
    });

    // Clear current character and create a new one
    this.currentCharacter = null;
    this.createNewCharacter();
    
    // Clear images
    this.currentCharacterImage1 = null;
    this.currentCharacterImage2 = null;
    
    // Clear image previews
    this.clearImagePreviews();
    
    // Update preview
    this.updatePreview();
    
    // Update character library selection
    this.updateCharacterLibrary();
    
    // Refresh feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    console.log('Editor cleared and new character created');
  }

  /**
   * Generate a unique character ID
   */
  generateCharacterId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Open the character builder modal
   */
  openModal() {
    console.log('Opening character builder modal...');
    if (this.modal) {
      // Create a new character when opening the modal
      this.createNewCharacter();
      this.populateEditor();
      
      this.modal.style.display = 'block';
      // Focus on the first input
      const firstInput = this.characterEditor.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
      console.log('Character builder modal opened');
    } else {
      console.error('Character builder modal not found');
    }
  }

  /**
   * Close the character builder modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      
      // Reset modal position
      const modalContent = this.modal.querySelector('.character-builder-modal-content');
      if (modalContent) {
        modalContent.style.transform = 'translate(0px, 0px)';
      }
    }
  }

  /**
   * Handle image upload for character
   */
  async handleImageUpload(file, slotNumber = 1) {
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file is too large. Please select an image smaller than 5MB.');
        return;
      }

      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.displayImagePreview(e.target.result, slotNumber);
      };
      reader.readAsDataURL(file);

      // Store the file for saving
      if (slotNumber === 1) {
        this.currentCharacterImage1 = file;
      } else {
        this.currentCharacterImage2 = file;
      }
      console.log(`Character image ${slotNumber} uploaded:`, file.name);
    } catch (error) {
      console.error('Error handling image upload:', error);
      alert('Error uploading image. Please try again.');
    }
  }

  /**
   * Load character image for the editor preview
   */
  async loadCharacterImageForEditor(imagePath, slotNumber = 1) {
    try {
      console.log(`Loading character image ${slotNumber} for editor from path:`, imagePath);
      
      // Check if image exists
      const exists = await window.electronAPI.imageExists(imagePath);
      if (!exists) {
        console.warn(`Character image ${slotNumber} does not exist for editor:`, imagePath);
        return;
      }

      // Load the image buffer
      const imageBuffer = await window.electronAPI.loadImage(imagePath);
      if (imageBuffer) {
        // Determine image type from file extension
        const extension = imagePath.toLowerCase().split('.').pop();
        let mimeType = 'image/jpeg'; // default
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'bmp') mimeType = 'image/bmp';
        
        // Create blob URL from buffer
        const blob = new Blob([imageBuffer], { type: mimeType });
        const imageUrl = URL.createObjectURL(blob);
        
        // Display the image preview
        this.displayImagePreview(imageUrl, slotNumber);
        console.log(`Character image ${slotNumber} loaded for editor with type:`, mimeType);
      } else {
        console.warn(`Failed to load character image ${slotNumber} buffer for editor:`, imagePath);
      }
    } catch (error) {
      console.error(`Error loading character image ${slotNumber} for editor:`, error);
    }
  }


  /**
   * Clear image previews
   */
  clearImagePreviews() {
    const imagePreview1 = document.getElementById('characterImagePreview1');
    const imagePreview2 = document.getElementById('characterImagePreview2');
    
    if (imagePreview1) {
      imagePreview1.innerHTML = '<div class="image-placeholder"><i data-feather="image"></i><span>No image</span></div>';
    }
    if (imagePreview2) {
      imagePreview2.innerHTML = '<div class="image-placeholder"><i data-feather="image"></i><span>No image</span></div>';
    }
    
    // Refresh feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    console.log('Image previews cleared');
  }

  /**
   * Display image preview
   */
  displayImagePreview(imageData, slotNumber = 1) {
    const imagePreview = document.getElementById(`characterImagePreview${slotNumber}`);
    const chooseBtn = document.getElementById(`characterImageBtn${slotNumber}`);
    const removeBtn = document.getElementById(`removeImageBtn${slotNumber}`);

    if (imagePreview && chooseBtn) {
      imagePreview.innerHTML = `<img src="${imageData}" alt="Character preview ${slotNumber}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 4px; border: 1px solid #555;">`;
      chooseBtn.textContent = `Change Image ${slotNumber}`;
      if (removeBtn) {
        removeBtn.style.display = 'inline-block';
      }
    }
  }

  /**
   * Remove character image
   */
  async removeCharacterImage(slotNumber = null) {
    // Show confirmation dialog
    const confirmMessage = slotNumber ? 
      `Are you sure you want to permanently delete Image ${slotNumber}? This action cannot be undone.` :
      'Are you sure you want to permanently delete all character images? This action cannot be undone.';
    
    const confirmed = await showConfirmationModal(
      'Delete Image',
      confirmMessage
    );

    if (!confirmed) {
      return;
    }

    if (slotNumber === 1 || slotNumber === null) {
      // Delete the image file if it exists
      if (this.currentCharacter && this.currentCharacter.imagePath1) {
        try {
          const deleted = await window.electronAPI.deleteImage(this.currentCharacter.imagePath1);
          if (deleted) {
            console.log('Image 1 file deleted successfully');
            // Remove from character data
            this.currentCharacter.imagePath1 = null;
          } else {
            console.warn('Failed to delete image 1 file');
          }
        } catch (error) {
          console.error('Error deleting image 1 file:', error);
        }
      }

      // Clear the UI
      const imagePreview1 = document.getElementById('characterImagePreview1');
      const chooseBtn1 = document.getElementById('characterImageBtn1');
      const removeBtn1 = document.getElementById('removeImageBtn1');
      const imageInput1 = document.getElementById('characterImage1');

      if (imagePreview1 && chooseBtn1 && imageInput1) {
        imagePreview1.innerHTML = '';
        chooseBtn1.textContent = 'Choose Image 1';
        imageInput1.value = '';
        if (removeBtn1) {
          removeBtn1.style.display = 'none';
        }
      }
      this.currentCharacterImage1 = null;
    }
    
    if (slotNumber === 2 || slotNumber === null) {
      // Delete the image file if it exists
      if (this.currentCharacter && this.currentCharacter.imagePath2) {
        try {
          const deleted = await window.electronAPI.deleteImage(this.currentCharacter.imagePath2);
          if (deleted) {
            console.log('Image 2 file deleted successfully');
            // Remove from character data
            this.currentCharacter.imagePath2 = null;
          } else {
            console.warn('Failed to delete image 2 file');
          }
        } catch (error) {
          console.error('Error deleting image 2 file:', error);
        }
      }

      // Clear the UI
      const imagePreview2 = document.getElementById('characterImagePreview2');
      const chooseBtn2 = document.getElementById('characterImageBtn2');
      const removeBtn2 = document.getElementById('removeImageBtn2');
      const imageInput2 = document.getElementById('characterImage2');

      if (imagePreview2 && chooseBtn2 && imageInput2) {
        imagePreview2.innerHTML = '';
        chooseBtn2.textContent = 'Choose Image 2';
        imageInput2.value = '';
        if (removeBtn2) {
          removeBtn2.style.display = 'none';
        }
      }
      this.currentCharacterImage2 = null;
    }

    // Save the character to update the data
    if (this.currentCharacter) {
      await this.saveCharacter();
    }

    // Update the character library to reflect changes
    this.updateCharacterLibrary();
  }

  /**
   * Add image to existing character
   */
  async addImageToCharacter(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    // Create a file input for image selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file.');
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image file is too large. Please select an image smaller than 5MB.');
          return;
        }

        // Create images directory if it doesn't exist
        const imagesDir = 'snippets/characters/images';
        try {
          await window.electronAPI.readdir(imagesDir);
        } catch (error) {
          await window.electronAPI.createFolder(imagesDir);
        }

        // Save image file using the fs-writeFile API
        const imageExtension = file.name.split('.').pop();
        const imageFileName = `${character.id}.${imageExtension}`;
        const imagePath = `${imagesDir}/${imageFileName}`;
        
        // Convert file to Uint8Array for saving
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert to regular array for IPC (Uint8Array might not serialize properly)
        const imageData = Array.from(uint8Array);
        
        // Use the save-image API to save the image
        console.log('Attempting to save image:', imageFileName);
        console.log('Image extension:', imageExtension);
        console.log('Array buffer size:', arrayBuffer.byteLength);
        console.log('Uint8Array size:', uint8Array.length);
        console.log('Image data array size:', imageData.length);
        console.log('Character ID:', character.id);
        
        try {
          console.log('About to call saveImage API...');
          const result = await window.electronAPI.saveImage(character.id, imageData, imageFileName);
          console.log('Save image result:', result);
          
          // Verify the file was actually created
          const verifyPath = `${imagesDir}/${imageFileName}`;
          console.log('Verifying image was saved at:', verifyPath);
          const exists = await window.electronAPI.imageExists(verifyPath);
          console.log('Image exists after save:', exists);
        } catch (error) {
          console.error('Error calling saveImage API:', error);
          throw error;
        }
        
        // Update character data
        character.imagePath = imagePath;
        
        // Update the character in the characters array
        const characterIndex = this.characters.findIndex(c => c.id === character.id);
        if (characterIndex !== -1) {
          this.characters[characterIndex] = character;
        }
        
        // Save updated character
        await window.electronAPI.writeFile(character.filePath, JSON.stringify(character, null, 2));

        // Small delay to ensure file is written
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update UI
        this.updateCharacterLibrary();
        
        // If this is the current character being edited, update the editor
        if (this.currentCharacter && this.currentCharacter.id === character.id) {
          this.populateEditor(character);
        }
        
        console.log('Character image added successfully');
      } catch (error) {
        console.error('Error adding character image:', error);
        alert('Error adding image. Please try again.');
      }
    };

    input.click();
  }

  /**
   * Copy character prompt to clipboard
   */
  async copyToClipboard() {
    try {
      if (!this.currentCharacter) {
        console.warn('No current character to copy');
        const { showToast } = await import('./index.js');
        showToast('No character selected to copy', 'error');
        return;
      }

      const characterData = this.getCharacterFromForm();
      const prompt = this.generateCharacterPrompt(characterData);
      
      if (prompt.trim()) {
        await navigator.clipboard.writeText(prompt);
        const { showToast } = await import('./index.js');
        showToast('Character prompt copied to clipboard!', 'success');
        console.log('Character prompt copied to clipboard:', prompt);
      } else {
        const { showToast } = await import('./index.js');
        showToast('No character data to copy', 'error');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      const { showToast } = await import('./index.js');
      showToast('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Export character to markdown format
   */
  async exportToMarkdown() {
    try {
      if (!this.currentCharacter) {
        console.warn('No current character to export');
        const { showToast } = await import('./index.js');
        showToast('No character selected to export', 'error');
        return;
      }

      const characterData = this.getCharacterFromForm();
      const prompt = this.generateCharacterPrompt(characterData);
      
      if (!prompt.trim()) {
        const { showToast } = await import('./index.js');
        showToast('No character data to export', 'error');
        return;
      }

      // Create markdown content
      const markdown = this.generateMarkdown(characterData, prompt);
      
      // Create and download file
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${characterData.name || 'character'}_export.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const { showToast } = await import('./index.js');
      showToast('Character exported to markdown!', 'success');
      console.log('Character exported to markdown:', markdown);
    } catch (error) {
      console.error('Error exporting to markdown:', error);
      const { showToast } = await import('./index.js');
      showToast('Failed to export to markdown', 'error');
    }
  }

  /**
   * Generate markdown content for character export
   */
  generateMarkdown(characterData, prompt) {
    const name = characterData.name || 'Unnamed Character';
    const timestamp = new Date().toISOString().split('T')[0];
    
    let markdown = `# ${name}\n\n`;
    markdown += `*Generated on ${timestamp}*\n\n`;
    
    markdown += `## Character Prompt\n\n`;
    markdown += `\`\`\`\n${prompt}\n\`\`\`\n\n`;
    
    markdown += `## Character Details\n\n`;
    
    if (characterData.gender) markdown += `- **Gender:** ${characterData.gender}\n`;
    if (characterData.age) markdown += `- **Age:** ${characterData.age}\n`;
    if (characterData.hair) markdown += `- **Hair:** ${characterData.hair}\n`;
    if (characterData.eyes) markdown += `- **Eyes:** ${characterData.eyes}\n`;
    if (characterData.clothing) markdown += `- **Clothing:** ${characterData.clothing}\n`;
    if (characterData.style) markdown += `- **Style:** ${characterData.style}\n`;
    if (characterData.personality) markdown += `- **Personality:** ${characterData.personality}\n`;
    if (characterData.genitals) markdown += `- **Genitals:** ${characterData.genitals}\n`;
    if (characterData.tags) markdown += `- **Tags:** ${characterData.tags}\n`;
    
    markdown += `\n---\n\n`;
    markdown += `*Exported from PromptWaffel Character Builder*\n`;
    
    return markdown;
  }
}

// Create global instance
const characterBuilder = new CharacterBuilder();

// Export for use in other modules
export { characterBuilder, CharacterBuilder };
