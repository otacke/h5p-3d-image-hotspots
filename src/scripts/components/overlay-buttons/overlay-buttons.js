import Util from '@services/util.js';
import './overlay-buttons.scss';

export default class OverlayButtons {

  /**
   * @class
   * @param {object} params Parameters.
   * @param {boolean} [params.isPlayingEnabled] Whether play button should be shown.
   * @param {boolean} [params.isFullscreenAllowed] Whether fullscreen button should be shown.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onPlayButtonClicked Callback when play button clicked.
   * @param {function} callbacks.onFullscreenButtonClicked Callback when fullscreen button clicked.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      isPlayingEnabled: false,
      isFullscreenAllowed: false,
    }, params);

    this.callbacks = Util.extend({
      onPlayButtonClicked: () => {},
      onFullscreenButtonClicked: () => {},
    }, callbacks);

    this.buttons = {};

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-3d-image-hotspots-overlay-buttons');

    if (params.isPlayingEnabled) {
      this.buttons.play = document.createElement('button');
      this.buttons.play.classList.add('h5p-3d-image-hotspots-button');
      this.buttons.play.classList.add('h5p-3d-image-hotspots-button-play');
      this.buttons.play.setAttribute('aria-label', this.params.dictionary.get('a11y.buttonPlay'));
      this.buttons.play.addEventListener('click', () => {
        this.callbacks.onPlayButtonClicked();
      });
      this.dom.appendChild(this.buttons.play);
    }

    if (params.isFullscreenAllowed) {
      this.buttons.fullscreen = document.createElement('button');
      this.buttons.fullscreen.classList.add('h5p-3d-image-hotspots-button');
      this.buttons.fullscreen.classList.add('h5p-3d-image-hotspots-button-fullscreen');
      this.buttons.fullscreen.setAttribute('aria-label', this.params.dictionary.get('a11y.buttonFullscreenEnter'));
      this.buttons.fullscreen.addEventListener('click', () => {
        this.callbacks.onFullscreenButtonClicked();
      });
      this.dom.appendChild(this.buttons.fullscreen);
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
   * Toggle a button class.
   * @param {string} id Button ID.
   * @param {string} className Class name to toggle.
   * @param {boolean} state Whether to toggle class on or off.
   */
  toggleButtonClass(id, className, state) {
    if (!this.buttons[id]) {
      return;
    }

    this.buttons[id].classList.toggle(className, state);
  }

  /**
   * Set button aria label.
   * @param {string} id Button ID.
   * @param {string} ariaLabel Aria label.
   */
  setButtonAriaLabel(id, ariaLabel) {
    if (!this.buttons[id]) {
      return;
    }
    this.buttons[id].setAttribute('aria-label', ariaLabel);
  }
}
