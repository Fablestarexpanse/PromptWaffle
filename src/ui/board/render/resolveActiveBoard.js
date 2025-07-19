import { AppState } from '../../../state/appState.js';
/**
 * Resolves and returns the active board object from the application state.
 * @returns {Object|null} The active board object or null if not found.
 */
export function resolveActiveBoard() {
  const activeBoardId = AppState.getActiveBoardId();
  if (!activeBoardId) {
    return null;
  }
  const boards = AppState.getBoards();
  return boards.find(b => b.id === activeBoardId) || null;
}
