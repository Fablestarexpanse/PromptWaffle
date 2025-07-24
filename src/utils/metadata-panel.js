import { showToast } from './toast.js';

class MetadataPanel {
  constructor() {
    this.isCollapsed = false;
    this.isLocked = false;
    this.currentBoardId = null;
    this.metadata = {
      checkpoint: '',
      cfg: '',
      seed: '',
      steps: '',
      sampler: '',
      scheduler: '',
      clipskip: '',
      size: '',
      negativePrompt: ''
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadMetadata();
    this.replaceFeatherIcons();
    
    // Initialize with current board ID
    this.initializeCurrentBoard();
  }

  async initializeCurrentBoard() {
    try {
      // Wait for AppState to be available
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (attempts < maxAttempts) {
        try {
          // Try to import AppState
          const { AppState } = await import('../state/appState.js');
          const currentBoard = AppState.getCurrentBoard();
          if (currentBoard) {
            this.currentBoardId = currentBoard.id;
            this.loadBoardMetadata(this.currentBoardId);
            this.loadBoardLockState(this.currentBoardId);
            console.log('Metadata panel initialized with board:', this.currentBoardId);
            return;
          }
        } catch (error) {
          // AppState not ready yet, continue waiting
        }
        
        // Wait 100ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Fallback: try to get from localStorage
      const savedBoardId = localStorage.getItem('currentBoardId');
      if (savedBoardId) {
        this.currentBoardId = savedBoardId;
        this.loadBoardMetadata(this.currentBoardId);
        this.loadBoardLockState(this.currentBoardId);
        console.log('Metadata panel initialized with saved board:', this.currentBoardId);
      } else {
        console.log('No board ID found for metadata panel initialization');
      }
    } catch (error) {
      console.warn('Failed to initialize current board for metadata panel:', error);
    }
  }

  setupEventListeners() {
    // Toggle button
    const toggleBtn = document.getElementById('toggleMetadataBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePanel());
    }

    // Lock button
    const lockBtn = document.getElementById('lockMetadataBtn');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => this.toggleLock());
    }

    // Action buttons
    const pasteBtn = document.getElementById('pasteMetadataBtn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', () => this.pasteMetadata());
    }

    const clearBtn = document.getElementById('clearMetadataBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearMetadata());
    }

    const copyBtn = document.getElementById('copyMetadataBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyMetadata());
    }

    // Auto-save on input changes
    this.setupAutoSave();
  }

  setupAutoSave() {
    const inputs = [
      'checkpointInput',
      'cfgInput', 
      'seedInput',
      'stepsInput',
      'samplerInput',
      'schedulerInput',
      'clipskipInput',
      'sizeInput',
      'negativePromptInput'
    ];

    inputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => {
          // Don't save if locked (user can't edit anyway)
          if (this.isLocked) return;
          
          this.updateMetadataFromInputs();
          if (this.currentBoardId) {
            this.saveBoardMetadata(this.currentBoardId);
          } else {
            this.saveToLocalStorage();
          }
        });
      }
    });
  }

  togglePanel() {
    const panel = document.querySelector('.metadata-panel');
    const toggleBtn = document.getElementById('toggleMetadataBtn');
    
    if (!panel || !toggleBtn) return;

    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      panel.classList.add('collapsed');
    } else {
      panel.classList.remove('collapsed');
    }

    // Update toggle button icon
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-feather', this.isCollapsed ? 'chevron-right' : 'chevron-left');
      if (window.feather) {
        window.feather.replace();
      }
    }
  }

  toggleLock() {
    this.isLocked = !this.isLocked;
    this.updateLockButton();
    this.updateInputFieldsState();
    this.saveBoardLockState();
    
    if (this.isLocked) {
      showToast('Metadata fields locked (read-only)', 'info');
    } else {
      showToast('Metadata fields unlocked (editable)', 'info');
    }
  }

  updateLockButton() {
    const lockBtn = document.getElementById('lockMetadataBtn');
    if (!lockBtn) return;

    const icon = lockBtn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-feather', this.isLocked ? 'lock' : 'unlock');
      if (window.feather) {
        window.feather.replace();
      }
    }

    if (this.isLocked) {
      lockBtn.classList.add('locked');
    } else {
      lockBtn.classList.remove('locked');
    }
  }

  updateInputFieldsState() {
    const inputs = [
      'checkpointInput',
      'cfgInput', 
      'seedInput',
      'stepsInput',
      'samplerInput',
      'schedulerInput',
      'clipskipInput',
      'sizeInput',
      'negativePromptInput'
    ];

    inputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.disabled = this.isLocked;
        input.style.opacity = this.isLocked ? '0.6' : '1';
        input.style.cursor = this.isLocked ? 'not-allowed' : 'text';
      }
    });

    // Disable paste and clear buttons when locked, but keep copy available
    const disabledWhenLocked = [
      'pasteMetadataBtn',
      'clearMetadataBtn'
    ];

    disabledWhenLocked.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = this.isLocked;
        btn.style.opacity = this.isLocked ? '0.6' : '1';
        btn.style.cursor = this.isLocked ? 'not-allowed' : 'pointer';
      }
    });

    // Copy button should always be available
    const copyBtn = document.getElementById('copyMetadataBtn');
    if (copyBtn) {
      copyBtn.disabled = false;
      copyBtn.style.opacity = '1';
      copyBtn.style.cursor = 'pointer';
    }
  }

  onBoardChange(boardId) {
    console.log('Metadata panel: Board change detected:', boardId, 'Current locked:', this.isLocked);
    
    // Always save current metadata and lock state before switching (if we have a current board)
    this.saveCurrentBoardMetadata();
    this.saveBoardLockState();
    
    // Always load metadata and lock state for new board
    this.currentBoardId = boardId;
    this.loadBoardMetadata(boardId);
    this.loadBoardLockState(boardId);
    
    console.log('Metadata panel: Switched to board metadata for:', boardId, 'Locked:', this.isLocked);
  }

  saveCurrentBoardMetadata() {
    if (this.currentBoardId) {
      this.updateMetadataFromInputs();
      this.saveBoardMetadata(this.currentBoardId);
    }
  }

  saveBoardMetadata(boardId) {
    try {
      const key = `promptWaffle_metadata_board_${boardId}`;
      localStorage.setItem(key, JSON.stringify(this.metadata));
      console.log('Metadata panel: Saved metadata for board:', boardId, this.metadata);
    } catch (error) {
      console.warn('Failed to save board metadata to localStorage:', error);
    }
  }

  loadBoardMetadata(boardId) {
    try {
      const key = `promptWaffle_metadata_board_${boardId}`;
      const saved = localStorage.getItem(key);
      console.log('Metadata panel: Loading metadata for board:', boardId, 'Found:', !!saved);
      
      if (saved) {
        this.metadata = { ...this.metadata, ...JSON.parse(saved) };
        this.updateInputsFromMetadata();
        console.log('Metadata panel: Loaded metadata:', this.metadata);
      } else {
        // Clear metadata for new board silently
        this.clearMetadataSilently();
        console.log('Metadata panel: No saved metadata found, cleared fields');
      }
    } catch (error) {
      console.warn('Failed to load board metadata from localStorage:', error);
    }
  }

  updateMetadataFromInputs() {
    this.metadata = {
      checkpoint: document.getElementById('checkpointInput')?.value || '',
      cfg: document.getElementById('cfgInput')?.value || '',
      seed: document.getElementById('seedInput')?.value || '',
      steps: document.getElementById('stepsInput')?.value || '',
      sampler: document.getElementById('samplerInput')?.value || '',
      scheduler: document.getElementById('schedulerInput')?.value || '',
      clipskip: document.getElementById('clipskipInput')?.value || '',
      size: document.getElementById('sizeInput')?.value || '',
      negativePrompt: document.getElementById('negativePromptInput')?.value || ''
    };
  }

  updateInputsFromMetadata() {
    const { metadata } = this;
    
    if (document.getElementById('checkpointInput')) {
      document.getElementById('checkpointInput').value = metadata.checkpoint;
    }
    if (document.getElementById('cfgInput')) {
      document.getElementById('cfgInput').value = metadata.cfg;
    }
    if (document.getElementById('seedInput')) {
      document.getElementById('seedInput').value = metadata.seed;
    }
    if (document.getElementById('stepsInput')) {
      document.getElementById('stepsInput').value = metadata.steps;
    }
    if (document.getElementById('samplerInput')) {
      document.getElementById('samplerInput').value = metadata.sampler;
    }
    if (document.getElementById('schedulerInput')) {
      document.getElementById('schedulerInput').value = metadata.scheduler;
    }
    if (document.getElementById('clipskipInput')) {
      document.getElementById('clipskipInput').value = metadata.clipskip;
    }
    if (document.getElementById('sizeInput')) {
      document.getElementById('sizeInput').value = metadata.size;
    }
    if (document.getElementById('negativePromptInput')) {
      document.getElementById('negativePromptInput').value = metadata.negativePrompt;
    }
  }

  async pasteMetadata() {
    if (this.isLocked) {
      showToast('Cannot paste metadata while locked', 'error');
      return;
    }
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        showToast('No text found in clipboard', 'error');
        return;
      }
      
      const parsedMetadata = this.parseMetadataFromText(clipboardText);
      if (Object.keys(parsedMetadata).length === 0) {
        showToast('No valid metadata found in clipboard', 'error');
        return;
      }
      
      this.setMetadata(parsedMetadata);
      if (this.currentBoardId) {
        this.saveBoardMetadata(this.currentBoardId);
      } else {
        this.saveToLocalStorage();
      }
      showToast('Metadata pasted successfully!', 'success');
    } catch (error) {
      console.error('Error pasting metadata:', error);
      showToast('Failed to paste metadata', 'error');
    }
  }

  clearMetadata() {
    if (this.isLocked) {
      showToast('Cannot clear metadata while locked', 'error');
      return;
    }
    
    this.metadata = {
      checkpoint: '',
      cfg: '',
      seed: '',
      steps: '',
      sampler: '',
      scheduler: '',
      clipskip: '',
      size: '',
      negativePrompt: ''
    };
    
    this.updateInputsFromMetadata();
    if (this.currentBoardId) {
      this.saveBoardMetadata(this.currentBoardId);
    } else {
      this.saveToLocalStorage();
    }
    showToast('Metadata cleared!', 'info');
  }

  clearMetadataSilently() {
    this.metadata = {
      checkpoint: '',
      cfg: '',
      seed: '',
      steps: '',
      sampler: '',
      scheduler: '',
      clipskip: '',
      size: '',
      negativePrompt: ''
    };
    
    this.updateInputsFromMetadata();
  }

  copyMetadata() {
    this.updateMetadataFromInputs();
    
    const metadataText = this.formatMetadataForCopy();
    
    navigator.clipboard.writeText(metadataText).then(() => {
      showToast('Metadata copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = metadataText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      showToast('Metadata copied to clipboard!', 'success');
    });
  }

  formatMetadataForCopy() {
    const { metadata } = this;
    const lines = [];
    
    if (metadata.checkpoint) lines.push(`Checkpoint: ${metadata.checkpoint}`);
    if (metadata.cfg) lines.push(`CFG Scale: ${metadata.cfg}`);
    if (metadata.seed) lines.push(`Seed: ${metadata.seed}`);
    if (metadata.steps) lines.push(`Steps: ${metadata.steps}`);
    if (metadata.sampler) lines.push(`Sampler: ${metadata.sampler}`);
    if (metadata.scheduler) lines.push(`Scheduler: ${metadata.scheduler}`);
    if (metadata.clipskip) lines.push(`Clip Skip: ${metadata.clipskip}`);
    if (metadata.size) lines.push(`Size: ${metadata.size}`);
    if (metadata.negativePrompt) lines.push(`Negative Prompt: ${metadata.negativePrompt}`);
    
    return lines.join('\n');
  }

  parseMetadataFromText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const parsed = {};
    
    for (const line of lines) {
      // Match patterns like "Checkpoint: value", "CFG Scale: value", etc.
      const checkpointMatch = line.match(/^Checkpoint:\s*(.+)$/i);
      if (checkpointMatch) {
        parsed.checkpoint = checkpointMatch[1].trim();
        continue;
      }
      
      const cfgMatch = line.match(/^CFG\s*Scale?:\s*(.+)$/i);
      if (cfgMatch) {
        parsed.cfg = cfgMatch[1].trim();
        continue;
      }
      
      const seedMatch = line.match(/^Seed:\s*(.+)$/i);
      if (seedMatch) {
        parsed.seed = seedMatch[1].trim();
        continue;
      }
      
      const stepsMatch = line.match(/^Steps:\s*(.+)$/i);
      if (stepsMatch) {
        parsed.steps = stepsMatch[1].trim();
        continue;
      }
      
      const samplerMatch = line.match(/^Sampler:\s*(.+)$/i);
      if (samplerMatch) {
        parsed.sampler = samplerMatch[1].trim();
        continue;
      }
      
      const schedulerMatch = line.match(/^Scheduler:\s*(.+)$/i);
      if (schedulerMatch) {
        parsed.scheduler = schedulerMatch[1].trim();
        continue;
      }
      
      const clipskipMatch = line.match(/^Clip\s*Skip:\s*(.+)$/i);
      if (clipskipMatch) {
        parsed.clipskip = clipskipMatch[1].trim();
        continue;
      }
      
      const sizeMatch = line.match(/^Size:\s*(.+)$/i);
      if (sizeMatch) {
        parsed.size = sizeMatch[1].trim();
        continue;
      }
      
      const negativeMatch = line.match(/^Negative\s*Prompt:\s*(.+)$/i);
      if (negativeMatch) {
        parsed.negativePrompt = negativeMatch[1].trim();
        continue;
      }
    }
    
    console.log('Parsed metadata from text:', parsed);
    return parsed;
  }

  saveBoardLockState() {
    if (!this.currentBoardId) return;
    
    try {
      const key = `promptWaffle_metadata_locked_board_${this.currentBoardId}`;
      localStorage.setItem(key, JSON.stringify(this.isLocked));
      console.log('Metadata panel: Saved lock state for board:', this.currentBoardId, 'Locked:', this.isLocked);
    } catch (error) {
      console.warn('Failed to save board lock state to localStorage:', error);
    }
  }

  loadBoardLockState(boardId) {
    try {
      const key = `promptWaffle_metadata_locked_board_${boardId}`;
      const saved = localStorage.getItem(key);
      console.log('Metadata panel: Loading lock state for board:', boardId, 'Found:', saved);
      
      if (saved !== null) {
        this.isLocked = JSON.parse(saved);
      } else {
        // Default to unlocked for new boards
        this.isLocked = false;
      }
      
      this.updateLockButton();
      this.updateInputFieldsState();
      console.log('Metadata panel: Lock state for board:', boardId, 'Locked:', this.isLocked);
    } catch (error) {
      console.warn('Failed to load board lock state from localStorage:', error);
      this.isLocked = false;
      this.updateLockButton();
      this.updateInputFieldsState();
    }
  }

  // Legacy methods for backward compatibility
  saveLockState() {
    this.saveBoardLockState();
  }

  loadLockState() {
    if (this.currentBoardId) {
      this.loadBoardLockState(this.currentBoardId);
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('promptWaffle_metadata', JSON.stringify(this.metadata));
    } catch (error) {
      console.warn('Failed to save metadata to localStorage:', error);
    }
  }

  loadMetadata() {
    try {
      const saved = localStorage.getItem('promptWaffle_metadata');
      if (saved) {
        this.metadata = { ...this.metadata, ...JSON.parse(saved) };
        this.updateInputsFromMetadata();
      }
    } catch (error) {
      console.warn('Failed to load metadata from localStorage:', error);
    }
  }

  replaceFeatherIcons() {
    // Wait for feather to be available
    if (window.feather) {
      window.feather.replace();
    } else {
      // Retry after a short delay
      setTimeout(() => this.replaceFeatherIcons(), 100);
    }
  }

  getMetadata() {
    this.updateMetadataFromInputs();
    return { ...this.metadata };
  }

  setMetadata(newMetadata) {
    this.metadata = { ...this.metadata, ...newMetadata };
    this.updateInputsFromMetadata();
    this.saveToLocalStorage();
  }

  // Debug method to check current state
  debugState() {
    console.log('=== Metadata Panel Debug ===');
    console.log('Current Board ID:', this.currentBoardId);
    console.log('Is Locked:', this.isLocked);
    console.log('Current Metadata:', this.metadata);
    console.log('All Board Metadata in localStorage:');
    
    // List all metadata keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('promptWaffle_metadata_board_')) {
        console.log(key, ':', localStorage.getItem(key));
      }
    }
    
    console.log('All Board Lock States in localStorage:');
    // List all lock state keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('promptWaffle_metadata_locked_board_')) {
        console.log(key, ':', localStorage.getItem(key));
      }
    }
    console.log('===========================');
  }
}

export const metadataPanel = new MetadataPanel();

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
  window.metadataPanel = metadataPanel;
} 