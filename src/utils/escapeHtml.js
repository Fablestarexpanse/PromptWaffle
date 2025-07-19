/**
 * Safely escape HTML content to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} - The escaped HTML string
 */
export function escapeHtml(text) {
  try {
    if (text === null || text === undefined) {
      return '';
    }
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  } catch (error) {
    console.error('Error escaping HTML:', error);
    return String(text || '').replace(/[&<>"']/g, char => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[char];
    });
  }
}
