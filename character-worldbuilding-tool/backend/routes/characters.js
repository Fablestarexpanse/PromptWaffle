import express from 'express';
import storageService from '../services/storageService.js';
import { exportToJanitorAI } from '../utils/janitorExport.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/projects/:projectId/characters
 * Get all characters for a project
 */
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const characters = await storageService.getCharacters(projectId);
    res.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

/**
 * POST /api/projects/:projectId/characters
 * Create a new character
 */
router.post('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const characterData = req.body;

    if (!characterData.name || !characterData.name.trim()) {
      return res.status(400).json({ error: 'Character name is required' });
    }

    const character = await storageService.createCharacter(projectId, characterData);
    res.status(201).json(character);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

/**
 * GET /api/projects/:projectId/characters/:characterId
 * Get a specific character
 */
router.get('/:characterId', async (req, res) => {
  try {
    const { projectId, characterId } = req.params;
    const character = await storageService.getCharacter(projectId, characterId);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

/**
 * PUT /api/projects/:projectId/characters/:characterId
 * Update a character
 */
router.put('/:characterId', async (req, res) => {
  try {
    const { projectId, characterId } = req.params;
    const updates = req.body;

    const character = await storageService.updateCharacter(projectId, characterId, updates);
    res.json(character);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

/**
 * DELETE /api/projects/:projectId/characters/:characterId
 * Delete a character
 */
router.delete('/:characterId', async (req, res) => {
  try {
    const { projectId, characterId } = req.params;
    await storageService.deleteCharacter(projectId, characterId);
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

/**
 * GET /api/projects/:projectId/characters/:characterId/export/janitor
 * Export character to JanitorAI format
 */
router.get('/:characterId/export/janitor', async (req, res) => {
  try {
    const { projectId, characterId } = req.params;

    const character = await storageService.getCharacter(projectId, characterId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get relationships for this character
    const allRelationships = await storageService.getRelationships(projectId);
    const characterRelationships = allRelationships.filter(
      rel => rel.source === characterId || rel.target === characterId
    );

    // Get related character names
    const characters = await storageService.getCharacters(projectId);
    const enrichedRelationships = characterRelationships.map(rel => {
      const targetId = rel.source === characterId ? rel.target : rel.source;
      const targetChar = characters.find(c => c.id === targetId);
      return {
        ...rel,
        targetName: targetChar?.name || 'Unknown'
      };
    });

    const janitorCard = exportToJanitorAI(character, enrichedRelationships);
    res.json(janitorCard);
  } catch (error) {
    console.error('Error exporting to JanitorAI:', error);
    res.status(500).json({ error: 'Failed to export character' });
  }
});

export default router;
