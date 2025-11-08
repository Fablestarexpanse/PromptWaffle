import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude AI service for character generation
 */
class ClaudeService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize Claude client with API key
   */
  initialize() {
    if (this.initialized) return;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY not found in environment variables. Claude features will be disabled.');
      return;
    }

    try {
      this.client = new Anthropic({ apiKey });
      this.initialized = true;
      console.log('Claude AI service initialized successfully');
    } catch (error) {
      console.error('Error initializing Claude AI service:', error);
    }
  }

  /**
   * Check if Claude service is available
   */
  isAvailable() {
    return this.initialized && this.client !== null;
  }

  /**
   * Generate character description from traits
   */
  async generateDescription({ name, traits, additionalContext = '' }) {
    if (!this.isAvailable()) {
      throw new Error('Claude AI service is not available. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const prompt = `You are a creative writing assistant specializing in character development. Generate a compelling character description for a fictional character.

Character Name: ${name}
Core Traits: ${traits.join(', ')}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Please write a vivid, engaging character description (2-3 paragraphs) that:
1. Captures the essence of these traits
2. Provides visual details
3. Hints at personality and background
4. Could be used in creative writing or role-playing

Write the description naturally, without meta-commentary.`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Error generating character description:', error);
      throw new Error('Failed to generate character description: ' + error.message);
    }
  }

  /**
   * Suggest relationships between characters
   */
  async suggestRelationships(characters) {
    if (!this.isAvailable()) {
      throw new Error('Claude AI service is not available. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const characterList = characters.map(c =>
        `- ${c.name}: ${c.description || c.traits?.join(', ') || 'No description'}`
      ).join('\n');

      const prompt = `You are a creative writing assistant helping to build a story world. Based on the following characters, suggest interesting relationships between them.

Characters:
${characterList}

Please suggest 3-5 potential relationships that would create an interesting dynamic. For each relationship, provide:
1. Source character name
2. Target character name
3. Relationship type (ally, rival, lover, enemy, friend, family, mentor, or other)
4. Brief reason for the relationship

Format your response as a JSON array like this:
[
  {
    "source": "Character A",
    "target": "Character B",
    "type": "rival",
    "reason": "Their contrasting personalities would create tension"
  }
]

Only output the JSON array, no additional text.`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text;

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Claude');
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      // Map character names to IDs
      return suggestions.map(suggestion => {
        const sourceChar = characters.find(c => c.name === suggestion.source);
        const targetChar = characters.find(c => c.name === suggestion.target);

        if (!sourceChar || !targetChar) {
          return null;
        }

        return {
          source: sourceChar.id,
          target: targetChar.id,
          type: suggestion.type,
          label: suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1),
          reason: suggestion.reason
        };
      }).filter(rel => rel !== null);
    } catch (error) {
      console.error('Error suggesting relationships:', error);
      throw new Error('Failed to suggest relationships: ' + error.message);
    }
  }
}

export default new ClaudeService();
