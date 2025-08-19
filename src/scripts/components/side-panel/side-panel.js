import './side-panel.scss';

export default class SidePanel {
  constructor(params = {}, callbacks = {}) {
    this.params = params;
    this.callbacks = callbacks;

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-3d-image-hotspots-sidepanel');

    this.headerDOM = document.createElement('div');
    this.headerDOM.classList.add('h5p-3d-image-hotspots-sidepanel-header');
    this.setHeader();
    this.dom.appendChild(this.headerDOM);

    this.sidePanelContent = document.createElement('div');
    this.sidePanelContent.classList.add('h5p-3d-image-hotspots-sidepanel-content');
    this.dom.appendChild(this.sidePanelContent);

    if (this.params.placeholder) {
      const placeholderDOM = document.createElement('p');
      placeholderDOM.classList.add('h5p-3d-image-hotspots-sidepanel-placeholder');
      placeholderDOM.innerText = this.params.placeholder;
      this.sidePanelContent.appendChild(placeholderDOM);
    }
  }

  /**
   * Get DOM element.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set header text.
   * @param {string} label Header text.
   */
  setHeader(label = '') {
    label = label.trim();

    this.headerDOM.classList.toggle('display-none', !label);
    this.headerDOM.innerText = label;
  }

  /**
   * Set content DOM.
   * @param {HTMLElement} contentDOM Content DOM to set.
   */
  setContentDOM(contentDOM) {
    this.sidePanelContent.innerHTML = '';
    this.sidePanelContent.appendChild(contentDOM);
  }

  /**
   * Focus on the side panel.
   * @param {object} [options] Options.
   * @param {string} [options.fallbackSelector] Selector for fallback element to focus.
   */
  focus(options = {}) {
    const focusableElements = this.getFocusableElements(this.sidePanelContent);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    else {
      /*
        * Following similar pattern that advises to set tabindex -1 and focus on static element instead (for modals)
        * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/
        */
      const fallbackWrapper = this.sidePanelContent.querySelector(options.fallbackSelector ?? '');
      if (!fallbackWrapper) {
        return;
      }

      const firstElementWithText = this.findFirstElementWithText(fallbackWrapper);
      if (!firstElementWithText) {
        return;
      }

      firstElementWithText.setAttribute('tabindex', '-1');
      firstElementWithText.addEventListener('blur', () => {
        firstElementWithText.removeAttribute('tabindex');
      }, true);
      firstElementWithText.focus();
    }
  }

  /**
   * Set max height of side panel.
   * @param {number} maxHeight Max height in px.
   */
  setMaxHeight(maxHeight) {
    if (!maxHeight) {
      this.dom.style.removeProperty('--max-height-secondary');
    }
    else {
      this.dom.style.setProperty('--max-height-secondary', `${maxHeight}px`);
    }
  }

  /**
   * Get focusable elements within container.
   * @param {HTMLElement} container Container to look in.
   * @returns {HTMLElement[]} Focusable elements within container.
   */
  getFocusableElements(container) {
    if (!container) {
      return [];
    }

    const focusableElementsSelector = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'video',
      'audio',
      '*[tabindex="0"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableElementsSelector))
      .filter((element) => {
        return (
          element.disabled !== true &&
          element.getAttribute('tabindex') !== '-1' &&
          this.isElementVisible(element)
        );
      });
  }

  /**
   * Check whether element is visible.
   * @param {HTMLElement} element Element to check.
   * @returns {boolean} True, if element is visible, false otherwise.
   */
  isElementVisible(element) {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    return element.parentElement ? this.isElementVisible(element.parentElement) : true;
  }

  /**
   * Find first text node in element.
   * @param {HTMLElement} element Element to search in.
   * @returns {Text|null} First text node or null if not found.
   */
  findFirstElementWithText(element) {
    const hasDirectText = Array.from(element.childNodes)
      .some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());

    if (hasDirectText) {
      return element;
    }

    for (const child of element.children) {
      const foundElement = this.findFirstElementWithText(child);
      if (foundElement) {
        return foundElement;
      }
    }

    return null;
  }
}
