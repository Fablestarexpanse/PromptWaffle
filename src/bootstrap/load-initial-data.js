import { AppState } from '../state/appState.js';

import {
  isElectronAPIAvailable,
  safeElectronAPICall,
  safeJsonParse,
  parseSnippetTextFile,
  loadSnippetsFromFiles
} from '../utils/index.js';
import { showToast } from '../utils/index.js';
/**
 * Migrate existing text snippets to JSON format
 */
export async function migrateTextSnippetsToJson() {
  try {
    if (!isElectronAPIAvailable()) {
      return;
    }
    // List all files in the snippets folder
    const files = await safeElectronAPICall('listFiles', 'snippets');
    if (!Array.isArray(files)) {
      return;
    }
    let migratedCount = 0;
    // Process each text file
    for (const file of files) {
      if (file.name && file.name.endsWith('.txt')) {
        try {
          // Read the text file
          const textContent = await safeElectronAPICall(
            'readFile',
            `snippets/${file.name}`
          );
          const snippet = parseSnippetTextFile(textContent);
          if (!snippet || typeof snippet.text !== 'string') {
            console.warn(`Invalid text snippet in ${file.name}, skipping`);
            continue;
          }
          // Create new JSON file name
          const baseName = file.name.replace('.txt', '');
          const jsonFileName = `${baseName}.json`;
          // Create JSON snippet with enhanced metadata
          const jsonSnippet = {
            id: `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: snippet.text,
            tags: Array.isArray(snippet.tags) ? snippet.tags : [],
            created: snippet.created || Date.now(),
            modified: Date.now(),
            title: snippet.title || snippet.text.substring(0, 50),
            description: '',
            category: '',
            version: '1.0'
          };
          // Create JSON file content
          const jsonContent = JSON.stringify(jsonSnippet, null, 2);
          // Write the new JSON file
          await safeElectronAPICall(
            'writeFile',
            `snippets/${jsonFileName}`,
            jsonContent
          );
          // Delete the old text file
          await safeElectronAPICall('rm', `snippets/${file.name}`);
          // Update cache
          const currentSnippets = AppState.getSnippets();
          currentSnippets[jsonFileName] = jsonSnippet;
          delete currentSnippets[file.name]; // Remove old text file entry
          AppState.setSnippets(currentSnippets);
          migratedCount++;
        } catch (migrationError) {
          console.error(`Error migrating ${file.name}:`, migrationError);
        }
      }
    }
    if (migratedCount > 0) {
      showToast(`Migrated ${migratedCount} snippets to JSON format`, 'success');
    } else {
    }
  } catch (error) {
    console.error('Error during text to JSON migration:', error);
  }
}
async function ensureDefaultBoardExists() {
  try {
    const defaultBoardPath = 'boards/Default Board.json';
    // Default cards with the default snippets
    const defaultCards = [
      {
        id: 'card-default-photorealistic',
        snippetPath: 'snippets/Start Here/default_photorealistic.json',
        x: 100,
        y: 100,
        width: 457,
        height: 152,
        locked: false,
        color: '#E74C3C'
      },
      {
        id: 'card-default-cyberpunk',
        snippetPath: 'snippets/Start Here/default_cyberpunk.json',
        x: 572,
        y: 101,
        width: 352,
        height: 129,
        locked: false,
        color: '#3498DB'
      },
      {
        id: 'card-default-space',
        snippetPath: 'snippets/Start Here/default_space.json',
        x: 936,
        y: 96,
        width: 372,
        height: 79,
        locked: false,
        color: '#2ECC71'
      }
    ];
    const defaultBoard = {
      id: 'board-default',
      name: 'Default Board',
      tags: [],
      cards: defaultCards,
      groups: [],
      images: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    // Check if default board file exists
    let shouldCreateBoard = false;
    try {
      if (window.electronAPI && window.electronAPI.readFile) {
        await window.electronAPI.readFile(defaultBoardPath);
      } else {
        shouldCreateBoard = true;
      }
    } catch (e) {
      shouldCreateBoard = true;
    }
    // Create default board if it doesn't exist
    if (
      shouldCreateBoard &&
      window.electronAPI &&
      window.electronAPI.writeFile
    ) {
      await window.electronAPI.writeFile(
        defaultBoardPath,
        JSON.stringify(defaultBoard, null, 2)
      );
      // Also ensure it's in the AppState
      const boards = AppState.getBoards();
      const existingDefault = boards.find(
        b => b.id === 'board-default' || b.name === 'Default Board'
      );
      if (!existingDefault) {
        boards.push(defaultBoard);
        AppState.setBoards(boards);
      }
    }
  } catch (error) {
    console.error('Error ensuring default board exists:', error);
  }
}
export function populateSnippetCache(tree) {
  try {
    if (!Array.isArray(tree)) {
      console.error(
        'Invalid tree structure for snippet cache population:',
        tree
      );
      return;
    }
    for (const entry of tree) {
      if (!entry || typeof entry !== 'object') {
        console.warn('Invalid entry in tree:', entry);
        continue;
      }
      if (entry.type === 'snippet') {
        // Store snippet content in AppState for other parts of the app to access
        const snippets = AppState.getSnippets();
        const normalizedPath = entry.path.replace(/\\/g, '/');
        snippets[normalizedPath] = entry.content;
        AppState.setSnippets(snippets);
      } else if (entry.type === 'board') {
        // Sync board from file with boards array
        const boards = AppState.getBoards();
        const existingBoard = boards.find(
          b => b && b.name === entry.content.name
        );
        if (existingBoard) {
          // Update existing board with file data
          existingBoard.cards = Array.isArray(entry.content.cards)
            ? entry.content.cards
            : [];
          existingBoard.groups = Array.isArray(entry.content.groups)
            ? entry.content.groups
            : [];
          existingBoard.tags = Array.isArray(entry.content.tags)
            ? entry.content.tags
            : [];
          existingBoard.images = Array.isArray(entry.content.images)
            ? entry.content.images
            : [];
          // Set filePath for existing board
          existingBoard.filePath = entry.path;
        } else {
          // Add new board from file
          const newBoard = {
            id: entry.content.id || `board-${Date.now()}`,
            name: entry.content.name || 'Untitled Board',
            tags: Array.isArray(entry.content.tags) ? entry.content.tags : [],
            cards: Array.isArray(entry.content.cards)
              ? entry.content.cards
              : [],
            groups: Array.isArray(entry.content.groups)
              ? entry.content.groups
              : [],
            images: Array.isArray(entry.content.images)
              ? entry.content.images
              : [],
            createdAt: entry.content.createdAt || new Date().toISOString(),
            modifiedAt: entry.content.modifiedAt || new Date().toISOString(),
            filePath: entry.path // Set filePath for new board
          };
          boards.push(newBoard);
          AppState.setBoards(boards);
        }
      } else if (entry.type === 'folder' && Array.isArray(entry.children)) {
        populateSnippetCache(entry.children);
      }
    }
    // Ensure default board is always present in AppState
    const boards = AppState.getBoards();
    const defaultBoard = boards.find(
      b => b.id === 'board-default' || b.name === 'Default Board'
    );
    if (!defaultBoard) {
      const newDefaultBoard = {
        id: 'board-default',
        name: 'Default Board',
        tags: [],
        cards: [],
        groups: [],
        images: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
      boards.push(newDefaultBoard);
      AppState.setBoards(boards);
    }
  } catch (cacheError) {
    console.error('Error populating snippet cache:', cacheError);
  }
}
export async function loadInitialData() {
  // 1. Ensure 'Start Here' folder exists
  try {
    const folderName = 'Start Here';
    const folderPath = `snippets/${folderName}`;
    if (window.electronAPI && window.electronAPI.createFolder) {
      await window.electronAPI.createFolder(folderPath);
    }
  } catch (e) {
    console.error('Error ensuring default folder:', e);
  }
  // 2. Ensure default board exists
  try {
    await ensureDefaultBoardExists();
  } catch (e) {
    console.error('Error ensuring default board exists:', e);
  }
  // 3. Ensure default snippets exist
  try {
    const { createMissingDefaultSnippets } = await import(
      './default-snippets.js'
    );
    await createMissingDefaultSnippets();
  } catch (e) {
    console.error('Error ensuring default snippets exist:', e);
  }
  // 2. Fetch sidebar data from the main process
  let initialData;
  try {
    console.log('[Bootstrap] Calling getInitialData...');
    initialData = await safeElectronAPICall('getInitialData');
    console.log('[Bootstrap] getInitialData response:', initialData);
    if (!initialData || typeof initialData !== 'object') {
      console.error('[Bootstrap] Invalid initial data received:', initialData);
      throw new Error('Invalid initial data');
    }
  } catch (dataError) {
    console.error('[Bootstrap] Error fetching initial data:', dataError);
    console.error('[Bootstrap] Error details:', {
      message: dataError.message,
      stack: dataError.stack,
      name: dataError.name
    });
    showToast('Error loading application data', 'error');
    return;
  }
  // 3. Load snippets from text files and populate AppState
  window.sidebarTree = initialData.sidebarTree; // Store globally for folder selector
  // Load snippets from text files and migrate any old JSON snippets
  // This MUST be awaited to prevent race conditions during rendering
  try {
    const textFileSnippets = await loadSnippetsFromFiles();
    AppState.setSnippets(textFileSnippets);

    await migrateTextSnippetsToJson();
  } catch (snippetError) {
    console.error('Error loading or migrating snippets:', snippetError);
    console.error('Error stack:', snippetError.stack);
    showToast('Error loading snippets', 'error');
    AppState.setSnippets({});
  }
  populateSnippetCache(initialData.sidebarTree);
  return initialData;
}
