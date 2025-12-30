import * as bootstrap from './bootstrap/index.js';

import { AppState } from './state/appState.js';
import { setupEventListeners } from './events/eventListeners.js';
import { tutorial } from './tutorial.js';
import { versionChecker } from './utils/version-checker.js';
import { updateUI } from './utils/update-ui.js';
import { LoadingScreen } from './utils/loading-screen.js';
async function init() {
  console.log('[Renderer] Starting application initialization...');
  // Initialize loading screen
  const loadingScreen = new LoadingScreen();

  try {
    console.log('[Renderer] Starting loading simulation...');
    // Start loading simulation
    loadingScreen.simulateLoading();

    // 1. Load application state
    console.log('[Renderer] Loading application state...');
    const savedState = await bootstrap.loadApplicationState();
    if (savedState) {
      console.log('[Renderer] Restoring application state...');
      bootstrap.restoreApplicationState(savedState);
    }
    // 2. Load initial data (sidebar tree, snippets)
    console.log('[Renderer] Loading initial data...');
    const initialData = await bootstrap.loadInitialData();
    if (!initialData) {
      console.error('[Renderer] Failed to load initial data');
      bootstrap.showCenteredWarning(
        'Failed to load essential application data. Please restart the application.'
      );
      return;
    }
    console.log('[Renderer] Initial data loaded successfully');
    // Migrate old board card snippet paths if needed
    if (bootstrap.migrateBoardCardSnippetPaths) {
      await bootstrap.migrateBoardCardSnippetPaths();
    }
    // Clean up orphaned cards that reference non-existent snippets
    if (bootstrap.cleanupOrphanedCards) {
      const cleanedCount = bootstrap.cleanupOrphanedCards();
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} orphaned cards`);
      }
    }
    // 3. Render initial UI components
    // Only render the folder tree into the foldersContainer, not the whole sidebar
    const foldersContainer = document.getElementById('foldersContainer');
    if (foldersContainer) {
      bootstrap.renderSidebar(initialData.sidebarTree, foldersContainer);
    }
    // Ensure root drop zone is properly initialized
    const rootDropZone = document.getElementById('rootDropZone');
    if (rootDropZone) {
      rootDropZone.style.display = 'flex';
    }
    bootstrap.renderBoardSelector();
    // 4. Set the active board and render it
    const boards = AppState.getBoards();
    const activeBoardId =
      AppState.getActiveBoardId() || (boards.length > 0 && boards[0].id);
    if (activeBoardId) {
      await bootstrap.setCurrentBoard(activeBoardId);
      await bootstrap.renderBoard();
    }
    // 5. Restore UI state (e.g., expanded folders, search terms)
    if (savedState && savedState.uiState) {
      bootstrap.applySidebarState(savedState.uiState.expandedFolders);
      // Restore search term if it exists
      if (savedState.uiState.searchTerm) {
        const searchInput = document.getElementById('tagSearchInput');
        if (searchInput) {
          searchInput.value = savedState.uiState.searchTerm;
          AppState.setCurrentSearchTerm(savedState.uiState.searchTerm);
        }
      }
    }
    // 6. Restore monitored folder if it was previously set
    const monitoredFolder = AppState.getMonitoredFolder();
    if (monitoredFolder) {
      try {
        // Check if the folder still exists before restoring
        const folderExists = await window.electronAPI.stat(monitoredFolder);
        if (!folderExists) {
          console.warn('Monitored folder no longer exists:', monitoredFolder);
          AppState.setMonitoredFolder(null);
          return;
        }
        // Import the UI functions to restore live preview
        const { startLivePreview } = await import('./bootstrap/ui.js');
        await startLivePreview(monitoredFolder);
      } catch (error) {
        console.error('Failed to restore monitored folder:', error);
        // Clear the invalid folder path from state
        AppState.setMonitoredFolder(null);
      }
    }
    // 7. Set up event listeners for dynamic UI elements
    setupEventListeners();
    // 8. Initial UI updates
    bootstrap.updateCompiledPrompt();
    bootstrap.updateBoardTagsDisplay();
    // Populate board select dropdown
    bootstrap.populateBoardSelectDropdown();
    // 9. Update snippet colors button state
    const toggleSnippetColorsBtn = document.getElementById(
      'toggleSnippetColorsBtn'
    );
    if (toggleSnippetColorsBtn) {
      const showCardColors = AppState.getShowCardColors();
      if (showCardColors) {
        toggleSnippetColorsBtn.classList.add('active');
        toggleSnippetColorsBtn.innerHTML =
          '<i data-feather="droplet"></i>Hide Colors';
      } else {
        toggleSnippetColorsBtn.classList.remove('active');
        toggleSnippetColorsBtn.innerHTML =
          '<i data-feather="droplet"></i>Colors';
      }
    }
    // Initialize and start tutorial if needed
    tutorial.init();
    tutorial.loadTutorialState();
    // Initialize version checking system
    updateUI.init();

    // Initialize auto-updater UI
    try {
      const { autoUpdaterUI } = await import('./utils/auto-updater-ui.js');
      // Auto-updater UI is automatically initialized when imported
    } catch (error) {
      console.warn('Auto-updater UI not available:', error);
    }

    // Initialize metadata panel after board system is ready
    // Initialize metadata panel
    try {
      const { metadataPanel } = await import('./utils/metadata-panel.js');
      // Metadata panel is automatically initialized when imported
    } catch (error) {
      console.warn('Metadata panel not available:', error);
    }

    // Initialize character builder after board system is ready
    // Initialize character builder
    try {
      const { characterBuilder } = await import('./utils/characterBuilder.js');
      await characterBuilder.init();

      // Setup character builder event listeners
      const openCharacterBuilderBtn = document.getElementById('openCharacterBuilderBtn');

      if (openCharacterBuilderBtn) {
        openCharacterBuilderBtn.addEventListener('click', () => {
          characterBuilder.openModal();
        });
      }

      // Setup wildcard studio event listeners
      const openWildcardStudioBtn = document.getElementById('openWildcardStudioBtn');

      if (openWildcardStudioBtn) {
        openWildcardStudioBtn.addEventListener('click', async () => {
          try {
            const { promptKitUI } = await import('./utils/promptkit-ui.js');
            await promptKitUI.openModal();
          } catch (error) {
            console.error('Error opening Wildcard Studio:', error);
            const { showToast } = await import('./utils/index.js');
            showToast('Error opening Wildcard Studio', 'error');
          }
        });
      }

      console.log('Character Builder initialized successfully');
    } catch (error) {
      console.warn('Character Builder not available:', error);
    }

    // Initialize Character Display
    // Initialize Character Display
    try {
      console.log('Attempting to initialize Character Display...');

      // Test if DOM elements are found first
      const testDisplay = document.getElementById('characterImagesDisplay');
      const testContainer = document.getElementById('characterImagesContainer');

      if (testDisplay && testContainer) {
        const { characterDisplay } = await import('./utils/characterDisplay.js');
        console.log('Character Display module imported successfully');
      } else {
        console.error('Character Display DOM elements not found!');
      }
    } catch (error) {
      console.error('Character Display initialization failed:', error);
    }
    // Set current version in UI
    const versionElement = document.getElementById('currentVersion');
    if (versionElement) {
      versionElement.textContent = await versionChecker.getCurrentVersion();
    }
    // Start tutorial after a short delay to ensure UI is fully loaded
    setTimeout(() => {
      if (tutorial.shouldShowTutorial()) {
        tutorial.start();
      }
    }, 1000);
    // Check for image migration on startup (after a delay)
    setTimeout(async () => {
      try {
        const { promptImageMigration } = await import('./utils/image-migration.js');
        await promptImageMigration();
      } catch (error) {
        console.warn('Image migration check failed:', error);
      }
    }, 5000); // Check after 5 seconds

    // Check for updates after a delay to avoid blocking startup
    setTimeout(async () => {
      try {
        // Check if we should check for updates
        if (versionChecker.shouldCheckForUpdates()) {
          const updateInfo = await versionChecker.checkForUpdates();
          versionChecker.displayUpdateNotification(updateInfo);
          // Show update modal if update is available and reminder is due
          if (updateInfo.success && updateInfo.isOutdated) {
            setTimeout(() => {
              updateUI.showStoredUpdateNotification();
            }, 2000); // Show modal after 2 seconds
          }
        } else {
          // Show stored update notification if available
          updateUI.showStoredUpdateNotification();
        }
      } catch (error) {
        console.error('❌ Error during version check:', error);
      }
    }, 3000); // Check for updates 3 seconds after startup

    // Ensure loading screen is hidden after everything is initialized
    setTimeout(() => {
      loadingScreen.hide();
    }, 1000);

  } catch (error) {
    console.error('[Renderer] Fatal error during application initialization:', error);
    console.error('[Renderer] Error stack:', error.stack);
    // Hide loading screen even on error
    loadingScreen.hide();
    try {
      console.log('[Renderer] Attempting to show error warning...');
      bootstrap.showCenteredWarning(
        'A critical error occurred. Please restart the application.'
      );
    } catch (_e) {
      console.error('[Renderer] Failed to show error warning:', _e);
      // Fallback if the UI is so broken that the warning can't be shown
      alert('A critical error occurred. Please restart the application.');
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const expandBtn = document.getElementById('sidebarExpandBtn');
  if (sidebar && expandBtn) {
    expandBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-expanded');
      if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
      }
    });
  }
});
document.addEventListener('DOMContentLoaded', init);
// Remove the setFoldersContainerTop JS and its event listeners
