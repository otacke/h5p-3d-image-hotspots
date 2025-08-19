import Util from '@services/util.js';
import { getContrastColorBW } from '@services/color-util.js';
import './hotspot.scss';

export default class Hotspot {

  /**
   * @class Hotspot
   * @param {object} params Parameters for the hotspot.
   * @param {string} params.surface The surface on which the hotspot is placed.
   * @param {string} params.label The label for the hotspot.
   * @param {object} params.appearance The appearance settings for the hotspot.
   * @param {string} params.appearance.type The type of appearance ('label' or 'icon').
   * @param {string} params.appearance.icon The icon class if type is 'icon'.
   * @param {string} params.appearance.color The color of the hotspot.
   * @param {object} callbacks Callbacks for hotspot events.
   * @param {function} callbacks.onClick Callback function when the hotspot is clicked.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      appearance: {
        type: 'label',
        icon: 'plus',
      }
    }, params);

    this.dom = document.createElement('button');
    this.dom.classList.add('hotspot');
    this.dom.setAttribute('slot', `hotspot-${this.params.index}`);
    this.dom.setAttribute('data-surface', this.params.surface);
    this.dom.setAttribute('aria-label', this.params.label);

    if (this.params.appearance.type === 'label') {
      const label = document.createElement('span');
      label.classList.add('hotspot-label');
      label.textContent = this.params.label;
      this.dom.appendChild(label);
    }
    else {
      this.dom.classList.add('hotspot-button');
      this.dom.classList.add(this.params.appearance.icon);
    }

    if (this.params.appearance.color) {
      const color = getContrastColorBW(this.params.appearance.color);
      this.dom.style.setProperty('--hotspot-background-color', this.params.appearance.color);
      this.dom.style.setProperty('--hotspot-color', color);
    }

    this.dom.addEventListener('click', () => {
      callbacks.onClick?.(this.params.index);
    });
  }

  /**
   * Get the DOM element for this hotspot.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }
}
