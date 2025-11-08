import api from './api';

/**
 * Claude AI service for character generation
 */
class ClaudeService {
  /**
   * Generate character description from traits
   * @param {Object} params - Generation parameters
   * @param {string} params.name - Character name
   * @param {Array<string>} params.traits - Character traits
   * @param {string} params.additionalContext - Additional context
   * @returns {Promise<string>} Generated description
   */
  async generateDescription({ name, traits, additionalContext = '' }) {
    try {
      const response = await api.post('/claude/generate-description', {
        name,
        traits,
        additionalContext
      });
      return response.data.description;
    } catch (error) {
      console.error('Error generating description:', error);
      throw new Error('Failed to generate description. Please check your Claude API key.');
    }
  }

  /**
   * Suggest relationships between characters
   * @param {Array<Object>} characters - List of characters
   * @returns {Promise<Array<Object>>} Suggested relationships
   */
  async suggestRelationships(characters) {
    try {
      const response = await api.post('/claude/suggest-relationships', {
        characters: characters.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          traits: c.traits
        }))
      });
      return response.data.relationships;
    } catch (error) {
      console.error('Error suggesting relationships:', error);
      throw new Error('Failed to suggest relationships. Please check your Claude API key.');
    }
  }
}

export default new ClaudeService();
