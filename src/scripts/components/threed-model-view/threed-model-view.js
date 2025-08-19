
/*
 * This pseudo dynamic import requires `chunkFormat: false` to be set in the output object of webpack.config.js to avoid
 * issues with chunk loading on H5P integrations that bundle scripts.
 */
if (!window.__THREE__ && !window.H5PThreedModelViewerLoaded) {
  window.H5PThreedModelViewerLoaded = true;
  import('@google/model-viewer');
}
import  Util from '@services/util.js';
import H5PUtil from '@services/h5p-util.js';
import { getContrastColorBW } from '@services/color-util.js';
import Hotspot from '@components/hotspot/hotspot.js';
import './threed-model-view.scss';

export default class ThreeDModelView {

  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      hotspots: []
    }, params);

    this.callbacks = Util.extend({
      onModelLoaded: () => {},
      onHotspotClicked: () => {}
    }, callbacks);

    this.dom = this.buildDOM(this.params);

    this.setMaxSize(this.params.size);

    this.dom.setAttribute('loading', 'eager');
    // Set model source, initiates loading the model
    this.dom.setAttribute('src', this.params.src);
  }

  /**
   * Build DOM.
   * @returns {HTMLElement} DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Buid DOM.
   * @param {object} params Parameters.
   * @returns {HTMLElement} DOM.
   */
  buildDOM(params = {}) {
    // model-viewer is custom element expected by @google/model-viewer
    const dom = document.createElement('model-viewer');

    dom.classList.add('threed-model-view');
    if (params.className) {
      dom.classList.add(params.className);
    }

    dom.setAttribute('camera-controls', '');
    dom.setAttribute('disable-tap', '');

    if (params.poster) {
      dom.setAttribute('poster', params.poster);
    }

    if (params.alt) {
      dom.setAttribute('alt', params.alt);
    }
    dom.setAttribute('a11y', this.buildA11y(params.a11y));

    if (params.hotspotColorDefault) {
      dom.style.setProperty('--hotspot-background-color', params.hotspotColorDefault);
      dom.style.setProperty('--hotspot-color', getContrastColorBW(params.hotspotColorDefault));
    }
    else if (H5PUtil.hasTheme()) {
      dom.style.setProperty('--hotspot-background-color', 'var(--h5p-theme-main-cta-base)');
      dom.style.setProperty('--hotspot-color', 'var(--h5p-theme-contrast-cta)');
    }

    params.hotspots.forEach((hotspotParams, index) => {
      hotspotParams.index = index;

      const hotspot = new Hotspot(hotspotParams, {
        onClick: (hotspotIndex) => {
          this.callbacks.onHotspotClicked(hotspotIndex);
        }
      });

      dom.appendChild(hotspot.getDOM());
    });

    dom.addEventListener('load', () => {
      this.updateAspectRatio();
      this.callbacks.onModelLoaded({
        availableAnimations: dom.availableAnimations ?? []
      });
    });

    dom.addEventListener('play', () => {
      this.handlePlayStateChanged(true);
    });

    dom.addEventListener('pause', () => {
      this.handlePlayStateChanged(false);
    });

    dom.addEventListener('keydown', (event) => {
      if (event.key === '-') {
        dom.zoom(-1);
      }
      else if (event.key === '+') {
        dom.zoom(1);
      }
    });

    return dom;
  }

  /**
   * Handle changes of the models' play state.
   * @param {boolean} isPlaying Whether the model is playing.
   */
  handlePlayStateChanged(isPlaying) {
    this.isPlayingState = isPlaying;

    this.callbacks.onPlayStateChanged?.(this.isPlayingState);
  }

  /**
   * Ensure all hotspots are visible. Workaround.
   * For some reason, not all hotspots are visible unless the animation is played briefly.
   */
  ensureAllHotspotsVisible() {
    this.dom.play?.();
    this.dom.currentTime = 0;

    window.requestAnimationFrame(() => {
      this.dom.pause?.();
      this.dom.currentTime = 0;
    });
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Toggle play.
   */
  togglePlay() {
    if (this.isPlayingState) {
      this.dom.pause?.();
    }
    else {
      this.dom.play?.();
    }
  }

  /**
   * Set maximum size.
   * @param {object} size Size.
   * @param {string|undefined} size.maxWidth Maximum width or undefined to reset.
   * @param {string|undefined} size.minHeight Minimum height or undefined to reset.
   */
  setMaxSize(size = {}) {
    this.dom.style.maxWidth = size.maxWidth ?? '';
    this.dom.style.minHeight = size.minHeight ?? '';
    this.dom.style.maxHeight = size.maxHeight ?? '';
  }

  /**
   * Set model source.
   * @param {string} src Source object file path.
   */
  setModel(src) {
    if (typeof src !== 'string') {
      return;
    }

    if (
      !src.endsWith('.gltf') &&
      !src.endsWith('.glb')
    ) {
      return;
    }

    // Set model
    this.dom.setAttribute('src', src);
  }

  /**
   * Update the DOMs aspect ratio.
   * @param {object} ratio Aspect ratio.
   */
  updateAspectRatio(ratio) {
    let newAspectRatio;

    if (typeof ratio === 'number' && ratio > 0) {
      newAspectRatio = ratio;
    }

    if (!newAspectRatio) {
      // Try to get model dimensions for ratio
      const dimensions = this.getDimensions();
      if (dimensions?.x > 0 && dimensions?.y > 0) {
        newAspectRatio = dimensions.x / dimensions.y;
      }
    }

    if (!newAspectRatio) {
      return;
    }

    this.aspectRatio = newAspectRatio;
    this.dom.style.setProperty('--aspect-ratio', this.aspectRatio);
  }

  /**
   * Get the preferred height of the model.
   * @returns {number} Preferred height in px.
   */
  getPreferredHeight() {
    return this.dom.getBoundingClientRect().width / this.aspectRatio;
  }

  /**
   * Get dimensions of DOM.
   * @returns {object|undefined} Dimensions.
   */
  getDimensions() {
    if (!this.dom.getDimensions) {
      return; // May not be ready yet
    }

    return this.dom.getDimensions();
  }

  /**
   * Build a11y attributes.
   * @param {object} params Parameters.
   * @returns {string} A11y attributes as string.
   */
  buildA11y(params = {}) {
    const a11yProps = [
      'back', 'front', 'left', 'right',
      'lower-back', 'lower-front', 'lower-left', 'lower-right',
      'upper-back', 'upper-front', 'upper-left', 'upper-right',
      'interaction-prompt'
    ];

    const a11yAttributes = {};
    a11yProps.forEach((prop) => {
      if (params[prop]) {
        a11yAttributes[prop] = params[prop];
      }
    });

    if (Object.keys(a11yAttributes).length === 0) {
      return ''; // No a11y attributes set
    }

    // Set the attribute on the DOM element with the new object
    return JSON.stringify(a11yAttributes);
  }
}
