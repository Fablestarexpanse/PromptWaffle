import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

/**
 * Storage service for managing JSON file persistence
 */
class StorageService {
  constructor() {
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  /**
   * Read JSON file
   */
  async readJSON(filename) {
    try {
      const filePath = path.join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write JSON file
   */
  async writeJSON(filename, data) {
    try {
      const filePath = path.join(DATA_DIR, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing JSON file:', error);
      throw error;
    }
  }

  /**
   * Delete JSON file
   */
  async deleteJSON(filename) {
    try {
      const filePath = path.join(DATA_DIR, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true;
      }
      throw error;
    }
  }

  /**
   * Get all projects
   */
  async getProjects() {
    let projects = await this.readJSON('projects.json');
    if (!projects) {
      projects = [];
      await this.writeJSON('projects.json', projects);
    }
    return projects;
  }

  /**
   * Create a new project
   */
  async createProject(name) {
    const projects = await this.getProjects();
    const newProject = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      characterCount: 0
    };
    projects.push(newProject);
    await this.writeJSON('projects.json', projects);

    // Initialize project data files
    await this.writeJSON(`project_${newProject.id}_characters.json`, []);
    await this.writeJSON(`project_${newProject.id}_relationships.json`, []);

    return newProject;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    const projects = await this.getProjects();
    return projects.find(p => p.id === projectId);
  }

  /**
   * Update project
   */
  async updateProject(projectId, updates) {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) {
      throw new Error('Project not found');
    }
    projects[index] = { ...projects[index], ...updates };
    await this.writeJSON('projects.json', projects);
    return projects[index];
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    await this.writeJSON('projects.json', filtered);
    await this.deleteJSON(`project_${projectId}_characters.json`);
    await this.deleteJSON(`project_${projectId}_relationships.json`);
    return true;
  }

  /**
   * Get all characters for a project
   */
  async getCharacters(projectId) {
    let characters = await this.readJSON(`project_${projectId}_characters.json`);
    if (!characters) {
      characters = [];
      await this.writeJSON(`project_${projectId}_characters.json`, characters);
    }
    return characters;
  }

  /**
   * Create a character
   */
  async createCharacter(projectId, characterData) {
    const characters = await this.getCharacters(projectId);
    const newCharacter = {
      id: Date.now().toString(),
      ...characterData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    characters.push(newCharacter);
    await this.writeJSON(`project_${projectId}_characters.json`, characters);

    // Update project character count
    const project = await this.getProject(projectId);
    if (project) {
      await this.updateProject(projectId, { characterCount: characters.length });
    }

    return newCharacter;
  }

  /**
   * Get character by ID
   */
  async getCharacter(projectId, characterId) {
    const characters = await this.getCharacters(projectId);
    return characters.find(c => c.id === characterId);
  }

  /**
   * Update character
   */
  async updateCharacter(projectId, characterId, updates) {
    const characters = await this.getCharacters(projectId);
    const index = characters.findIndex(c => c.id === characterId);
    if (index === -1) {
      throw new Error('Character not found');
    }
    characters[index] = {
      ...characters[index],
      ...updates,
      id: characterId, // Preserve ID
      updatedAt: new Date().toISOString()
    };
    await this.writeJSON(`project_${projectId}_characters.json`, characters);
    return characters[index];
  }

  /**
   * Delete character
   */
  async deleteCharacter(projectId, characterId) {
    const characters = await this.getCharacters(projectId);
    const filtered = characters.filter(c => c.id !== characterId);
    await this.writeJSON(`project_${projectId}_characters.json`, filtered);

    // Update project character count
    const project = await this.getProject(projectId);
    if (project) {
      await this.updateProject(projectId, { characterCount: filtered.length });
    }

    // Delete related relationships
    const relationships = await this.getRelationships(projectId);
    const filteredRels = relationships.filter(r =>
      r.source !== characterId && r.target !== characterId
    );
    await this.writeJSON(`project_${projectId}_relationships.json`, filteredRels);

    return true;
  }

  /**
   * Get all relationships for a project
   */
  async getRelationships(projectId) {
    let relationships = await this.readJSON(`project_${projectId}_relationships.json`);
    if (!relationships) {
      relationships = [];
      await this.writeJSON(`project_${projectId}_relationships.json`, relationships);
    }
    return relationships;
  }

  /**
   * Create a relationship
   */
  async createRelationship(projectId, relationshipData) {
    const relationships = await this.getRelationships(projectId);
    const newRelationship = {
      id: Date.now().toString(),
      ...relationshipData,
      createdAt: new Date().toISOString()
    };
    relationships.push(newRelationship);
    await this.writeJSON(`project_${projectId}_relationships.json`, relationships);
    return newRelationship;
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(projectId, relationshipId) {
    const relationships = await this.getRelationships(projectId);
    const filtered = relationships.filter(r => r.id !== relationshipId);
    await this.writeJSON(`project_${projectId}_relationships.json`, filtered);
    return true;
  }
}

export default new StorageService();
