import { AppState } from './state/appState.js';
import { showToast } from './utils/index.js';
// Tutorial steps configuration
const TUTORIAL_STEPS = [
  {
    title: 'Welcome to PromptWaffle!',
    description:
      "PromptWaffle is a powerful tool for building, organizing, and managing AI prompts. Let's take a quick tour to get you started!",
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNkY2RkZGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPldlbGNvbWUgdG8gUHJvbXB0V2FmZmxlITwvdGV4dD4KPC9zdmc+'
  },
  {
    title: 'The Sidebar - Your Content Hub',
    description:
      "The left sidebar is where you organize all your snippets, boards, and folders. You can create new snippets and boards, organize them into folders, and search by tags. The 'Start Here' folder contains your default board and some example snippets to get you started.",
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzNjM5M0YiIHN0cm9rZT0iIzQwNDQ0QiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNzI3NjdEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGFydCBIZXJlPC90ZXh0Pgo8dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjNzI3NjdEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FeGFtcGxlPC90ZXh0Pgo8dGV4dCB4PSI2MCIgeT0iODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjNzI3NjdEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TbmlwcGV0cyAmIEJvYXJkczwvdGV4dD4KPC9zdmc+'
  },
  {
    title: 'Creating Your First Snippet',
    description:
      "Click the 'Snippet' button in the sidebar to create your first snippet. Snippets can be full prompts or reusable sections you might want to use in different combinations. Add your text, tags for easy searching, and choose a folder to organize it. Snippets are the building blocks of your prompts!",
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNjM5M0YiIHN0cm9rZT0iIzQwNDQ0QiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2RjZGRkZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q3JlYXRlIGEgbmV3IHNuaXBwZXQ8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzcyNzY3RCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RnVsbCBwcm9tcHRzIG9yIHJldXNhYmxlPC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNzI3NjdEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5zZWN0aW9ucyB3aXRoIHRhZ3M8L3RleHQ+Cjwvc3ZnPg=='
  },
  {
    title: 'Wildcard Studio - Build Dynamic Prompts',
    description:
      "Try the 'Wildcard Studio' button to create dynamic prompts with wildcards! Select a profile, roll wildcards from different categories, and build complex prompts automatically. The 'wildcards/' and 'profiles/' folders in your main directory contain .txt files you can add, edit, or organize however you want.",
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNjM5M0YiIHN0cm9rZT0iIzQwNDQ0QiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTUiIGZpbGw9IiM1ODY1RjIiLz4KPHRleHQgeD0iMTAwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4pyFPC90ZXh0Pgo8cmVjdCB4PSIxMzAiIHk9IjkwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIGZpbGw9IiM3Mjc2N0QiLz4KPHRleHQgeD0iMTYwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjNzI3NjdEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Sb2xsPC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNkY2RkZGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPldpbGRjYXJkIFN0dWRpbzwvdGV4dD4KPHRleHQgeD0iMjAwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzcyNzY3RCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZmlsZXMsIHdpbGRjYXJkcywgYW5kIGR5bmFtaWMgcHJvbXB0czwvdGV4dD4KPC9zdmc+'
  },
  {
    title: 'The Board - Your Canvas',
    description:
      'The main area is your board where you build prompts by dragging snippets. Each snippet becomes a card that you can move, resize, and arrange. You can also split existing prompts into individual cards for editing. The board is your creative workspace!',
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNjM5M0YiIHN0cm9rZT0iIzQwNDQ0QiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxyZWN0IHg9IjgwIiB5PSI4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRTc0QzNCIi8+CjxyZWN0IHg9IjE4MCIgeT0iODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzM0OThEQiIvPgo8dGV4dCB4PSIyMDAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZGNkZGRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EcmFnIHNuaXBwZXRzIGhlcmU8L3RleHQ+Cjwvc3ZnPg=='
  },
  {
    title: 'Dragging and Dropping',
    description:
      'Simply drag snippets from the sidebar onto your board to create cards. You can move cards around, resize them, and arrange them in any order. Each card represents a piece of your final prompt.',
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjMwIiB5PSI4MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjM0Y5QzEyIiBvcGFjaXR5PSIwLjciLz4KPGFycm93IHgxPSI5MCIgeTE9IjEwMCIgeDI9IjE1MCIgeTI9IjEwMCIgc3Ryb2tlPSIjNTg2NUYyIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz4KPHRleHQgeD0iMTIwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNTg2NUYyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EcmFnPC90ZXh0Pgo8cmVjdCB4PSIxNjAiIHk9IjgwIiB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDk4REIiLz4KPC9zdmc+'
  },
  {
    title: 'The Compiled Prompt',
    description:
      'As you arrange cards on your board, the compiled prompt at the bottom automatically updates. This shows your final prompt text that you can copy to use in AI tools. The order of cards determines the order in your prompt.',
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjUwIiB5PSIxMDAiIHdpZHRoPSIzMDAiIGhlaWdodD0iNjAiIGZpbGw9IiMzNjM5M0YiIHN0cm9rZT0iIzQwNDQ0QiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNkY2RkZGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNvbXBpbGVkIFByb21wdDwvdGV4dD4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzcyNzY3RCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXV0b21hdGljYWxseSB1cGRhdGVzIGFzIHlvdSBhcnJhbmdlIGNhcmRzPC90ZXh0Pgo8L3N2Zz4='
  },
  {
    title: 'Advanced Features',
    description:
      "Explore advanced features like the Wildcard Studio for dynamic prompts, adding reference images, monitoring folders for AI-generated content, creating multiple boards, and using the text selection tool to split existing snippets. There's a lot more to discover!",
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMkVDQzcxIi8+CjxyZWN0IHg9IjE1MCIgeT0iNTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzU4NjVGMiIvPgo8cmVjdCB4PSIyNTAiIHk9IjUwIiB3aWR0aD0iODAiIGhlaWdodD0iNDAiIGZpbGw9IiNGMzlDMTIiLz4KPHRleHQgeD0iMjAwIiB5PSIxMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2RjZGRkZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V2lsZGNhcmQsIEltYWdlcywgQm9hcmRzPC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjE0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNzI3NjdEIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FeHBsb3JlIHRoZSBhZHZhbmNlZCBmZWF0dXJlcyE8L3RleHQ+Cjwvc3ZnPg=='
  },
  {
    title: "You're Ready to Go!",
    description:
      "That's it! You now know the basics of PromptWaffle. Start by creating some snippets, drag them to your board, and build your first prompt. Remember, you can always access help and explore more features as you go. Happy prompting!",
    image:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMkYzMTM2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiMyRUNDNzEiLz4KPHRleHQgeD0iMjAwIiB5PSIxMTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzJmMzEzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4pyFPC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjE2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZGNkZGRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Zb3UncmUgcmVhZHkgdG8gZ28hPC90ZXh0Pgo8L3N2Zz4='
  }
];
class Tutorial {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.titleElement = null;
    this.descriptionElement = null;
    this.imageElement = null;
    this.progressElement = null;
    this.prevButton = null;
    this.nextButton = null;
    this.skipButton = null;
  }
  init() {
    this.overlay = document.getElementById('tutorialOverlay');
    this.titleElement = document.getElementById('tutorialTitle');
    this.descriptionElement = document.getElementById('tutorialDescription');
    this.imageElement = document.getElementById('tutorialImage');
    this.progressElement = document.getElementById('tutorialProgress');
    this.prevButton = document.getElementById('tutorialPrevBtn');
    this.nextButton = document.getElementById('tutorialNextBtn');
    this.skipButton = document.getElementById('tutorialSkipBtn');
    if (!this.overlay) {
      console.error('Tutorial overlay not found');
      return;
    }
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.prevButton?.addEventListener('click', () => this.previousStep());
    this.nextButton?.addEventListener('click', () => this.nextStep());
    this.skipButton?.addEventListener('click', () => this.skipTutorial());
    // Close on backdrop click
    this.overlay?.addEventListener('click', e => {
      if (
        e.target === this.overlay ||
        e.target.classList.contains('tutorial-backdrop')
      ) {
        this.skipTutorial();
      }
    });
    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (!this.isActive) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.previousStep();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          this.nextStep();
          break;
        case 'Escape':
          e.preventDefault();
          this.skipTutorial();
          break;
      }
    });
    // Global keyboard shortcut to reset tutorial (Ctrl+Shift+T)
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.resetTutorial();
      }
    });
    // Global keyboard shortcut to check for updates (Ctrl+Shift+U)
    document.addEventListener('keydown', async e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        try {
          const { versionChecker } = await import('./utils/version-checker.js');
          const { updateUI } = await import('./utils/update-ui.js');
          const updateInfo = await versionChecker.checkForUpdates();
          versionChecker.displayUpdateNotification(updateInfo);
          if (updateInfo.success && updateInfo.isOutdated) {
            updateUI.showUpdateModal(updateInfo);
          } else if (updateInfo.success && !updateInfo.isOutdated) {
            const { showToast } = await import('./utils/index.js');
            showToast('You are running the latest version!', 'success');
          } else if (!updateInfo.success) {
            const { showToast } = await import('./utils/index.js');
            showToast(`Update check failed: ${updateInfo.error}`, 'error');
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
          const { showToast } = await import('./utils/index.js');
          showToast('Error checking for updates', 'error');
        }
      }
    });
  }
  shouldShowTutorial() {
    return !AppState.getTutorialShown();
  }
  start() {
    if (!this.shouldShowTutorial()) {
      return;
    }
    this.isActive = true;
    this.currentStep = 0;
    this.showStep(0);
    this.overlay.style.display = 'flex';
    // Mark tutorial as shown
    AppState.setTutorialShown(true);
    // Save the tutorial state
    this.saveTutorialState();
  }
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) {
      return;
    }
    const step = TUTORIAL_STEPS[stepIndex];
    if (this.titleElement) {
      this.titleElement.textContent = step.title;
    }
    if (this.descriptionElement) {
      this.descriptionElement.textContent = step.description;
    }
    if (this.imageElement) {
      this.imageElement.src = step.image;
      this.imageElement.alt = step.title;
    }
    if (this.progressElement) {
      this.progressElement.textContent = `Step ${stepIndex + 1} of ${TUTORIAL_STEPS.length}`;
    }
    // Update button states
    if (this.prevButton) {
      this.prevButton.disabled = stepIndex === 0;
    }
    if (this.nextButton) {
      this.nextButton.textContent =
        stepIndex === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
    }
    this.currentStep = stepIndex;
  }
  nextStep() {
    if (this.currentStep < TUTORIAL_STEPS.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.finishTutorial();
    }
  }
  previousStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }
  skipTutorial() {
    this.finishTutorial();
  }
  finishTutorial() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    showToast('Tutorial completed! Welcome to PromptWaffle!', 'success');
  }
  saveTutorialState() {
    try {
      // Save to localStorage for persistence
      localStorage.setItem('promptwaffle_tutorial_shown', 'true');
    } catch (error) {
      console.warn('Could not save tutorial state to localStorage:', error);
    }
  }
  loadTutorialState() {
    try {
      const tutorialShown = localStorage.getItem('promptwaffle_tutorial_shown');
      if (tutorialShown === 'true') {
        AppState.setTutorialShown(true);
      }
    } catch (error) {
      console.warn('Could not load tutorial state from localStorage:', error);
    }
  }
  // Method to reset tutorial (for testing purposes)
  resetTutorial() {
    AppState.setTutorialShown(false);
    AppState.setCurrentTutorialStep(0);
    try {
      localStorage.removeItem('promptwaffle_tutorial_shown');
    } catch (error) {
      console.warn('Could not remove tutorial state from localStorage:', error);
    }
    showToast('Tutorial reset! Refresh the page to see it again.', 'info');
  }
}
// Create and export tutorial instance
const tutorial = new Tutorial();
export { tutorial };
