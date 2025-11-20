// Constants to replace magic numbers
const CONSTANTS = {
  TREE_DEPTH_SPACING: 20,
  TREE_LINE_OFFSET: 10,
  TREE_CONNECTOR_WIDTH: 10,
  TREE_CONNECTOR_HEIGHT: 1,
  TREE_HEADER_PADDING: 8,
  TREE_LAST_ITEM_HEIGHT: 20
};
const cardColorPalette = [
  '#E74C3C', // Bright Red
  '#3498DB', // Bright Blue
  '#2ECC71', // Bright Green
  '#F39C12', // Bright Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Turquoise
  '#F1C40F', // Yellow
  '#E91E63', // Pink
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Gray
  '#8BC34A', // Light Green
  '#FF9800', // Amber
  '#795548', // Brown
  '#9C27B0', // Deep Purple
  '#00BCD4' // Cyan
];
// UI Constants for card colors
const UI_CONSTANTS = {
  CARD_COLOR_PALETTE: cardColorPalette
};
// Application state management - encapsulated to prevent global pollution
const AppState = {
  // Data arrays
  promptFolders: [],
  prompts: [],
  boardFolders: [],
  boards: [],
  // UI state
  activeBoardId: null,
  currentBoard: null,
  currentSearchTerm: '',
  tempBoardImages: [],
  // Configuration
  sortConfig: { field: 'name', direction: 'asc' },
  currentSort: { key: 'name', direction: 'asc' },
  showCompiledColors: true,
  showCardColors: true,
  // Live preview state
  monitoredFolder: null,
  // Board background color
  boardBackgroundColor: null,
  // Caches and paths
  paths: {},
  snippets: {}, // In-memory cache for all snippets, using file path as the key.
  // Text selection state
  currentSelectedText: '',
  currentSelectedCard: null,
  selectionStartOffset: 0,
  selectionEndOffset: 0,
  // Tutorial state
  tutorialShown: false,
  currentTutorialStep: 0,
  // Methods to safely access and modify state
  getPromptFolders() {
    return [...this.promptFolders];
  },
  setPromptFolders(folders) {
    this.promptFolders = Array.isArray(folders) ? folders : [];
  },
  getPrompts() {
    return [...this.prompts];
  },
  setPrompts(prompts) {
    this.prompts = Array.isArray(prompts) ? prompts : [];
  },
  getBoardFolders() {
    return [...this.boardFolders];
  },
  setBoardFolders(folders) {
    this.boardFolders = Array.isArray(folders) ? folders : [];
  },
  getBoards() {
    return [...this.boards];
  },
  setBoards(boards) {
    this.boards = Array.isArray(boards) ? boards : [];
  },
  getActiveBoardId() {
    return this.activeBoardId;
  },
  setActiveBoardId(id) {
    this.activeBoardId = id;
  },
  getCurrentBoard() {
    return this.currentBoard;
  },
  setCurrentBoard(board) {
    this.currentBoard = board;
  },
  getCurrentSearchTerm() {
    return this.currentSearchTerm;
  },
  setCurrentSearchTerm(term) {
    this.currentSearchTerm = String(term || '').toLowerCase();
  },
  getTempBoardImages() {
    return [...this.tempBoardImages];
  },
  setTempBoardImages(images) {
    this.tempBoardImages = Array.isArray(images) ? images : [];
  },
  getSortConfig() {
    return { ...this.sortConfig };
  },
  setSortConfig(config) {
    this.sortConfig = {
      field: config?.field || 'name',
      direction: config?.direction || 'asc'
    };
  },
  getCurrentSort() {
    return { ...this.currentSort };
  },
  setCurrentSort(sort) {
    this.currentSort = {
      key: sort?.key || 'name',
      direction: sort?.direction || 'asc'
    };
  },
  getShowCompiledColors() {
    return this.showCompiledColors;
  },
  setShowCompiledColors(show) {
    this.showCompiledColors = Boolean(show);
  },
  getShowCardColors() {
    return this.showCardColors;
  },
  setShowCardColors(show) {
    this.showCardColors = Boolean(show);
  },
  getMonitoredFolder() {
    return this.monitoredFolder;
  },
  setMonitoredFolder(folder) {
    this.monitoredFolder = folder;
  },
  getBoardBackgroundColor() {
    return this.boardBackgroundColor;
  },
  setBoardBackgroundColor(color) {
    this.boardBackgroundColor = color;
  },
  getPaths() {
    return { ...this.paths };
  },
  setPaths(paths) {
    this.paths = paths && typeof paths === 'object' ? paths : {};
  },
  getSnippets() {
    return { ...this.snippets };
  },
  setSnippets(snippets) {
    this.snippets = snippets && typeof snippets === 'object' ? snippets : {};
  },
  // Text selection state methods
  getCurrentSelectedText() {
    return this.currentSelectedText;
  },
  setCurrentSelectedText(text) {
    this.currentSelectedText = String(text || '');
  },
  getCurrentSelectedCard() {
    return this.currentSelectedCard;
  },
  setCurrentSelectedCard(card) {
    this.currentSelectedCard = card;
  },
  getSelectionStartOffset() {
    return this.selectionStartOffset;
  },
  setSelectionStartOffset(offset) {
    this.selectionStartOffset = parseInt(offset, 10) || 0;
  },
  getSelectionEndOffset() {
    return this.selectionEndOffset;
  },
  setSelectionEndOffset(offset) {
    this.selectionEndOffset = parseInt(offset, 10) || 0;
  },
  // Tutorial state methods
  getTutorialShown() {
    return this.tutorialShown;
  },
  setTutorialShown(shown) {
    this.tutorialShown = Boolean(shown);
  },
  getCurrentTutorialStep() {
    return this.currentTutorialStep;
  },
  setCurrentTutorialStep(step) {
    this.currentTutorialStep = parseInt(step, 10) || 0;
  }
};
export { AppState, CONSTANTS, UI_CONSTANTS };
