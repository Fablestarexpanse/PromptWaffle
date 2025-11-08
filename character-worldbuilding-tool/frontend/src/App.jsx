import React, { useState, useEffect } from 'react';
import ProjectList from './components/ProjectList';
import GraphView from './components/GraphView';
import CharacterForm from './components/CharacterForm';
import SearchBar from './components/SearchBar';
import api from './services/api';

function App() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load characters when project changes
  useEffect(() => {
    if (currentProject) {
      loadCharacters();
      loadRelationships();
    }
  }, [currentProject]);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await api.get(`/projects/${currentProject.id}/characters`);
      setCharacters(response.data);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadRelationships = async () => {
    try {
      const response = await api.get(`/projects/${currentProject.id}/relationships`);
      setRelationships(response.data);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const handleCreateProject = async (name) => {
    try {
      const response = await api.post('/projects', { name });
      setProjects([...projects, response.data]);
      setCurrentProject(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleSelectProject = (project) => {
    setCurrentProject(project);
  };

  const handleSaveCharacter = async (characterData) => {
    try {
      setIsLoading(true);
      if (editingCharacter) {
        // Update existing character
        const response = await api.put(
          `/projects/${currentProject.id}/characters/${editingCharacter.id}`,
          characterData
        );
        setCharacters(characters.map(c => c.id === editingCharacter.id ? response.data : c));
      } else {
        // Create new character
        const response = await api.post(
          `/projects/${currentProject.id}/characters`,
          characterData
        );
        setCharacters([...characters, response.data]);
      }
      setShowCharacterForm(false);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Error saving character. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
      await api.delete(`/projects/${currentProject.id}/characters/${characterId}`);
      setCharacters(characters.filter(c => c.id !== characterId));
      // Remove related relationships
      setRelationships(relationships.filter(r =>
        r.source !== characterId && r.target !== characterId
      ));
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const handleCreateRelationship = async (relationshipData) => {
    try {
      const response = await api.post(
        `/projects/${currentProject.id}/relationships`,
        relationshipData
      );
      setRelationships([...relationships, response.data]);
    } catch (error) {
      console.error('Error creating relationship:', error);
    }
  };

  const handleDeleteRelationship = async (relationshipId) => {
    try {
      await api.delete(`/projects/${currentProject.id}/relationships/${relationshipId}`);
      setRelationships(relationships.filter(r => r.id !== relationshipId));
    } catch (error) {
      console.error('Error deleting relationship:', error);
    }
  };

  const handleEditCharacter = (character) => {
    setEditingCharacter(character);
    setShowCharacterForm(true);
  };

  const handleExportToJanitor = async (characterId) => {
    try {
      const response = await api.get(
        `/projects/${currentProject.id}/characters/${characterId}/export/janitor`
      );

      // Download the JSON file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.data.name}_janitor.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JanitorAI:', error);
      alert('Error exporting character. Please try again.');
    }
  };

  const filteredCharacters = characters.filter(char => {
    const query = searchQuery.toLowerCase();
    return (
      char.name.toLowerCase().includes(query) ||
      (char.tags && char.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Character Worldbuilding Tool</h1>
        {currentProject && (
          <div className="project-info">
            <span className="current-project">{currentProject.name}</span>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingCharacter(null);
                setShowCharacterForm(true);
              }}
            >
              + New Character
            </button>
          </div>
        )}
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <ProjectList
            projects={projects}
            currentProject={currentProject}
            onCreateProject={handleCreateProject}
            onSelectProject={handleSelectProject}
          />
        </aside>

        <main className="main-content">
          {currentProject ? (
            <>
              <div className="toolbar">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search characters by name or tags..."
                />
              </div>

              <GraphView
                characters={filteredCharacters}
                relationships={relationships}
                onCreateRelationship={handleCreateRelationship}
                onDeleteRelationship={handleDeleteRelationship}
                onEditCharacter={handleEditCharacter}
                onDeleteCharacter={handleDeleteCharacter}
                onExportToJanitor={handleExportToJanitor}
              />
            </>
          ) : (
            <div className="welcome-screen">
              <h2>Welcome to Character Worldbuilding Tool</h2>
              <p>Create a project to get started</p>
            </div>
          )}
        </main>
      </div>

      {showCharacterForm && (
        <CharacterForm
          character={editingCharacter}
          projectId={currentProject?.id}
          onSave={handleSaveCharacter}
          onCancel={() => {
            setShowCharacterForm(false);
            setEditingCharacter(null);
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default App;
