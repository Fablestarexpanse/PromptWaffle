import { safeElementOperation } from '../../utils/index.js';

let currentCardId = null;
let currentColorPickerColor = '#ff0000';
let colorPickerEventsSetup = false;
let isBoardBackgroundPicker = false;
/**
 * Show color picker modal with error handling and validation
 * @param {string} cardId - The card ID to change color for
 * @param {string} currentColor - The current color value
 * @param {Function} changeCardColorCallback - The function to call when the color is changed.
 */
export function showColorPicker(
  cardId,
  currentColor = '#ff0000',
  changeCardColorCallback
) {
  try {
    if (!cardId || typeof cardId !== 'string') {
      console.error('Invalid cardId provided to showColorPicker:', cardId);
      return;
    }
    if (!currentColor || typeof currentColor !== 'string') {
      console.error(
        'Invalid currentColor provided to showColorPicker:',
        currentColor
      );
      currentColor = '#ff0000';
    }
    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(currentColor)) {
      console.warn('Invalid hex color format, using default:', currentColor);
      currentColor = '#ff0000';
    }
    currentCardId = cardId;
    currentColorPickerColor = currentColor;
    isBoardBackgroundPicker = false;
    const modal = document.getElementById('colorPickerModal');
    if (!modal) {
      console.error('Color picker modal not found');
      return;
    }
    // Update modal title for card color
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
      modalTitle.textContent = 'Choose Card Color';
    }
    const colorPreview = document.getElementById('colorPreview');
    if (!colorPreview) {
      console.error('Color preview element not found');
      return;
    }
    const colorHexInput = document.getElementById('colorHexInput');
    if (!colorHexInput) {
      console.error('Color hex input element not found');
      return;
    }
    if (!colorPreview || !colorHexInput) return;
    // Set initial color
    colorPreview.style.backgroundColor = currentColor;
    colorHexInput.value = currentColor.toUpperCase();
    // Position pointer based on current color
    try {
      updatePointerFromColor(currentColor);
    } catch (pointerError) {
      console.warn('Error updating color pointer:', pointerError);
    }
    modal.style.display = 'flex';
    // Setup color picker events if not already done
    try {
      setupColorPickerEvents(changeCardColorCallback);
    } catch (setupError) {
      console.error('Error setting up color picker events:', setupError);
    }
  } catch (error) {
    console.error('Error showing color picker:', error);
  }
}
/**
 * Show color picker modal for board background color
 * @param {string} currentColor - The current background color value
 * @param {Function} applyBackgroundColorCallback - The function to call when the color is applied
 */
export function showBoardBackgroundColorPicker(
  currentColor = '#2F3136',
  applyBackgroundColorCallback
) {
  try {
    if (!currentColor || typeof currentColor !== 'string') {
      console.error(
        'Invalid currentColor provided to showBoardBackgroundColorPicker:',
        currentColor
      );
      currentColor = '#2F3136';
    }
    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(currentColor)) {
      console.warn('Invalid hex color format, using default:', currentColor);
      currentColor = '#2F3136';
    }
    currentCardId = null; // No card ID for board background
    currentColorPickerColor = currentColor;
    isBoardBackgroundPicker = true;
    const modal = document.getElementById('colorPickerModal');
    if (!modal) {
      console.error('Color picker modal not found');
      return;
    }
    // Update modal title for board background
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
      modalTitle.textContent = 'Choose Board Background Color';
    }
    const colorPreview = document.getElementById('colorPreview');
    if (!colorPreview) {
      console.error('Color preview element not found');
      return;
    }
    const colorHexInput = document.getElementById('colorHexInput');
    if (!colorHexInput) {
      console.error('Color hex input element not found');
      return;
    }
    if (!colorPreview || !colorHexInput) return;
    // Set initial color
    colorPreview.style.backgroundColor = currentColor;
    colorHexInput.value = currentColor.toUpperCase();
    // Position pointer based on current color
    try {
      updatePointerFromColor(currentColor);
    } catch (pointerError) {
      console.warn('Error updating color pointer:', pointerError);
    }
    modal.style.display = 'flex';
    // Setup color picker events if not already done
    try {
      setupColorPickerEvents(applyBackgroundColorCallback);
    } catch (setupError) {
      console.error('Error setting up color picker events:', setupError);
    }
  } catch (error) {
    console.error('Error showing board background color picker:', error);
  }
}
/**
 * Setup color picker event handlers with error handling and validation
 */
function setupColorPickerEvents(changeCardColorCallback) {
  try {
    if (colorPickerEventsSetup) return;
    colorPickerEventsSetup = true;
    const colorWheel = document.getElementById('colorWheel');
    if (!colorWheel) {
      console.error('Color wheel element not found');
      return;
    }
    const colorHexInput = document.getElementById('colorHexInput');
    if (!colorHexInput) {
      console.error('Color hex input element not found');
      return;
    }
    const colorPickerCancel = document.getElementById('colorPickerCancel');
    if (!colorPickerCancel) {
      console.error('Color picker cancel button not found');
      return;
    }
    const colorPickerApply = document.getElementById('colorPickerApply');
    if (!colorPickerApply) {
      console.error('Color picker apply button not found');
      return;
    }
    const modal = document.getElementById('colorPickerModal');
    if (!modal) {
      console.error('Color picker modal not found');
      return;
    }
    if (
      !colorWheel ||
      !colorHexInput ||
      !colorPickerCancel ||
      !colorPickerApply ||
      !modal
    ) {
      console.error('One or more color picker elements not found');
      return;
    }
    // Color wheel click handler
    colorWheel.onclick = e => {
      try {
        handleColorWheelClick(e);
        // Clear preset selection when using color wheel
        const presetColors = document.querySelectorAll('.preset-color');
        presetColors.forEach(p => p.classList.remove('selected'));
      } catch (error) {
        console.error('Error in color wheel click handler:', error);
      }
    };
    colorWheel.onmousemove = e => {
      try {
        handleColorWheelMove(e);
      } catch (error) {
        console.error('Error in color wheel move handler:', error);
      }
    };
    // Hex input handler
    colorHexInput.oninput = e => {
      try {
        handleHexInput(e);
        // Clear preset selection when using hex input
        const presetColors = document.querySelectorAll('.preset-color');
        presetColors.forEach(p => p.classList.remove('selected'));
      } catch (error) {
        console.error('Error in hex input handler:', error);
      }
    };
    // Preset color selection
    const presetColors = document.querySelectorAll('.preset-color');
    presetColors.forEach(preset => {
      preset.addEventListener('click', () => {
        const color = preset.dataset.color;
        if (color) {
          // Remove previous selection
          presetColors.forEach(p => p.classList.remove('selected'));
          // Select current preset
          preset.classList.add('selected');
          // Update color
          currentColorPickerColor = color;
          updateColorFromWheel({ hex: color });
        }
      });
    });
    // Reset button handler
    const resetBtn = document.getElementById('colorPickerReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const defaultColor = isBoardBackgroundPicker ? '#2F3136' : '#40444b';
        currentColorPickerColor = defaultColor;
        updateColorFromWheel({ hex: defaultColor });
        // Clear preset selection
        presetColors.forEach(p => p.classList.remove('selected'));
      });
    }
    // Button handlers
    colorPickerCancel.onclick = () => {
      try {
        modal.style.display = 'none';
        currentCardId = null;
        isBoardBackgroundPicker = false;
      } catch (error) {
        console.error('Error in color picker cancel handler:', error);
      }
    };
    colorPickerApply.onclick = () => {
      try {
        if (isBoardBackgroundPicker) {
          // Apply board background color
          changeCardColorCallback(currentColorPickerColor);
        } else if (currentCardId) {
          // Apply card color
          changeCardColorCallback(currentCardId, currentColorPickerColor);
        }
        modal.style.display = 'none';
        currentCardId = null;
        isBoardBackgroundPicker = false;
      } catch (error) {
        console.error('Error in color picker apply handler:', error);
      }
    };
    // Close on background click
    modal.onclick = e => {
      try {
        if (e && e.target === modal) {
          modal.style.display = 'none';
          currentCardId = null;
          isBoardBackgroundPicker = false;
        }
      } catch (error) {
        console.error(
          'Error in color picker modal background click handler:',
          error
        );
      }
    };
  } catch (error) {
    console.error('Error setting up color picker events:', error);
  }
}
/**
 * Handle color wheel click events with error handling
 * @param {MouseEvent} e - The mouse event
 */
function handleColorWheelClick(e) {
  try {
    if (!e) {
      console.error('No event provided to handleColorWheelClick');
      return;
    }
    const color = getColorFromWheelEvent(e);
    if (color) {
      updateColorFromWheel(color);
    }
  } catch (error) {
    console.error('Error in color wheel click handler:', error);
  }
}
/**
 * Handle color wheel mouse move events with error handling
 * @param {MouseEvent} e - The mouse event
 */
function handleColorWheelMove(e) {
  try {
    if (!e) {
      console.error('No event provided to handleColorWheelMove');
      return;
    }
    if (e.buttons === 1) {
      // Left mouse button held down
      const color = getColorFromWheelEvent(e);
      if (color) {
        updateColorFromWheel(color);
      }
    }
  } catch (error) {
    console.error('Error in color wheel move handler:', error);
  }
}
/**
 * Extract color data from wheel event with validation
 * @param {MouseEvent} e - The mouse event
 * @returns {Object|null} Color data object or null if error
 */
function getColorFromWheelEvent(e) {
  try {
    if (!e || !e.currentTarget) {
      console.error('Invalid event provided to getColorFromWheelEvent');
      return null;
    }
    const wheel = e.currentTarget;
    const rect = wheel.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      console.error('Invalid wheel element dimensions');
      return null;
    }
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    // Convert to polar coordinates
    const distance = Math.min(Math.sqrt(x * x + y * y), centerX);
    const angle = Math.atan2(y, x);
    // Convert to HSL
    const hue = ((angle * 180) / Math.PI + 360) % 360;
    const saturation = Math.max(0, Math.min(100, (distance / centerX) * 100));
    const lightness = 50;
    return {
      hue: Math.max(0, Math.min(360, hue)),
      saturation,
      lightness,
      x: x + centerX,
      y: y + centerY
    };
  } catch (error) {
    console.error('Error getting color from wheel event:', error);
    return null;
  }
}
/**
 * Update color picker UI from wheel color data or hex color with error handling
 * @param {Object|string} colorData - Color data object with hue, saturation, lightness, x, y, or hex color string
 */
function updateColorFromWheel(colorData) {
  try {
    if (!colorData) {
      console.error(
        'Invalid colorData provided to updateColorFromWheel:',
        colorData
      );
      return;
    }
    let hex;
    let x, y;
    if (typeof colorData === 'string') {
      // Direct hex color
      hex = colorData;
      if (!/^#[0-9A-F]{6}$/i.test(hex)) {
        console.error('Invalid hex color format:', hex);
        return;
      }
      // Update pointer position for hex color
      try {
        updatePointerFromColor(hex);
      } catch (pointerError) {
        console.warn('Error updating pointer from hex color:', pointerError);
      }
    } else if (typeof colorData === 'object') {
      // Check if it's a hex color object
      if (colorData.hex) {
        hex = colorData.hex;
        if (!/^#[0-9A-F]{6}$/i.test(hex)) {
          console.error('Invalid hex color format:', hex);
          return;
        }
        // Update pointer position for hex color
        try {
          updatePointerFromColor(hex);
        } catch (pointerError) {
          console.warn('Error updating pointer from hex color:', pointerError);
        }
      } else {
        // Wheel color data
        const { hue, saturation, lightness, x: wheelX, y: wheelY } = colorData;
        // Validate color components
        if (
          typeof hue !== 'number' ||
          typeof saturation !== 'number' ||
          typeof lightness !== 'number'
        ) {
          console.error('Invalid color components in colorData:', colorData);
          return;
        }
        // Convert HSL to RGB to HEX
        const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100);
        if (!rgb) {
          console.error('Failed to convert HSL to RGB');
          return;
        }
        hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        if (!hex) {
          console.error('Failed to convert RGB to HEX');
          return;
        }
        x = wheelX;
        y = wheelY;
      }
    } else {
      console.error('Invalid colorData type:', typeof colorData);
      return;
    }
    currentColorPickerColor = hex;
    // Update UI safely
    const colorPreview = safeElementOperation(
      document.getElementById('colorPreview'),
      previewEl => {
        if (previewEl) {
          previewEl.style.backgroundColor = hex;
        }
      }
    );
    const colorHexInput = safeElementOperation(
      document.getElementById('colorHexInput'),
      inputEl => {
        if (inputEl) {
          inputEl.value = hex.toUpperCase();
        }
      }
    );
    // Update pointer position if coordinates are provided
    if (typeof x === 'number' && typeof y === 'number') {
      const colorPointer = safeElementOperation(
        document.getElementById('colorPointer'),
        pointerEl => {
          if (pointerEl) {
            pointerEl.style.left = `${x}px`;
            pointerEl.style.top = `${y}px`;
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating color from wheel:', error);
  }
}
/**
 * Handle hex color input with validation and error handling
 * @param {Event} e - The input event
 */
function handleHexInput(e) {
  try {
    if (!e || !e.target) {
      console.error('Invalid event provided to handleHexInput');
      return;
    }
    let hex = e.target.value;
    if (!hex || typeof hex !== 'string') {
      console.error('Invalid hex value:', hex);
      return;
    }
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      currentColorPickerColor = hex;
      const colorPreview = safeElementOperation(
        document.getElementById('colorPreview'),
        previewEl => {
          if (previewEl) {
            previewEl.style.backgroundColor = hex;
          }
        }
      );
      try {
        updatePointerFromColor(hex);
      } catch (pointerError) {
        console.warn('Error updating pointer from color:', pointerError);
      }
    }
  } catch (error) {
    console.error('Error handling hex input:', error);
  }
}
/**
 * Update color pointer position from hex color with error handling
 * @param {string} hex - Hex color string
 */
function updatePointerFromColor(hex) {
  try {
    if (!hex || typeof hex !== 'string') {
      console.error(
        'Invalid hex color provided to updatePointerFromColor:',
        hex
      );
      return;
    }
    const rgb = hexToRgb(hex);
    if (!rgb) {
      console.error('Failed to convert hex to RGB:', hex);
      return;
    }
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    if (!hsl) {
      console.error('Failed to convert RGB to HSL');
      return;
    }
    // Convert HSL back to wheel coordinates
    const wheel = safeElementOperation(
      document.getElementById('colorWheel'),
      wheelEl => {
        if (!wheelEl) {
          console.error('Color wheel element not found');
          return null;
        }
        return wheelEl;
      }
    );
    if (!wheel) return;
    const centerX = 120; // Half of wheel width (240px)
    const centerY = 120; // Half of wheel height (240px)
    const angle = (hsl.h * Math.PI) / 180;
    const distance = Math.max(0, Math.min(centerX, hsl.s * centerX));
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const colorPointer = safeElementOperation(
      document.getElementById('colorPointer'),
      pointerEl => {
        if (pointerEl) {
          pointerEl.style.left = `${x}px`;
          pointerEl.style.top = `${y}px`;
        }
      }
    );
  } catch (error) {
    console.error('Error updating pointer from color:', error);
  }
}
// Color conversion utilities
/**
 * Convert HSL to RGB with validation and error handling
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {Object|null} RGB object or null if error
 */
function hslToRgb(h, s, l) {
  try {
    // Validate inputs
    if (
      typeof h !== 'number' ||
      typeof s !== 'number' ||
      typeof l !== 'number'
    ) {
      console.error('Invalid HSL values:', { h, s, l });
      return null;
    }
    // Clamp values to valid ranges
    h = Math.max(0, Math.min(1, h));
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  } catch (error) {
    console.error('Error converting HSL to RGB:', error);
    return null;
  }
}
/**
 * Convert RGB to HSL with validation and error handling
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Object|null} HSL object or null if error
 */
function rgbToHsl(r, g, b) {
  try {
    // Validate inputs
    if (
      typeof r !== 'number' ||
      typeof g !== 'number' ||
      typeof b !== 'number'
    ) {
      console.error('Invalid RGB values:', { r, g, b });
      return null;
    }
    // Clamp values to valid ranges
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          h = 0;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.max(0, Math.min(360, h * 360)),
      s: Math.max(0, Math.min(100, s * 100)),
      l: Math.max(0, Math.min(100, l * 100))
    };
  } catch (error) {
    console.error('Error converting RGB to HSL:', error);
    return null;
  }
}
/**
 * Convert RGB to HEX with validation and error handling
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string|null} Hex color string or null if error
 */
function rgbToHex(r, g, b) {
  try {
    // Validate inputs
    if (
      typeof r !== 'number' ||
      typeof g !== 'number' ||
      typeof b !== 'number'
    ) {
      console.error('Invalid RGB values for hex conversion:', { r, g, b });
      return null;
    }
    // Clamp values to valid ranges
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  } catch (error) {
    console.error('Error converting RGB to HEX:', error);
    return null;
  }
}
/**
 * Convert HEX to RGB with validation and error handling
 * @param {string} hex - Hex color string
 * @returns {Object|null} RGB object or null if error
 */
function hexToRgb(hex) {
  try {
    if (!hex || typeof hex !== 'string') {
      console.error('Invalid hex value:', hex);
      return null;
    }
    // Ensure hex starts with #
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      console.error('Invalid hex format:', hex);
      return null;
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  } catch (error) {
    console.error('Error converting HEX to RGB:', error);
    return null;
  }
}
