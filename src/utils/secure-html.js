/**
 * Secure HTML utilities for PromptWaffle
 * Provides safe alternatives to dangerous innerHTML usage
 */

import { sanitizeHTML } from './security.js';

/**
 * Safely sets HTML content with sanitization
 * @param {HTMLElement} element - The DOM element to update
 * @param {string} html - HTML content to set
 * @param {boolean} sanitize - Whether to sanitize the HTML (default: true)
 */
export function setSecureHTML(element, html, sanitize = true) {
  if (!element || !(element instanceof HTMLElement)) {
    console.warn('[Security] Invalid element for setSecureHTML');
    return;
  }

  if (typeof html !== 'string') {
    console.warn('[Security] Invalid HTML content type:', typeof html);
    element.textContent = String(html);
    return;
  }

  try {
    if (sanitize) {
      const cleanHTML = sanitizeHTML(html);
      element.innerHTML = cleanHTML;
    } else {
      // Only allow safe HTML content
      if (isSafeHTML(html)) {
        element.innerHTML = html;
      } else {
        console.warn('[Security] Unsafe HTML content detected, using textContent instead');
        element.textContent = html;
      }
    }
  } catch (error) {
    console.error('[Security] Error setting secure HTML:', error);
    element.textContent = html;
  }
}

/**
 * Checks if HTML content is safe (no dangerous tags/attributes)
 * @param {string} html - HTML content to check
 * @returns {boolean} - True if HTML is safe
 */
function isSafeHTML(html) {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi
  ];

  return !dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Safely creates HTML elements from strings
 * @param {string} htmlString - HTML string to create elements from
 * @returns {DocumentFragment|HTMLElement|null} - Created elements or null if unsafe
 */
export function createSecureElement(htmlString) {
  if (typeof htmlString !== 'string') {
    return null;
  }

  if (!isSafeHTML(htmlString)) {
    console.warn('[Security] Unsafe HTML string detected, creating text element instead');
    const div = document.createElement('div');
    div.textContent = htmlString;
    return div;
  }

  try {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstElementChild || template.content;
  } catch (error) {
    console.error('[Security] Error creating secure element:', error);
    return null;
  }
}

/**
 * Safely appends HTML content to an element
 * @param {HTMLElement} parent - Parent element to append to
 * @param {string} html - HTML content to append
 * @param {boolean} sanitize - Whether to sanitize the HTML (default: true)
 */
export function appendSecureHTML(parent, html, sanitize = true) {
  if (!parent || !(parent instanceof HTMLElement)) {
    console.warn('[Security] Invalid parent element for appendSecureHTML');
    return;
  }

  const element = createSecureElement(html);
  if (element) {
    if (sanitize) {
      const sanitizedElement = createSecureElement(sanitizeHTML(html));
      if (sanitizedElement) {
        parent.appendChild(sanitizedElement);
      }
    } else {
      parent.appendChild(element);
    }
  }
}

/**
 * Safely inserts HTML content before a reference element
 * @param {HTMLElement} parent - Parent element
 * @param {string} html - HTML content to insert
 * @param {HTMLElement} referenceNode - Reference node to insert before
 * @param {boolean} sanitize - Whether to sanitize the HTML (default: true)
 */
export function insertSecureHTMLBefore(parent, html, referenceNode, sanitize = true) {
  if (!parent || !(parent instanceof HTMLElement) || !referenceNode) {
    console.warn('[Security] Invalid parameters for insertSecureHTMLBefore');
    return;
  }

  const element = createSecureElement(html);
  if (element) {
    if (sanitize) {
      const sanitizedElement = createSecureElement(sanitizeHTML(html));
      if (sanitizedElement) {
        parent.insertBefore(sanitizedElement, referenceNode);
      }
    } else {
      parent.insertBefore(element, referenceNode);
    }
  }
}

/**
 * Safely replaces HTML content
 * @param {HTMLElement} element - Element to replace content in
 * @param {string} html - New HTML content
 * @param {boolean} sanitize - Whether to sanitize the HTML (default: true)
 */
export function replaceSecureHTML(element, html, sanitize = true) {
  if (!element || !(element instanceof HTMLElement)) {
    console.warn('[Security] Invalid element for replaceSecureHTML');
    return;
  }

  // Clear existing content
  element.innerHTML = '';
  
  // Add new content safely
  appendSecureHTML(element, html, sanitize);
}

/**
 * Creates a safe text node (always safe)
 * @param {string} text - Text content
 * @returns {Text} - Text node
 */
export function createSafeText(text) {
  return document.createTextNode(String(text || ''));
}

/**
 * Safely sets text content (always safe)
 * @param {HTMLElement} element - Element to set text content for
 * @param {string} text - Text content
 */
export function setSafeText(element, text) {
  if (!element || !(element instanceof HTMLElement)) {
    console.warn('[Security] Invalid element for setSafeText');
    return;
  }

  element.textContent = String(text || '');
}

/**
 * Safely updates element attributes
 * @param {HTMLElement} element - Element to update
 * @param {Object} attributes - Attributes to set
 */
export function setSecureAttributes(element, attributes) {
  if (!element || !(element instanceof HTMLElement) || typeof attributes !== 'object') {
    console.warn('[Security] Invalid parameters for setSecureAttributes');
    return;
  }

  const safeAttributes = {
    class: true,
    id: true,
    style: true,
    title: true,
    alt: true,
    src: true,
    href: true,
    type: true,
    value: true,
    placeholder: true,
    disabled: true,
    readonly: true,
    required: true,
    maxlength: true,
    minlength: true,
    pattern: true,
    autocomplete: true,
    autofocus: true,
    form: true,
    name: true,
    size: true,
    max: true,
    min: true,
    step: true,
    multiple: true,
    accept: true,
    target: true,
    rel: true,
    download: true,
    hreflang: true,
    media: true,
    integrity: true,
    crossorigin: true,
    referrerpolicy: true
  };

  for (const [key, value] of Object.entries(attributes)) {
    if (safeAttributes[key] && value !== undefined && value !== null) {
      // Special handling for style attribute
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }
}

/**
 * Safely removes dangerous attributes from an element
 * @param {HTMLElement} element - Element to clean
 */
export function cleanElement(element) {
  if (!element || !(element instanceof HTMLElement)) {
    return;
  }

  const dangerousAttributes = [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
    'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup',
    'onmousemove', 'onmouseenter', 'onmouseleave', 'oncontextmenu',
    'onabort', 'onbeforeunload', 'onerror', 'onhashchange',
    'onmessage', 'onoffline', 'ononline', 'onpagehide', 'onpageshow',
    'onpopstate', 'onresize', 'onstorage', 'onunload'
  ];

  dangerousAttributes.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
  });

  // Remove any inline event handlers
  const style = element.getAttribute('style');
  if (style && style.includes('javascript:')) {
    element.removeAttribute('style');
  }
}

export default {
  setSecureHTML,
  createSecureElement,
  appendSecureHTML,
  insertSecureHTMLBefore,
  replaceSecureHTML,
  createSafeText,
  setSafeText,
  setSecureAttributes,
  cleanElement,
  isSafeHTML
};
