import React, { useState } from 'react';

function ProjectList({ projects, currentProject, onCreateProject, onSelectProject }) {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Projects</h2>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreating(!isCreating)}
          title="Create new project"
        >
          +
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="project-create-form">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name..."
            autoFocus
            className="input"
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-sm btn-primary">
              Create
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setIsCreating(false);
                setNewProjectName('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="project-list-items">
        {projects.map((project) => (
          <li
            key={project.id}
            className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
            onClick={() => onSelectProject(project)}
          >
            <span className="project-name">{project.name}</span>
            <span className="project-count">{project.characterCount || 0}</span>
          </li>
        ))}
      </ul>

      {projects.length === 0 && !isCreating && (
        <div className="empty-state">
          <p>No projects yet</p>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
          >
            Create your first project
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
