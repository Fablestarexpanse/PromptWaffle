import { replaceFeatherIcons } from '../../../utils/feather.js';
import { updateCompiledPrompt } from './updateCompiledPrompt.js';
/**
 * Executes post-render synchronization tasks like updating icons and compiled prompts.
 * @param {HTMLElement} boardContainer - The container element for the board.
 */
export function postRenderSync(boardContainer) {
  replaceFeatherIcons(boardContainer);
  updateCompiledPrompt();
}
