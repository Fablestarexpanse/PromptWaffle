import { AppState } from '../../../state/appState.js';
import { getActiveBoard } from './resolveActiveBoard.js';
async function renderBoardImages() {
  const activeBoard = getActiveBoard();
  // Skip this function - the bootstrap system handles image rendering
  // This prevents duplication when switching boards
}
export { renderBoardImages };
