/**
 * PromptKit UI Controller
 * Handles the PromptKit modal interface and user interactions
 */

import { promptKit } from './promptkit.js';
import { showToast } from './index.js';
import { replaceFeatherIcons } from './feather.js';
import { renderSidebar } from '../bootstrap/sidebar.js';
import { loadSnippetsFromFiles } from './utils.js';
import { AppState } from '../state/appState.js';

class PromptKitUI {
  constructor() {
    this.isInitialized = false;
    this.modal = null;
    this.wildcardCategoriesContainer = null;
    this.defaultsSelect = null;
    this.positiveOutput = null;
    this.currentPrompt = '';
    this.wildcardSelections = {}; // Track which wildcard items are selected per individual wildcard
  }

  /**
   * Initialize the PromptKit UI
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Load PromptKit configurations
      const success = await promptKit.loadConfigurations();
      if (!success) {
        console.error('Failed to load PromptKit configurations');
        return;
      }

      // Get DOM elements
      this.modal = document.getElementById('promptKitModal');
      this.wildcardCategoriesContainer = document.getElementById('promptKitWildcardCategories');
      this.profileSelect = document.getElementById('promptKitProfileSelect');
      this.topSection = document.getElementById('promptKitTopSection');
      this.middleSection = document.getElementById('promptKitMiddleSection');
      this.bottomSection = document.getElementById('promptKitBottomSection');
      this.positiveOutput = document.getElementById('promptKitPositiveOutput');

      // Profile creator elements
      this.newProfileName = document.getElementById('newProfileName');
      this.newProfileDescription = document.getElementById('newProfileDescription');
      this.newProfilePositive = document.getElementById('newProfilePositive');
      this.createProfileBtn = document.getElementById('createProfileBtn');
      this.clearProfileFormBtn = document.getElementById('clearProfileFormBtn');

      // Setup event listeners
      this.setupEventListeners();

      // Populate UI
      this.populateProfileSelect();
      this.populateWildcardCategories();

      this.isInitialized = true;
      
      // Make the UI instance globally accessible for PromptKit
      window.promptKitUI = this;
      
      console.log('PromptKit UI initialized successfully');
    } catch (error) {
      console.error('Error initializing PromptKit UI:', error);
    }
  }

  /**
   * Setup event listeners for the PromptKit modal
   */
  setupEventListeners() {
    try {
      // Profile selection
      if (this.profileSelect) {
        this.profileSelect.addEventListener('change', (e) => {
          promptKit.setSelectedProfile(e.target.value);
          this.updatePrompt();
        });
      }

      // Action buttons
      const clearBtn = document.getElementById('promptKitClearBtn');
      const saveBtn = document.getElementById('promptKitSaveBtn');
      const cancelBtn = document.getElementById('promptKitCancelBtn');

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearAll();
        });
      }

      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          this.saveAsSnippet();
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.closeModal();
        });
      }

      // Profile creator buttons
      if (this.createProfileBtn) {
        this.createProfileBtn.addEventListener('click', () => {
          this.createNewProfile();
        });
      }

      if (this.clearProfileFormBtn) {
        this.clearProfileFormBtn.addEventListener('click', () => {
          this.clearProfileForm();
        });
      }



    } catch (error) {
      console.error('Error setting up PromptKit event listeners:', error);
    }
  }

  /**
   * Populate the profile select
   */
  populateProfileSelect() {
    if (!this.profileSelect) return;
    
    this.profileSelect.innerHTML = '<option value="">Select a profile...</option>';
    
    const profiles = promptKit.getProfiles();
    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = `${profile.name} - ${profile.description}`;
      this.profileSelect.appendChild(option);
    });
  }

  /**
   * Populate the wildcard categories
   */
  populateWildcardCategories() {
    if (!this.wildcardCategoriesContainer) return;
    
    this.wildcardCategoriesContainer.innerHTML = '';
    
    const categories = promptKit.getWildcardCategories();
    categories.forEach(category => {
      const categoryElement = this.createWildcardCategoryElement(category);
      this.wildcardCategoriesContainer.appendChild(categoryElement);
    });
    
    // Initialize all Feather icons in the wildcard categories container
    replaceFeatherIcons(this.wildcardCategoriesContainer);
  }

  /**
   * Create a wildcard category element with improved layout
   */
  createWildcardCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'promptkit-wildcard-category';
    categoryDiv.setAttribute('data-category', category.id); // Add data attribute for randomization
    
    const header = document.createElement('div');
    header.className = 'promptkit-wildcard-category-header';
    
    // Create header content container
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';
    headerContent.textContent = category.name;
    if (category.description) {
      headerContent.title = category.description;
    }
    
    // Create randomize category button
    const randomizeCategoryBtn = document.createElement('button');
    randomizeCategoryBtn.className = 'category-randomize-btn';
    randomizeCategoryBtn.innerHTML = '<i data-feather="shuffle"></i>';
    randomizeCategoryBtn.title = `Randomize all wildcards in ${category.name}`;
    
    // Add click handler for category randomize button
    randomizeCategoryBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent category header click
      this.randomizeCategory(category);
    });
    
    // Add click handler for collapse/expand
    header.addEventListener('click', () => {
      categoryDiv.classList.toggle('expanded');
    });
    
    header.appendChild(headerContent);
    header.appendChild(randomizeCategoryBtn);
    
    const wildcardsGrid = document.createElement('div');
    wildcardsGrid.className = 'promptkit-wildcard-grid';
    
    category.wildcards.forEach(wildcard => {
      const wildcardElement = this.createWildcardElement(category, wildcard);
      wildcardsGrid.appendChild(wildcardElement);
    });
    
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(wildcardsGrid);
    
    // Start with first category expanded for better UX
    if (category === promptKit.getWildcardCategories()[0]) {
      setTimeout(() => {
        categoryDiv.classList.add('expanded');
      }, 100);
    }
    
    // Initialize Feather icon after adding to DOM
    replaceFeatherIcons(header);
    
    return categoryDiv;
  }

  /**
   * Create a wildcard element with dice button and section selector
   */
  createWildcardElement(category, wildcard) {
    const wildcardDiv = document.createElement('div');
    wildcardDiv.className = 'promptkit-wildcard-item';
    
    const wildcardInfo = document.createElement('div');
    wildcardInfo.className = 'wildcard-info';
    
    const wildcardName = document.createElement('div');
    wildcardName.className = 'wildcard-name';
    wildcardName.textContent = wildcard.name;
    
    const wildcardCount = document.createElement('div');
    wildcardCount.className = 'wildcard-count';
    wildcardCount.textContent = `${wildcard.items.length} items`;
    
    wildcardInfo.appendChild(wildcardName);
    wildcardInfo.appendChild(wildcardCount);
    
    // Add section selector
    const sectionSelector = document.createElement('select');
    sectionSelector.className = 'wildcard-section-selector';
    sectionSelector.innerHTML = `
      <option value="middle">Middle</option>
      <option value="top">Top</option>
      <option value="bottom">Bottom</option>
    `;
    sectionSelector.title = 'Select which section this wildcard goes to';
    
    // Store section preference
    const wildcardId = `${category.id}_${wildcard.id}`;
    sectionSelector.addEventListener('change', (e) => {
      if (!this.wildcardSections) this.wildcardSections = {};
      this.wildcardSections[wildcardId] = e.target.value;
      this.updatePrompt();
    });
    
    // Create lock/unlock toggle button
    const lockButton = document.createElement('button');
    lockButton.className = 'wildcard-lock-btn';
    lockButton.innerHTML = '<i data-feather="unlock"></i>';
    lockButton.title = `Lock/Unlock ${wildcard.name} from randomization`;
    
    // Initialize lock state (default: unlocked)
    if (!this.wildcardLocks) this.wildcardLocks = {};
    if (!this.wildcardLocks[wildcardId]) this.wildcardLocks[wildcardId] = false;
    
    // Update lock button appearance
    this.updateLockButtonAppearance(lockButton, this.wildcardLocks[wildcardId]);
    
    // Add click handler for lock button
    lockButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent category header click
      this.toggleWildcardLock(category, wildcard, lockButton);
    });
    
    const diceButton = document.createElement('button');
    diceButton.className = 'dice-button';
    diceButton.innerHTML = '<i data-feather="refresh-cw"></i>';
    diceButton.title = `Randomize ${wildcard.name} (${wildcard.items.length} items)`;
    
    // Add click handler for dice button
    diceButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent category header click
      this.rollWildcard(category, wildcard);
    });
    
    // Create a horizontal controls row for the three elements
    const controlsRow = document.createElement('div');
    controlsRow.className = 'wildcard-controls-row';
    
    controlsRow.appendChild(lockButton);
    controlsRow.appendChild(sectionSelector);
    controlsRow.appendChild(diceButton);
    
    wildcardDiv.appendChild(wildcardInfo);
    wildcardDiv.appendChild(controlsRow);
    
    // Initialize Feather icon after adding to DOM
    replaceFeatherIcons(wildcardDiv);
    
    return wildcardDiv;
  }

  /**
   * Roll a wildcard and add it to the prompt
   */
  rollWildcard(category, wildcard) {
    try {
      const wildcardId = `${category.id}_${wildcard.id}`; // Use combination of category and wildcard ID
      
      // Check if wildcard is locked
      if (this.wildcardLocks && this.wildcardLocks[wildcardId]) {
        showToast(`${wildcard.name} is locked and cannot be randomized`, 'warning');
        return;
      }
      
      // Get a random item from the wildcard
      const randomItem = wildcard.items[Math.floor(Math.random() * wildcard.items.length)];
      const previousItem = this.wildcardSelections[wildcardId];
      
      if (previousItem) {
        // Replace the previous item from this specific wildcard
        showToast(`Replaced: ${previousItem} → ${randomItem}`, 'success');
      } else {
        // Add new item from this wildcard
        showToast(`Added: ${randomItem}`, 'success');
      }
      
      // Store the new selection for this wildcard
      this.wildcardSelections[wildcardId] = randomItem;
      
      // Update the prompt using the PromptKit system
      this.updatePrompt();
      
      // Add some visual feedback to the dice button
      const diceButton = event.target.closest('.dice-button');
      if (diceButton) {
        diceButton.style.transform = 'scale(1.1)';
        setTimeout(() => {
          diceButton.style.transform = 'scale(1)';
        }, 200);
      }
      
    } catch (error) {
      console.error('Error rolling wildcard:', error);
      showToast('Error rolling wildcard', 'error');
    }
  }

  /**
   * Update the prompt display
   */
  updatePromptDisplay() {
    if (this.positiveOutput) {
      this.positiveOutput.value = this.currentPrompt;
    }
  }

  /**
   * Update the prompt based on selected profile and wildcards
   */
  updatePrompt() {
    try {
      // Get the assembled prompt from PromptKit
      const prompts = promptKit.assemblePrompts();
      
      // Update all sections
      if (this.topSection) {
        this.topSection.value = prompts.topSection;
      }
      if (this.middleSection) {
        this.middleSection.value = prompts.middleSection;
      }
      if (this.bottomSection) {
        this.bottomSection.value = prompts.bottomSection;
      }
      if (this.positiveOutput) {
        this.positiveOutput.value = prompts.positive;
      }
      
    } catch (error) {
      console.error('Error updating prompt:', error);
    }
  }

  /**
   * Clean and deduplicate a prompt
   */
  cleanPrompt(prompt) {
    if (!prompt) return '';
    
    // Split by commas, clean each item, and deduplicate
    const items = prompt
      .split(',')
      .map(item => item.trim())
      .filter(item => item && item.length > 0);
    
    // Remove duplicates while preserving order
    const uniqueItems = [];
    const seen = new Set();
    
    for (const item of items) {
      if (!seen.has(item.toLowerCase())) {
        seen.add(item.toLowerCase());
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems.join(', ');
  }

  /**
   * Clear all selections
   */
  clearAll() {
    try {
      // Clear current prompt
      this.currentPrompt = '';
      
      // Clear wildcard selections and section assignments
      this.wildcardSelections = {};
      this.wildcardSections = {};
      
      // Clear UI
      if (this.profileSelect) {
        this.profileSelect.value = '';
      }
      promptKit.setSelectedProfile(null);
      
      // Reset all section selectors to middle
      const sectionSelectors = document.querySelectorAll('.wildcard-section-selector');
      sectionSelectors.forEach(selector => {
        selector.value = 'middle';
      });
      
      // Update display
      this.updatePromptDisplay();
      this.updatePrompt();
      
      showToast('All selections cleared', 'success');
    } catch (error) {
      console.error('Error clearing selections:', error);
      showToast('Error clearing selections', 'error');
    }
  }



  /**
   * Save current configuration as a snippet
   */
  async saveAsSnippet() {
    try {
      const snippetName = document.getElementById('promptKitSnippetName').value.trim();
      const snippetTags = document.getElementById('promptKitSnippetTags').value.trim();
      const snippetFolder = document.getElementById('promptKitSnippetFolder').value;
      
      if (!snippetName) {
        showToast('Please enter a snippet name', 'error');
        return;
      }
      
      // Get the current prompt
      const positivePrompt = this.positiveOutput ? this.positiveOutput.value : '';
      
      // Generate filename
      const timestamp = Date.now();
      const filename = `${snippetName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.json`;
      
      // Determine file path
      let filePath;
      if (snippetFolder) {
        filePath = `snippets/${snippetFolder}/${filename}`;
      } else {
        filePath = `snippets/${filename}`;
      }
      
      // Create snippet metadata
      const snippetMetadata = {
        id: `snippet_${timestamp}`,
        text: positivePrompt,
        tags: snippetTags ? snippetTags.split(',').map(tag => tag.trim()) : [],
        created: Date.now(),
        modified: Date.now(),
        title: snippetName,
        description: 'Generated with PromptKit',
        category: snippetFolder || '',
        version: '1.0'
      };
      
      console.log('Saving snippet to:', filePath);
      console.log('Snippet metadata:', snippetMetadata);
      
      // Save the snippet file
      const jsonContent = JSON.stringify(snippetMetadata, null, 2);
      await window.electronAPI.writeFile(filePath, jsonContent);
      
      // Add to AppState
      const snippets = AppState.getSnippets();
      // Use the same key format as the filesystem (without 'snippets/' prefix)
      const appStateKey = filePath.replace('snippets/', '');
      snippets[appStateKey] = snippetMetadata;
      AppState.setSnippets(snippets);
      console.log('Added to AppState with key:', appStateKey);
      console.log('Current AppState snippets:', Object.keys(snippets));
      
      // Add to sidebar tree (following the same pattern as the main app)
      if (!window.sidebarTree) window.sidebarTree = [];
      console.log('Current sidebar tree before adding snippet:', window.sidebarTree);
      
      const snippetEntry = {
        type: 'snippet',
        name: snippetName,
        path: appStateKey, // Use the same key format as AppState
        content: snippetMetadata
      };
      
      console.log('Adding snippet entry:', snippetEntry);
      
      if (snippetFolder) {
        // Find the folder in the tree and add the snippet to it
        const addToFolder = (tree, folderPath) => {
          for (const entry of tree) {
            if (entry.type === 'folder' && entry.path === folderPath) {
              if (!entry.children) entry.children = [];
              entry.children.push(snippetEntry);
              return true;
            }
            if (entry.children && entry.children.length > 0) {
              if (addToFolder(entry.children, folderPath)) {
                return true;
              }
            }
          }
          return false;
        };
        if (!addToFolder(window.sidebarTree, snippetFolder)) {
          // If folder not found, add to root
          window.sidebarTree.push(snippetEntry);
        }
      } else {
        // Add to root
        window.sidebarTree.push(snippetEntry);
      }
      
      console.log('Sidebar tree after adding snippet:', window.sidebarTree);
      
      // Refresh sidebar (exact same pattern as createSnippet)
      const foldersContainer = document.getElementById('foldersContainer');
      if (foldersContainer && window.sidebarTree) {
        renderSidebar(window.sidebarTree, foldersContainer);
        console.log('Sidebar refreshed successfully');
      } else {
        console.warn('Could not refresh sidebar - missing dependencies');
        console.log('foldersContainer:', !!foldersContainer);
        console.log('window.sidebarTree:', !!window.sidebarTree);
      }
      
      // Reload snippets to ensure drag-and-drop works
      try {
        console.log('Reloading snippets for drag-and-drop...');
        const reloadedSnippets = await loadSnippetsFromFiles();
        AppState.setSnippets(reloadedSnippets);
        console.log('Snippets reloaded successfully');
        console.log('Reloaded snippets keys:', Object.keys(reloadedSnippets));
      } catch (reloadError) {
        console.warn('Error reloading snippets:', reloadError);
      }
      
      // Close modal
      this.closeModal();
      
      showToast(`Snippet "${snippetName}" saved successfully!`, 'success');
      
    } catch (error) {
      console.error('Error saving PromptKit snippet:', error);
      showToast('Error saving snippet', 'error');
    }
  }

  /**
   * Open the PromptKit modal
   */
  async openModal() {
    if (!this.isInitialized) {
      await this.init();
    }
    
    // Refresh wildcard categories before opening modal
    try {
      const refreshResult = await promptKit.refreshWildcardCategories();
      
      if (refreshResult.success) {
        // Re-populate the wildcard categories in the UI
        this.populateWildcardCategories();
        
        // Show feedback about changes
        if (refreshResult.newCategories.length > 0) {
          showToast(`Found ${refreshResult.newCategories.length} new wildcard category${refreshResult.newCategories.length > 1 ? 'ies' : ''}: ${refreshResult.newCategories.join(', ')}`, 'success');
        }
        
        if (refreshResult.removedCategories.length > 0) {
          showToast(`Removed ${refreshResult.removedCategories.length} wildcard category${refreshResult.removedCategories.length > 1 ? 'ies' : ''}: ${refreshResult.removedCategories.join(', ')}`, 'info');
        }
      } else {
        console.warn('Error refreshing wildcard categories:', refreshResult.error);
      }
    } catch (error) {
      console.warn('Error refreshing wildcard categories:', error);
    }
    
    if (this.modal) {
      this.modal.style.display = 'flex';
      
      // Clear any existing prompt
      this.currentPrompt = '';
      
      // Clear wildcard selections
      this.wildcardSelections = {};
      
      // Update display
      this.updatePromptDisplay();
      this.updatePrompt();
      
      // Populate profile select
      this.populateProfileSelect();
      
      // Populate folder dropdown
      const folderSelect = document.getElementById('promptKitSnippetFolder');
      if (folderSelect) {
        this.populateFolderDropdown(folderSelect);
      }
      
      // Initialize Feather icons after modal is displayed
      setTimeout(() => {
        replaceFeatherIcons(this.modal);
        
        // Retry populating folder dropdown in case sidebar wasn't loaded yet
        if (folderSelect && folderSelect.children.length <= 1) {
          setTimeout(() => {
            this.populateFolderDropdown(folderSelect);
          }, 200);
        }
      }, 100);
    }
  }

  /**
   * Close the PromptKit modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Populate folder dropdown
   */
  populateFolderDropdown(selectElement) {
    selectElement.innerHTML = '<option value="">Root folder</option>';
    
    // Try to get sidebar tree from different sources
    let sidebarTree = window.sidebarTree;
    
    if (!sidebarTree && window.bootstrap && window.bootstrap.getSidebarTree) {
      sidebarTree = window.bootstrap.getSidebarTree();
    }
    
    if (!sidebarTree && window.AppState) {
      sidebarTree = window.AppState.getSidebarTree();
    }
    
    if (!sidebarTree) {
      console.warn('No sidebar tree available for folder dropdown');
      return;
    }
    
    const addFolders = (folders, prefix = '') => {
      folders.forEach(item => {
        if (item.type === 'folder') {
          const option = document.createElement('option');
          option.value = item.path;
          option.textContent = prefix + item.name;
          selectElement.appendChild(option);
          
          if (item.children) {
            addFolders(item.children, prefix + '  ');
          }
        }
      });
    };
    
    addFolders(sidebarTree);
  }

  /**
   * Update lock button appearance based on lock state
   */
  updateLockButtonAppearance(lockButton, isLocked) {
    if (isLocked) {
      lockButton.innerHTML = '<i data-feather="lock"></i>';
      lockButton.classList.add('locked');
      lockButton.title = 'Unlock wildcard (currently locked)';
    } else {
      lockButton.innerHTML = '<i data-feather="unlock"></i>';
      lockButton.classList.remove('locked');
      lockButton.title = 'Lock wildcard (currently unlocked)';
    }
    // Reinitialize Feather icon
    replaceFeatherIcons(lockButton);
  }

  /**
   * Toggle wildcard lock state
   */
  toggleWildcardLock(category, wildcard, lockButton) {
    const wildcardId = `${category.id}_${wildcard.id}`;
    this.wildcardLocks[wildcardId] = !this.wildcardLocks[wildcardId];
    
    const isLocked = this.wildcardLocks[wildcardId];
    this.updateLockButtonAppearance(lockButton, isLocked);
    
    if (isLocked) {
      showToast(`${wildcard.name} locked - won't be randomized`, 'info');
    } else {
      showToast(`${wildcard.name} unlocked - can be randomized`, 'info');
    }
  }

  /**
   * Create a new profile
   */
  async createNewProfile() {
    try {
      const name = this.newProfileName.value.trim();
      const description = this.newProfileDescription.value.trim();
      const positiveText = this.newProfilePositive.value.trim();

      if (!name) {
        showToast('Profile name is required', 'error');
        return;
      }

      if (!positiveText) {
        showToast('Positive prompts are required', 'error');
        return;
      }

      // Parse prompts
      const positive = positiveText.split(',').map(p => p.trim()).filter(p => p);

      // Create profile object
      const profile = {
        id: `profile_${Date.now()}`,
        name: name,
        description: description || 'Custom profile',
        positive: positive,
        negative: []
      };

      // Save profile to file
      const profileContent = JSON.stringify(profile, null, 2);
      const filename = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      const filePath = `profiles/${filename}`;

      await window.electronAPI.writeFile(filePath, profileContent);

      // Refresh profiles
      await promptKit.loadProfiles();
      this.populateProfileSelect();

      // Clear form
      this.clearProfileForm();

      showToast(`Profile "${name}" created successfully!`, 'success');
    } catch (error) {
      console.error('Error creating profile:', error);
      showToast('Error creating profile', 'error');
    }
  }

  /**
   * Clear the profile creation form
   */
  clearProfileForm() {
    if (this.newProfileName) this.newProfileName.value = '';
    if (this.newProfileDescription) this.newProfileDescription.value = '';
    if (this.newProfilePositive) this.newProfilePositive.value = '';
  }

  /**
   * Create a profile from snippet content
   */
  createProfileFromSnippet(snippet) {
    try {
      if (!snippet || !snippet.text) {
        showToast('No snippet content to create profile from', 'error');
        return;
      }

      // Populate the profile creation form with snippet content
      if (this.newProfileName) {
        // Generate a profile name from the snippet text
        const snippetText = snippet.text.trim();
        const words = snippetText.split(/\s+/).slice(0, 3); // Take first 3 words
        const profileName = words.join(' ').substring(0, 30); // Limit to 30 chars
        this.newProfileName.value = profileName;
      }

      if (this.newProfileDescription) {
        this.newProfileDescription.value = `Profile created from snippet: ${snippet.text.substring(0, 100)}${snippet.text.length > 100 ? '...' : ''}`;
      }

      if (this.newProfilePositive) {
        // Use the snippet text as the positive prompts
        this.newProfilePositive.value = snippet.text.trim();
      }

      // Switch to profile creation section if it exists
      const profileSection = document.querySelector('.promptkit-profile-creator');
      if (profileSection) {
        profileSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Focus on the profile name field
      if (this.newProfileName) {
        this.newProfileName.focus();
        this.newProfileName.select();
      }

      showToast('Profile form populated from snippet!', 'success');
    } catch (error) {
      console.error('Error creating profile from snippet:', error);
      showToast('Error populating profile form', 'error');
    }
  }

  /**
   * Randomize all wildcards in a category
   */
  async randomizeCategory(category) {
    try {
      const wildcards = category.wildcards;
      if (wildcards.length === 0) {
        showToast('No wildcards to randomize in this category', 'info');
        return;
      }

      let randomizedCount = 0;
      let replacedCount = 0;

      // Randomize ALL wildcards in the category (respecting locks)
      for (const wildcard of wildcards) {
        const wildcardId = `${category.id}_${wildcard.id}`;
        
        // Skip locked wildcards
        if (this.wildcardLocks && this.wildcardLocks[wildcardId]) {
          continue;
        }
        
        const randomItem = wildcard.items[Math.floor(Math.random() * wildcard.items.length)];
        const previousItem = this.wildcardSelections[wildcardId];

        if (previousItem) {
          replacedCount++;
        } else {
          randomizedCount++;
        }

        this.wildcardSelections[wildcardId] = randomItem;
      }

      // Update the prompt with all new selections
      this.updatePrompt();

      // Add visual feedback to the category header
      const categoryHeader = document.querySelector(`[data-category="${category.id}"]`);
      if (categoryHeader) {
        categoryHeader.style.transform = 'scale(1.02)';
        setTimeout(() => {
          categoryHeader.style.transform = 'scale(1)';
        }, 200);
      }

      // Show comprehensive feedback
      if (replacedCount > 0 && randomizedCount > 0) {
        showToast(`Randomized ${randomizedCount} new wildcards and replaced ${replacedCount} existing ones in ${category.name}`, 'success');
      } else if (replacedCount > 0) {
        showToast(`Replaced ${replacedCount} wildcards in ${category.name}`, 'success');
      } else {
        showToast(`Randomized ${randomizedCount} wildcards in ${category.name}`, 'success');
      }
    } catch (error) {
      console.error('Error randomizing category:', error);
      showToast('Error randomizing category', 'error');
    }
  }
}

// Create and export a singleton instance
const promptKitUI = new PromptKitUI();

export { PromptKitUI, promptKitUI };
