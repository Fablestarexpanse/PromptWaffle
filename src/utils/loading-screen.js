class LoadingScreen {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.mainApp = document.getElementById('mainApp');
    this.loadingText = document.querySelector('.loading-text');
    this.loadingFill = document.querySelector('.loading-fill');
    this.isHidden = false;
  }

  show() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('hidden');
      this.isHidden = false;
    }
    if (this.mainApp) {
      this.mainApp.style.display = 'none';
    }
  }

  hide() {
    if (this.loadingScreen && !this.isHidden) {
      this.loadingScreen.classList.add('hidden');
      this.isHidden = true;
      
      // Show main app after loading screen fades out
      setTimeout(() => {
        if (this.mainApp) {
          this.mainApp.style.display = 'flex';
        }
      }, 500);
    }
  }

  updateProgress(progress, text) {
    if (this.loadingFill) {
      this.loadingFill.style.width = `${progress}%`;
    }
    if (this.loadingText && text) {
      this.loadingText.textContent = text;
    }
  }

  // Simulate loading progress with different stages
  async simulateLoading() {
    const stages = [
      { progress: 10, text: 'Loading application...' },
      { progress: 25, text: 'Initializing components...' },
      { progress: 40, text: 'Loading boards...' },
      { progress: 60, text: 'Setting up metadata panel...' },
      { progress: 80, text: 'Preparing interface...' },
      { progress: 95, text: 'Almost ready...' },
      { progress: 100, text: 'Ready!' }
    ];

    for (const stage of stages) {
      this.updateProgress(stage.progress, stage.text);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Wait a bit more before hiding
    await new Promise(resolve => setTimeout(resolve, 500));
    this.hide();
  }
}

// Create global instance
window.loadingScreen = new LoadingScreen();

export { LoadingScreen }; 