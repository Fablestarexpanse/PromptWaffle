import express from 'express';
import claudeService from '../services/claudeService.js';
import storageService from '../services/storageService.js';

const router = express.Router();

/**
 * POST /api/claude/generate-description
 * Generate character description using Claude AI
 */
router.post('/generate-description', async (req, res) => {
  try {
    const { name, traits, additionalContext } = req.body;

    if (!name || !traits || traits.length === 0) {
      return res.status(400).json({
        error: 'Name and at least one trait are required'
      });
    }

    const description = await claudeService.generateDescription({
      name,
      traits,
      additionalContext
    });

    res.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/claude/suggest-relationships
 * Suggest relationships between characters using Claude AI
 */
router.post('/suggest-relationships', async (req, res) => {
  try {
    const { characters } = req.body;

    if (!characters || characters.length < 2) {
      return res.status(400).json({
        error: 'At least 2 characters are required'
      });
    }

    const relationships = await claudeService.suggestRelationships(characters);
    res.json({ relationships });
  } catch (error) {
    console.error('Error suggesting relationships:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
