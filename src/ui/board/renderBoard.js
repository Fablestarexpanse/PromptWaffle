import { AppState } from '../../state/appState.js';
import {
  buildCardElement,
  resolveActiveBoard,
  injectBoardImages,
  postRenderSync
} from './render/index.js';
import { characterDisplay } from '../../utils/characterDisplay.js';
export async function renderBoard(dependencies) {
  const boardContainer = document.getElementById('promptBoard');
  if (!boardContainer) return;
  const activeBoard = resolveActiveBoard();
  // Clear existing cards but not the placeholder
  boardContainer.querySelectorAll('.board-card').forEach(card => card.remove());
  // Show/hide placeholder
  const placeholder = boardContainer.querySelector('.board-placeholder');
  if (placeholder) {
    placeholder.style.display =
      !activeBoard || !activeBoard.cards.length ? 'block' : 'none';
  }
  // Render cards
  if (activeBoard && activeBoard.cards) {
    const snippets = AppState.getSnippets();
    const renderableCards = activeBoard.cards.filter(card => {
      const snippet = snippets[card.snippetPath];
      if (!snippet) {
        console.warn(
          `Skipping render for card with missing snippet: ${card.snippetPath}`
        );
        return false;
      }
      return true;
    });
    renderableCards.forEach(card => {
      const snippet = snippets[card.snippetPath];
      const cardDiv = buildCardElement(card, snippet, dependencies);
      boardContainer.appendChild(cardDiv);
    });
    postRenderSync(boardContainer);
    
    // Update character display based on active board cards
    console.log('renderBoard: Updating character display for board cards:', activeBoard.cards);
    characterDisplay.updateCharacterDisplayForBoard(activeBoard.cards);
  }
  await injectBoardImages();
}
