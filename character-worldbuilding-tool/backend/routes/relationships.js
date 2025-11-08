import express from 'express';
import storageService from '../services/storageService.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/projects/:projectId/relationships
 * Get all relationships for a project
 */
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const relationships = await storageService.getRelationships(projectId);
    res.json(relationships);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

/**
 * POST /api/projects/:projectId/relationships
 * Create a new relationship
 */
router.post('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const relationshipData = req.body;

    if (!relationshipData.source || !relationshipData.target) {
      return res.status(400).json({ error: 'Source and target are required' });
    }

    const relationship = await storageService.createRelationship(projectId, relationshipData);
    res.status(201).json(relationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

/**
 * DELETE /api/projects/:projectId/relationships/:relationshipId
 * Delete a relationship
 */
router.delete('/:relationshipId', async (req, res) => {
  try {
    const { projectId, relationshipId } = req.params;
    await storageService.deleteRelationship(projectId, relationshipId);
    res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

export default router;
