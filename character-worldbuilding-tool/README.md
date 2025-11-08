# Character Worldbuilding Tool

A powerful web application for creating, managing, and visualizing character relationships in your creative writing projects.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)

## Features

### Core Functionality
- **Project Management**: Create and organize multiple worldbuilding projects
- **Character Creation**: Build detailed characters with names, images, descriptions, traits, and tags
- **Visual Relationship Graph**: Interactive graph visualization using Cytoscape.js
- **Drag-to-Connect Relationships**: Intuitive drag-and-drop relationship creation
- **Search & Filter**: Quick character search by name and tags
- **Dark Theme UI**: Professional, eye-friendly dark interface

### AI-Powered Features (Optional)
- **Claude AI Integration**: Generate character descriptions from traits
- **Relationship Suggestions**: AI-powered relationship recommendations

### Export Features
- **JanitorAI Export**: One-click export to JanitorAI character card format

### Relationship Types
- Ally
- Rival
- Lover
- Enemy
- Friend
- Family
- Mentor
- Other

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Cytoscape.js** - Graph visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Anthropic SDK** - Claude AI integration
- **Local JSON Storage** - Simple, portable data storage

## Installation

### Prerequisites
- Node.js 18+ and npm
- (Optional) Anthropic API key for AI features

### Quick Start

1. **Clone or navigate to the project**
   ```bash
   cd character-worldbuilding-tool
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment (optional for AI features)**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

5. **Start the backend server**
   ```bash
   # From backend directory
   npm start
   ```

6. **Start the frontend dev server** (in a new terminal)
   ```bash
   # From frontend directory
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## Usage Guide

### Creating Your First Project

1. Click the **+** button in the sidebar
2. Enter a project name
3. Click **Create**

### Adding Characters

1. Select a project from the sidebar
2. Click **+ New Character** in the header
3. Fill in character details:
   - **Name** (required)
   - **Image** (optional - upload a character portrait)
   - **Core Traits** (add descriptive traits)
   - **Description** (write or generate with AI)
   - **Internal Notes** (private notes for your reference)
   - **Tags** (for organization and search)
4. Click **Save Character**

### Creating Relationships

1. Select a relationship type from the dropdown
2. Click and drag from one character to another
3. Release to create the relationship
4. Click on a relationship edge to delete it

### Using AI Features

**Generate Character Description:**
1. In the character form, add a name and traits
2. Click **✨ Generate with Claude**
3. The AI will create a description based on the traits

**Suggest Relationships:**
- Create at least 2 characters first
- Use the AI suggestion feature (coming in future update)

### Exporting to JanitorAI

1. Right-click a character or click the character
2. Click **Export to JanitorAI**
3. A JSON file will download automatically
4. Import this file into JanitorAI

## File Structure

```
character-worldbuilding-tool/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ProjectList.jsx
│   │   │   ├── CharacterForm.jsx
│   │   │   ├── GraphView.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── services/        # API services
│   │   │   ├── api.js
│   │   │   └── claudeService.js
│   │   ├── styles/          # CSS styles
│   │   │   └── App.css
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                  # Node.js + Express backend
│   ├── routes/              # API routes
│   │   ├── projects.js
│   │   ├── characters.js
│   │   ├── relationships.js
│   │   └── claude.js
│   ├── services/            # Business logic
│   │   ├── storageService.js
│   │   └── claudeService.js
│   ├── utils/               # Utilities
│   │   └── janitorExport.js
│   ├── server.js            # Express server
│   └── package.json
│
├── data/                     # JSON storage (gitignored)
│   ├── projects.json
│   ├── project_*_characters.json
│   └── project_*_relationships.json
│
├── public/                   # Static assets
│   └── images/              # Character images
│
└── README.md
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete a project

### Characters
- `GET /api/projects/:projectId/characters` - List characters
- `POST /api/projects/:projectId/characters` - Create character
- `GET /api/projects/:projectId/characters/:id` - Get character
- `PUT /api/projects/:projectId/characters/:id` - Update character
- `DELETE /api/projects/:projectId/characters/:id` - Delete character
- `GET /api/projects/:projectId/characters/:id/export/janitor` - Export to JanitorAI

### Relationships
- `GET /api/projects/:projectId/relationships` - List relationships
- `POST /api/projects/:projectId/relationships` - Create relationship
- `DELETE /api/projects/:projectId/relationships/:id` - Delete relationship

### Claude AI
- `POST /api/claude/generate-description` - Generate character description
- `POST /api/claude/suggest-relationships` - Suggest relationships

## Data Storage

Data is stored in local JSON files in the `/data` directory:
- `projects.json` - All projects
- `project_{id}_characters.json` - Characters for each project
- `project_{id}_relationships.json` - Relationships for each project

**Backup Recommendation**: Regularly backup your `/data` directory to preserve your work.

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev      # Start with auto-reload (Node 18+)
npm start        # Start normally
```

## Configuration

### Backend Environment Variables
Create a `.env` file in the `backend` directory:

```env
PORT=5000
ANTHROPIC_API_KEY=your_api_key_here
```

### Frontend Proxy
The frontend is configured to proxy API requests to `http://localhost:5000` in development. This is set in `frontend/vite.config.js`.

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is already in use:
- Change frontend port in `vite.config.js`
- Change backend port in `.env` or set `PORT` environment variable

### Claude AI Not Working
1. Verify `ANTHROPIC_API_KEY` is set in backend `.env`
2. Check your API key is valid at https://console.anthropic.com/
3. Check backend console for error messages

### Characters Not Appearing in Graph
1. Ensure both frontend and backend are running
2. Check browser console for errors
3. Verify data files exist in `/data` directory

## Future Enhancements

Potential features for future development:
- Multi-user support with authentication
- Database storage option (PostgreSQL/MongoDB)
- Image upload to cloud storage
- Advanced graph layouts and filters
- Character history and version control
- Export to other formats (World Anvil, Notion, etc.)
- Collaborative editing
- Mobile-responsive design improvements

## Contributing

This is part of the PromptWaffle project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the AGPL-3.0 License - see the main PromptWaffle LICENSE file for details.

## Credits

Built as part of the [PromptWaffle](https://github.com/Fablestarexpanse/PromptWaffle) project.

### Technologies
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Cytoscape.js](https://js.cytoscape.org/)
- [Express](https://expressjs.com/)
- [Anthropic Claude](https://www.anthropic.com/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review the API endpoints section

---

**Happy Worldbuilding!** 🌍✨
