import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';

// Register edgehandles extension
cytoscape.use(edgehandles);

const RELATIONSHIP_TYPES = [
  { value: 'ally', label: 'Ally', color: '#4caf50' },
  { value: 'rival', label: 'Rival', color: '#ff9800' },
  { value: 'lover', label: 'Lover', color: '#e91e63' },
  { value: 'enemy', label: 'Enemy', color: '#f44336' },
  { value: 'friend', label: 'Friend', color: '#2196f3' },
  { value: 'family', label: 'Family', color: '#9c27b0' },
  { value: 'mentor', label: 'Mentor', color: '#00bcd4' },
  { value: 'other', label: 'Other', color: '#607d8b' }
];

function GraphView({
  characters,
  relationships,
  onCreateRelationship,
  onDeleteRelationship,
  onEditCharacter,
  onDeleteCharacter,
  onExportToJanitor
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('friend');
  const [contextMenu, setContextMenu] = useState(null);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#2d2d2d',
            'border-color': '#4caf50',
            'border-width': 3,
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 5,
            'font-size': '12px',
            'width': 60,
            'height': 60,
            'background-image': 'data(image)',
            'background-fit': 'cover',
            'background-clip': 'none'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#ffc107',
            'border-width': 4
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'color': '#fff',
            'text-background-color': '#1a1a1a',
            'text-background-opacity': 0.8,
            'text-background-padding': '3px',
            'font-size': '10px'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 4,
            'line-color': '#ffc107',
            'target-arrow-color': '#ffc107'
          }
        },
        {
          selector: '.eh-handle',
          style: {
            'background-color': '#4caf50',
            'width': 12,
            'height': 12,
            'shape': 'ellipse',
            'overlay-opacity': 0,
            'border-width': 3,
            'border-opacity': 0
          }
        },
        {
          selector: '.eh-hover',
          style: {
            'background-color': '#4caf50'
          }
        },
        {
          selector: '.eh-preview, .eh-ghost-edge',
          style: {
            'background-color': '#4caf50',
            'line-color': '#4caf50',
            'target-arrow-color': '#4caf50',
            'source-arrow-color': '#4caf50'
          }
        }
      ],
      layout: {
        name: 'circle',
        padding: 50
      },
      wheelSensitivity: 0.2
    });

    // Enable edge drawing
    const eh = cy.edgehandles({
      canConnect: function(sourceNode, targetNode) {
        return !sourceNode.same(targetNode);
      },
      edgeParams: function(sourceNode, targetNode) {
        const relType = RELATIONSHIP_TYPES.find(r => r.value === selectedRelationshipType);
        return {
          data: {
            type: selectedRelationshipType,
            label: relType.label,
            color: relType.color
          }
        };
      },
      hoverDelay: 150,
      snap: true,
      snapThreshold: 50,
      snapFrequency: 15,
      noEdgeEventsInDraw: true,
      disableBrowserGestures: true
    });

    // Handle edge creation
    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
      const relType = RELATIONSHIP_TYPES.find(r => r.value === selectedRelationshipType);

      onCreateRelationship({
        source: sourceNode.id(),
        target: targetNode.id(),
        type: selectedRelationshipType,
        label: relType.label
      });

      // Remove the temporary edge created by edgehandles
      addedEdge.remove();
    });

    // Handle node click
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      setSelectedCharacter(node.data());
    });

    // Handle edge click
    cy.on('tap', 'edge', (event) => {
      const edge = event.target;
      if (confirm(`Delete this ${edge.data('label')} relationship?`)) {
        onDeleteRelationship(edge.data('id'));
      }
    });

    // Handle right-click context menu
    cy.on('cxttap', 'node', (event) => {
      event.preventDefault();
      const node = event.target;
      const renderedPosition = event.renderedPosition || event.cyRenderedPosition;

      setContextMenu({
        x: renderedPosition.x,
        y: renderedPosition.y,
        character: node.data()
      });
    });

    // Close context menu on background click
    cy.on('tap', (event) => {
      if (event.target === cy) {
        setContextMenu(null);
        setSelectedCharacter(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [selectedRelationshipType]);

  // Update graph when characters or relationships change
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    // Build elements array
    const elements = [];

    // Add character nodes
    characters.forEach(char => {
      elements.push({
        data: {
          id: char.id,
          label: char.name,
          image: char.image || '',
          ...char
        }
      });
    });

    // Add relationship edges
    relationships.forEach(rel => {
      const relType = RELATIONSHIP_TYPES.find(r => r.value === rel.type) || RELATIONSHIP_TYPES[7];
      elements.push({
        data: {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          label: rel.label || relType.label,
          color: relType.color,
          type: rel.type
        }
      });
    });

    // Update the graph
    cy.elements().remove();
    cy.add(elements);

    // Apply layout if we have nodes
    if (characters.length > 0) {
      cy.layout({
        name: 'circle',
        padding: 50,
        animate: true,
        animationDuration: 500
      }).run();
    }
  }, [characters, relationships]);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div className="graph-view-container">
      <div className="graph-toolbar">
        <div className="relationship-type-selector">
          <label>Relationship Type:</label>
          <select
            value={selectedRelationshipType}
            onChange={(e) => setSelectedRelationshipType(e.target.value)}
            className="select"
          >
            {RELATIONSHIP_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <span className="help-text">
            Click and drag from one character to another to create a relationship
          </span>
        </div>

        {selectedCharacter && (
          <div className="character-info">
            <h3>{selectedCharacter.name}</h3>
            <p>{selectedCharacter.description?.substring(0, 100)}...</p>
            <div className="character-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onEditCharacter(selectedCharacter)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-success"
                onClick={() => onExportToJanitor(selectedCharacter.id)}
              >
                Export to JanitorAI
              </button>
            </div>
          </div>
        )}
      </div>

      <div ref={containerRef} className="graph-canvas" />

      {contextMenu && (
        <>
          <div className="context-menu-overlay" onClick={handleCloseContextMenu} />
          <div
            className="context-menu"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`
            }}
          >
            <button onClick={() => {
              onEditCharacter(contextMenu.character);
              handleCloseContextMenu();
            }}>
              Edit Character
            </button>
            <button onClick={() => {
              onExportToJanitor(contextMenu.character.id);
              handleCloseContextMenu();
            }}>
              Export to JanitorAI
            </button>
            <button
              className="danger"
              onClick={() => {
                onDeleteCharacter(contextMenu.character.id);
                handleCloseContextMenu();
              }}
            >
              Delete Character
            </button>
          </div>
        </>
      )}

      {characters.length === 0 && (
        <div className="empty-graph-state">
          <h3>No characters yet</h3>
          <p>Create your first character to start building your world</p>
        </div>
      )}
    </div>
  );
}

export default GraphView;
