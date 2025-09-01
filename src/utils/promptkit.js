/**
 * PromptKit - JSON-Driven Prompt Builder
 * Handles loading configurations, managing selections, and assembling prompts
 */

class PromptKit {
  constructor() {
    this.wildcardCategories = [];
    this.macros = [];
    this.defaults = [];
    this.profiles = [];
    this.currentSelections = {};
    this.selectedProfile = null;
  }

  /**
   * Load wildcard categories from the wildcards folder
   */
  async loadWildcardCategories() {
    try {
      const wildcardsPath = 'wildcards';
      
      // Check if wildcards folder exists
      const folderExists = await window.electronAPI.exists(wildcardsPath);
      if (!folderExists) {
        console.warn('Wildcards folder not found, creating default structure');
        await this.createDefaultWildcardStructure();
      }

      // Get all subfolders in the wildcards directory
      const items = await window.electronAPI.readdir(wildcardsPath);
      console.log('Found items in wildcards folder:', items.map(item => ({ name: item.name, isDirectory: item.isDirectory })));
      this.wildcardCategories = [];

      for (const item of items) {
        if (item.isDirectory) {
          const categoryPath = `${wildcardsPath}/${item.name}`;
          const category = {
            id: item.name,
            name: this.formatCategoryName(item.name),
            description: `Wildcards from ${item.name} folder`,
            path: categoryPath,
            wildcards: []
          };

          // Load all .txt files in this category
          const categoryItems = await window.electronAPI.readdir(categoryPath);
          for (const wildcardItem of categoryItems) {
            if (wildcardItem.isFile && wildcardItem.name.endsWith('.txt')) {
              const wildcardPath = `${categoryPath}/${wildcardItem.name}`;
              const wildcardContent = await window.electronAPI.readFile(wildcardPath);
              
              // Parse wildcard content (one item per line)
              const items = wildcardContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .map(item => item.replace(/^[-*]\s*/, '')); // Remove leading dashes or asterisks

              if (items.length > 0) {
                category.wildcards.push({
                  id: wildcardItem.name.replace('.txt', ''),
                  name: this.formatWildcardName(wildcardItem.name),
                  description: `${items.length} items`,
                  items: items
                });
              }
            }
          }

          // Always add the category, even if it has no wildcards yet
          this.wildcardCategories.push(category);
          console.log(`Added category: ${category.name} with ${category.wildcards.length} wildcards`);
        }
      }

      console.log(`Loaded ${this.wildcardCategories.length} wildcard categories`);
      return true;
    } catch (error) {
      console.error('Error loading wildcard categories:', error);
      return false;
    }
  }

  /**
   * Create default wildcard structure if it doesn't exist
   */
  async createDefaultWildcardStructure() {
    try {
      const wildcardsPath = 'wildcards';
      await window.electronAPI.createFolder(wildcardsPath);

      // Create some default categories
      const defaultCategories = [
        {
          name: 'character',
          files: {
            'gender.txt': 'male\nfemale\nnon-binary',
            'age.txt': 'young\nadult\nelderly',
            'hair_color.txt': 'blonde\nbrown\nblack\nred\ngray',
            'hair_style.txt': 'long hair\nshort hair\ncurly hair\nstraight hair\nwavy hair',
            'eye_color.txt': 'blue eyes\nbrown eyes\ngreen eyes\ngray eyes\nhazel eyes'
          }
        },
        {
          name: 'clothing',
          files: {
            'style.txt': 'casual\nformal\nfantasy\nsci-fi\nmilitary\nvintage',
            'type.txt': 'dress\nsuit\nshirt\npants\nskirt\njacket'
          }
        },
        {
          name: 'scene',
          files: {
            'setting.txt': 'urban\nnature\nindoor\nfantasy world\nspace\nunderwater',
            'lighting.txt': 'natural light\ndramatic light\nsoft light\ngolden hour\nnight\nartificial light'
          }
        },
        {
          name: 'art_style',
          files: {
            'style.txt': 'photorealistic\nanime\npainterly\ndigital art\nsketch\nwatercolor',
            'quality.txt': 'masterpiece\nbest quality\nhighly detailed\nprofessional\nbeautiful'
          }
        }
      ];

      for (const category of defaultCategories) {
        const categoryPath = `${wildcardsPath}/${category.name}`;
        await window.electronAPI.createFolder(categoryPath);

        for (const [filename, content] of Object.entries(category.files)) {
          const filePath = `${categoryPath}/${filename}`;
          await window.electronAPI.writeFile(filePath, content);
        }
      }

      console.log('Created default wildcard structure');
    } catch (error) {
      console.error('Error creating default wildcard structure:', error);
    }
  }

  /**
   * Format category name for display
   */
  formatCategoryName(name) {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format wildcard name for display
   */
  formatWildcardName(name) {
    return name
      .replace('.txt', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Refresh wildcard categories from filesystem
   */
  async refreshWildcardCategories() {
    try {
      console.log('Refreshing wildcard categories...');
      
      // Store previous categories for comparison
      const previousCategories = this.wildcardCategories.map(cat => cat.id);
      console.log('Previous categories:', previousCategories);
      
      // Reload all categories from filesystem
      await this.loadWildcardCategories();
      
      // Compare with previous categories
      const currentCategories = this.wildcardCategories.map(cat => cat.id);
      const newCategories = currentCategories.filter(cat => !previousCategories.includes(cat));
      const removedCategories = previousCategories.filter(cat => !currentCategories.includes(cat));
      
      console.log(`Refreshed ${this.wildcardCategories.length} wildcard categories`);
      
      if (newCategories.length > 0) {
        console.log('New categories detected:', newCategories);
      }
      
      if (removedCategories.length > 0) {
        console.log('Removed categories:', removedCategories);
      }
      
      // Log all current categories
      console.log('Current categories:', currentCategories);
      
      return {
        success: true,
        totalCategories: this.wildcardCategories.length,
        newCategories: newCategories,
        removedCategories: removedCategories,
        currentCategories: currentCategories
      };
    } catch (error) {
      console.error('Error refreshing wildcard categories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load profiles from the profiles folder
   */
  async loadProfiles() {
    try {
      const profilesPath = 'profiles';
      
      // Check if profiles folder exists
      const folderExists = await window.electronAPI.exists(profilesPath);
      if (!folderExists) {
        console.warn('Profiles folder not found');
        this.profiles = [];
        return true;
      }

      // Get all files in the profiles directory
      const items = await window.electronAPI.readdir(profilesPath);
      this.profiles = [];

      for (const item of items) {
        if (item.isFile && (item.name.endsWith('.json') || item.name.endsWith('.txt'))) {
          const filePath = `${profilesPath}/${item.name}`;
          const fileContent = await window.electronAPI.readFile(filePath);
          
          let profile;
          if (item.name.endsWith('.json')) {
            // Parse JSON profile
            profile = JSON.parse(fileContent);
          } else if (item.name.endsWith('.txt')) {
            // Parse TXT profile
            profile = this.parseTextProfile(fileContent, item.name);
          }

          if (profile) {
            this.profiles.push(profile);
          }
        }
      }

      console.log(`Loaded ${this.profiles.length} profiles`);
      return true;
    } catch (error) {
      console.error('Error loading profiles:', error);
      return false;
    }
  }

  /**
   * Parse a text-based profile file
   */
  parseTextProfile(content, filename) {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 3) {
        console.warn(`Invalid text profile format in ${filename}`);
        return null;
      }

      const name = lines[0];
      const description = lines[1];
      
      let positive = [];
      let negative = [];
      
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().startsWith('positive:')) {
          positive = line.substring(9).split(',').map(item => item.trim()).filter(item => item);
        } else if (line.toLowerCase().startsWith('negative:')) {
          negative = line.substring(9).split(',').map(item => item.trim()).filter(item => item);
        }
      }

      return {
        id: filename.replace(/\.(json|txt)$/, ''),
        name: name,
        description: description,
        positive: positive,
        negative: negative
      };
    } catch (error) {
      console.error(`Error parsing text profile ${filename}:`, error);
      return null;
    }
  }

  /**
   * Load configurations (now just loads wildcards and keeps existing macros/defaults)
   */
  async loadConfigurations() {
    try {
      // Load wildcard categories
      const wildcardsSuccess = await this.loadWildcardCategories();
      if (!wildcardsSuccess) {
        console.error('Failed to load wildcard categories');
        return false;
      }

      // Load profiles
      const profilesSuccess = await this.loadProfiles();
      if (!profilesSuccess) {
        console.error('Failed to load profiles');
        return false;
      }

      // Macros and defaults are no longer used in the wildcard system
      this.macros = [];
      this.defaults = [];

      console.log('PromptKit configurations loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading PromptKit configurations:', error);
      return false;
    }
  }

  /**
   * Get all wildcard categories
   */
  getWildcardCategories() {
    return this.wildcardCategories;
  }

  /**
   * Get all profiles
   */
  getProfiles() {
    return this.profiles;
  }

  /**
   * Set selected profile
   */
  setSelectedProfile(profileId) {
    this.selectedProfile = profileId;
  }

  /**
   * Get selected profile
   */
  getSelectedProfile() {
    return this.profiles.find(profile => profile.id === this.selectedProfile);
  }



  /**
   * Set a selection for a wildcard category
   */
  setSelection(categoryId, wildcardIds) {
    if (Array.isArray(wildcardIds)) {
      this.currentSelections[categoryId] = wildcardIds;
    } else {
      this.currentSelections[categoryId] = [wildcardIds];
    }
  }

  /**
   * Get current selections for a wildcard category
   */
  getSelection(categoryId) {
    return this.currentSelections[categoryId] || [];
  }

  /**
   * Clear all selections
   */
  clearSelections() {
    this.currentSelections = {};
  }



  /**
   * Get all selected wildcard items
   */
  getSelectedWildcardItems() {
    const selectedItems = [];
    
    // Get wildcard selections from the UI
    if (window.promptKitUI && window.promptKitUI.wildcardSelections) {
      for (const [wildcardId, selectedItem] of Object.entries(window.promptKitUI.wildcardSelections)) {
        selectedItems.push(selectedItem);
      }
    }
    
    return selectedItems;
  }

  /**
   * Get selected macros
   */
  getSelectedMacroItems() {
    const selectedItems = [];
    
    for (const macroId of this.selectedMacros) {
      const macro = this.macros.find(m => m.id === macroId);
      if (macro) {
        selectedItems.push(macro.replace);
      }
    }
    
    return selectedItems;
  }

  /**
   * Get selected defaults profile
   */
  getSelectedDefaultsProfile() {
    if (!this.selectedDefaults) return null;
    return this.defaults.find(d => d.id === this.selectedDefaults);
  }

  /**
   * Apply macros to a prompt
   */
  applyMacros(prompt) {
    let result = prompt;
    
    for (const macro of this.macros) {
      if (this.selectedMacros.includes(macro.id)) {
        if (macro.find) {
          result = result.replace(new RegExp(macro.find, 'g'), macro.replace);
        } else {
          // If no find pattern, just append the replace text
          result = result + ', ' + macro.replace;
        }
      }
    }
    
    return result;
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
   * Assemble the final positive and negative prompts
   */
  assemblePrompts() {
    const selectedItems = this.getSelectedWildcardItems();
    const selectedProfile = this.getSelectedProfile();
    
    // Build sections
    let topSection = '';
    let middleSection = '';
    let bottomSection = '';
    
    // Add profile positive prompts to top section
    if (selectedProfile && selectedProfile.positive) {
      topSection = selectedProfile.positive.join(', ');
    }
    
    // Add selected wildcard items to their assigned sections
    if (selectedItems.length > 0) {
      const topItems = [];
      const middleItems = [];
      const bottomItems = [];
      
      // Get section assignments from UI
      const sectionAssignments = window.promptKitUI?.wildcardSections || {};
      
      for (const [wildcardId, selectedItem] of Object.entries(window.promptKitUI?.wildcardSelections || {})) {
        const section = sectionAssignments[wildcardId] || 'middle'; // Default to middle
        switch (section) {
          case 'top':
            topItems.push(selectedItem);
            break;
          case 'middle':
            middleItems.push(selectedItem);
            break;
          case 'bottom':
            bottomItems.push(selectedItem);
            break;
        }
      }
      
      if (topItems.length > 0) {
        topSection = topSection ? topSection + ', ' + topItems.join(', ') : topItems.join(', ');
      }
      if (middleItems.length > 0) {
        middleSection = middleItems.join(', ');
      }
      if (bottomItems.length > 0) {
        bottomSection = bottomItems.join(', ');
      }
    }
    
    // Combine all sections into final prompt
    const sections = [topSection, middleSection, bottomSection].filter(section => section.trim());
    const positivePrompt = sections.join(', ');
    
    // Clean the prompt
    const cleanedPositive = this.cleanPrompt(positivePrompt);
    
    // Build negative prompt
    let negativePrompt = '';
    
    if (selectedProfile && selectedProfile.negative) {
      negativePrompt += selectedProfile.negative.join(', ');
    }
    
    negativePrompt = this.cleanPrompt(negativePrompt);
    
    return {
      topSection: topSection,
      middleSection: middleSection,
      bottomSection: bottomSection,
      positive: cleanedPositive,
      negative: negativePrompt
    };
  }

  /**
   * Get preview data for the UI
   */
  getPreview() {
    const selectedItems = this.getSelectedWildcardItems();
    const selectedMacroItems = this.getSelectedMacroItems();
    const defaultsProfile = this.getSelectedDefaultsProfile();
    
    return {
      defaultsProfile: defaultsProfile ? defaultsProfile.name : 'None',
      selectedTags: selectedItems,
      selectedMacros: selectedMacroItems,
      positive: this.assemblePrompts().positive,
      negative: this.assemblePrompts().negative
    };
  }

  /**
   * Export current configuration as snippet data
   */
  exportAsSnippet() {
    const prompts = this.assemblePrompts();
    
    return {
      text: prompts.positive,
      negativeText: prompts.negative,
      promptkit: {
        selections: this.currentSelections,
        selectedMacros: this.selectedMacros,
        selectedDefaults: this.selectedDefaults,
        extraPositive: this.extraPositive,
        extraNegative: this.extraNegative
      }
    };
  }

  /**
   * Import configuration from snippet data
   */
  importFromSnippet(snippet) {
    if (!snippet.promptkit) return false;
    
    try {
      this.currentSelections = snippet.promptkit.selections || {};
      this.selectedMacros = snippet.promptkit.selectedMacros || [];
      this.selectedDefaults = snippet.promptkit.selectedDefaults || null;
      this.extraPositive = snippet.promptkit.extraPositive || '';
      this.extraNegative = snippet.promptkit.extraNegative || '';
      
      return true;
    } catch (error) {
      console.error('Error importing from snippet:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const promptKit = new PromptKit();

export { PromptKit, promptKit };
