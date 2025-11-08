import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import projectsRouter from './routes/projects.js';
import charactersRouter from './routes/characters.js';
import relationshipsRouter from './routes/relationships.js';
import claudeRouter from './routes/claude.js';

// Import services
import claudeService from './services/claudeService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Claude service
claudeService.initialize();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects/:projectId/characters', charactersRouter);
app.use('/api/projects/:projectId/relationships', relationshipsRouter);
app.use('/api/claude', claudeRouter);

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    claudeAvailable: claudeService.isAvailable()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   Character Worldbuilding Tool - Backend Server      ║
╚═══════════════════════════════════════════════════════╝

Server running on: http://localhost:${PORT}
API endpoint: http://localhost:${PORT}/api
Claude AI: ${claudeService.isAvailable() ? '✓ Enabled' : '✗ Disabled (set ANTHROPIC_API_KEY)'}

Press Ctrl+C to stop the server
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

export default app;
