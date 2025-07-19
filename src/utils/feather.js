/**
 * Replace feather icons in a container with error handling and validation
 * @param {Element} container - The container element to search for icons
 */
export function replaceFeatherIcons(container = document) {
  try {
    if (!container || !container.querySelectorAll) {
      console.error(
        'Invalid container provided to replaceFeatherIcons:',
        container
      );
      return;
    }
    // Check if feather library is available
    if (typeof feather === 'undefined' || !feather.icons) {
      console.warn('Feather icons library not available');
      return;
    }
    // Only replace icons in specific container to improve performance
    const elements = container.querySelectorAll('[data-feather]');
    if (!elements || elements.length === 0) {
      return; // No icons to replace
    }
    let replacedCount = 0;
    elements.forEach((element, index) => {
      try {
        if (!element || !element.getAttribute) {
          console.warn(`Invalid element at index ${index}`);
          return;
        }
        const iconName = element.getAttribute('data-feather');
        if (!iconName || typeof iconName !== 'string') {
          console.warn(`Invalid icon name at index ${index}:`, iconName);
          return;
        }
        if (feather.icons[iconName]) {
          try {
            const svgString = feather.icons[iconName].toSvg();
            if (svgString && typeof svgString === 'string') {
              element.innerHTML = svgString;
              replacedCount++;
            } else {
              console.warn(`Invalid SVG generated for icon: ${iconName}`);
            }
          } catch (svgError) {
            console.error(
              `Error generating SVG for icon ${iconName}:`,
              svgError
            );
          }
        } else {
          console.warn(`Icon not found: ${iconName}`);
        }
      } catch (elementError) {
        console.warn(
          `Error processing element at index ${index}:`,
          elementError
        );
      }
    });
    if (replacedCount > 0) {
    }
  } catch (error) {
    console.error('Error replacing feather icons:', error);
  }
}
