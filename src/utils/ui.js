export function showCenteredWarning(message) {
  // Remove any existing centered warning
  const existingWarning = document.getElementById('centeredWarning');
  if (existingWarning) {
    existingWarning.remove();
  }
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'centeredWarning';
  overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
  // Create warning box
  const warningBox = document.createElement('div');
  warningBox.style.cssText = `
      background: #fff;
      border: 2px solid #f39c12;
      border-radius: 8px;
      padding: 20px 30px;
      max-width: 500px;
      min-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      text-align: center;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;
  // Create warning content
  warningBox.innerHTML = `
      <div style="color: #e67e22; font-size: 24px; margin-bottom: 15px;">⚠️</div>
      <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Image Limit Reached</h3>
      <p style="color: #555; margin: 0 0 20px 0; line-height: 1.4;">${message}</p>
      <button id="warningOkBtn" style="
        background: #f39c12;
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      ">OK</button>
    `;
  overlay.appendChild(warningBox);
  document.body.appendChild(overlay);
  // Trigger animations
  setTimeout(() => {
    overlay.style.opacity = '1';
    warningBox.style.transform = 'scale(1)';
  }, 10);
  // Add button hover effect
  const okButton = warningBox.querySelector('#warningOkBtn');
  okButton.onmouseover = () => (okButton.style.background = '#d68910');
  okButton.onmouseout = () => (okButton.style.background = '#f39c12');
  // Close on button click or overlay click
  const closeWarning = () => {
    overlay.style.opacity = '0';
    warningBox.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 300);
  };
  okButton.onclick = closeWarning;
  overlay.onclick = e => {
    if (e.target === overlay) {
      closeWarning();
    }
  };
  // Close with Escape key
  const handleEscape = e => {
    if (e.key === 'Escape') {
      closeWarning();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
