import express from 'express';
import storageService from '../services/storageService.js';

const router = express.Router();

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', async (req, res) => {
  try {
    const projects = await storageService.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await storageService.createProject(name.trim());
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * GET /api/projects/:projectId
 * Get a specific project
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await storageService.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project
 */
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    await storageService.deleteProject(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
