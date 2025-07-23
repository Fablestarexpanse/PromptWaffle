import * as bootstrap from './bootstrap/index.js';

import { AppState } from './state/appState.js';
import { setupEventListeners } from './events/eventListeners.js';
import { tutorial } from './tutorial.js';
import { versionChecker } from './utils/version-checker.js';
import { updateUI } from './utils/update-ui.js';
async function init() {
  try {
    // 1. Load application state
    const savedState = await bootstrap.loadApplicationState();
    if (savedState) {
      bootstrap.restoreApplicationState(savedState);
    }
    // 2. Load initial data (sidebar tree, snippets)
    const initialData = await bootstrap.loadInitialData();
    if (!initialData) {
      bootstrap.showCenteredWarning(
        'Failed to load essential application data. Please restart the application.'
      );
      return;
    }
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
    // Set current version in UI
    const versionElement = document.getElementById('currentVersion');
    if (versionElement) {
      versionElement.textContent = versionChecker.getCurrentVersion();
    }
    // Start tutorial after a short delay to ensure UI is fully loaded
    setTimeout(() => {
      if (tutorial.shouldShowTutorial()) {
        tutorial.start();
      }
    }, 1000);
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
  } catch (error) {
    console.error('Fatal error during application initialization:', error);
    try {
      bootstrap.showCenteredWarning(
        'A critical error occurred. Please restart the application.'
      );
    } catch (_e) {
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
