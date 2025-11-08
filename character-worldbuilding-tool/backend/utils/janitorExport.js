/**
 * JanitorAI Character Card Export Utility
 * Formats character data into JanitorAI-compatible format
 */

/**
 * Export character to JanitorAI format
 * @param {Object} character - Character data
 * @param {Array} relationships - Character relationships
 * @returns {Object} JanitorAI formatted character card
 */
export function exportToJanitorAI(character, relationships = []) {
  // Build relationship descriptions
  const relationshipText = relationships.length > 0
    ? '\n\n**Relationships:**\n' + relationships.map(rel => {
        return `- ${rel.label || rel.type}: ${rel.targetName || 'Unknown'}`;
      }).join('\n')
    : '';

  // Format traits
  const traitsText = character.traits && character.traits.length > 0
    ? '\n\n**Traits:** ' + character.traits.join(', ')
    : '';

  // Build full description
  const fullDescription = `${character.description || ''}${traitsText}${relationshipText}`;

  // JanitorAI character card format
  const janitorCard = {
    name: character.name,
    description: fullDescription,
    personality: character.traits?.join(', ') || '',
    scenario: '',
    first_mes: `*${character.name} appears before you.*`,
    mes_example: '',
    creatorcomment: `Created with Character Worldbuilding Tool`,
    avatar: character.image || '',
    tags: character.tags || [],
    // Extended fields
    creator_notes: character.notes || '',
    character_version: '1.0.0',
    alternate_greetings: [],
    extensions: {
      worldbuilding_tool: {
        id: character.id,
        created_at: character.createdAt,
        updated_at: character.updatedAt
      }
    }
  };

  return janitorCard;
}

/**
 * Validate JanitorAI export data
 */
export function validateJanitorExport(card) {
  const required = ['name', 'description'];
  const missing = required.filter(field => !card[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return true;
}
