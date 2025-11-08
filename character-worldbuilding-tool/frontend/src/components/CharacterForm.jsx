import React, { useState, useEffect } from 'react';
import claudeService from '../services/claudeService';

function CharacterForm({ character, projectId, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    traits: [],
    notes: '',
    tags: []
  });

  const [traitInput, setTraitInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || '',
        image: character.image || '',
        description: character.description || '',
        traits: character.traits || [],
        notes: character.notes || '',
        tags: character.tags || []
      });
    }
  }, [character]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTrait = () => {
    if (traitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        traits: [...prev.traits, traitInput.trim()]
      }));
      setTraitInput('');
    }
  };

  const handleRemoveTrait = (index) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || formData.traits.length === 0) {
      alert('Please add a name and at least one trait before generating a description.');
      return;
    }

    try {
      setIsGenerating(true);
      const description = await claudeService.generateDescription({
        name: formData.name,
        traits: formData.traits,
        additionalContext: formData.notes
      });
      setFormData(prev => ({ ...prev, description }));
    } catch (error) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a character name.');
      return;
    }
    onSave(formData);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload to server
      // For now, we'll use a data URL or file path
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal character-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{character ? 'Edit Character' : 'New Character'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="character-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">Character Image</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                className="input"
              />
              {formData.image && (
                <div className="image-preview">
                  <img src={formData.image} alt="Character preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Core Traits</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrait())}
                placeholder="Add a trait..."
                className="input"
              />
              <button type="button" onClick={handleAddTrait} className="btn btn-sm">
                Add
              </button>
            </div>
            <div className="tags">
              {formData.traits.map((trait, index) => (
                <span key={index} className="tag">
                  {trait}
                  <button
                    type="button"
                    onClick={() => handleRemoveTrait(index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label htmlFor="description">Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                className="btn btn-sm btn-ai"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : '✨ Generate with Claude'}
              </button>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="textarea"
              rows="6"
              placeholder="Character description..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Internal Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="textarea"
              rows="4"
              placeholder="Private notes about this character..."
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="input"
              />
              <button type="button" onClick={handleAddTag} className="btn btn-sm">
                Add
              </button>
            </div>
            <div className="tags">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag tag-secondary">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Character'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CharacterForm;
