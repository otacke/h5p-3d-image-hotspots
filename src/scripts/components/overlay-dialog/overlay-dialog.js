import FocusTrap from '@services/focus-trap.js';
import Util from '@services/util.js';
import './overlay-dialog.scss';

/** Class representing an overlay dialog */
export default class OverlayDialog {

  /**
   * Overlay dialog.
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onClosed] Callback when overlay closed.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.callbacks = Util.extend({
      onClosed: () => {},
      onOpenAnimationEnded: () => {},
      onCloseAnimationEnded: () => {},
    }, callbacks);

    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-3d-image-hotspots-overlay-dialog');
    this.dom.classList.add('display-none');
    this.dom.setAttribute('role', 'dialog');
    this.dom.setAttribute('aria-modal', 'true');

    this.outerWrapper = document.createElement('div');
    this.outerWrapper.classList.add('h5p-3d-image-hotspots-overlay-dialog-outer-wrapper');
    this.dom.append(this.outerWrapper);

    // Headline
    const headline = document.createElement('div');
    headline.classList.add('h5p-3d-image-hotspots-overlay-dialog-headline');
    this.outerWrapper.append(headline);

    this.headlineText = document.createElement('div');
    this.headlineText.classList.add('h5p-3d-image-hotspots-overlay-dialog-headline-text');
    headline.append(this.headlineText);

    // Close button
    this.buttonClose = document.createElement('button');
    this.buttonClose.classList.add('h5p-3d-image-hotspots-overlay-dialog-button-close');
    this.buttonClose.setAttribute(
      'aria-label', this.params.dictionary.get('a11y.close'),
    );
    this.buttonClose.addEventListener('click', () => {
      this.callbacks.onClosed();
    });
    this.outerWrapper.append(this.buttonClose);

    // Content
    this.content = document.createElement('div');
    this.content.classList.add('h5p-3d-image-hotspots-overlay-dialog-content');
    this.outerWrapper.append(this.content);

    this.focusTrap = new FocusTrap({
      trapElement: this.dom,
      closeElement: this.buttonClose,
      fallbackContainer: this.content,
    });
  }

  /**
   * Get DOM for exercise.
   * @returns {HTMLElement} DOM for exercise.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');

    // Prevent click listener from immediately closing the dialog
    window.requestAnimationFrame(() => {
      document.addEventListener('click', this.handleGlobalClick);
      document.addEventListener('keydown', this.handleKeyDown);

      this.focusTrap.activate();
    });
  }

  /**
   * Hide.
   * @param {object} [params] Parameters.
   * @param {boolean} [params.animate] If true, animate.
   * @param {function} [callback] Callback when animation done.
   */
  hide(params = {}, callback) {
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    this.dom.classList.add('display-none');

    const elementThatHadFocus = this.focusTrap.deactivate();
    elementThatHadFocus?.focus();
  }

  /**
   * Set DOM content.
   * @param {HTMLElement} dom DOM of content.
   */
  setContent(dom) {
    this.content.innerHTML = '';
    this.content.appendChild(dom);
  }

  /**
   * Set headline text.
   * @param {string} text Headline text to set.
   */
  setTitle(text) {
    text = Util.purifyHTML(text);

    this.headlineText.innerText = text;
    this.dom.setAttribute(
      'aria-label',
      this.params.dictionary.get('a11y.popupLabel').replace('@label', text),
    );
  }

  /**
   * Handle global click event.
   * @param {Event} event Click event.
   */
  handleGlobalClick(event) {
    if (
      !event.target.isConnected ||  // H5P content may have removed element already
      this.outerWrapper.contains(event.target)
    ) {
      return;
    }

    this.callbacks.onClosed();
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.callbacks.onClosed();
    }
  }
}
