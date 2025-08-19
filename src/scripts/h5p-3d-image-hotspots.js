import Util from '@services/util.js';
import H5PUtil from '@services/h5p-util.js';
import Dictionary from '@services/dictionary.js';
import Globals from '@services/globals.js';
import Main from '@components/main.js';
import MessageBox from '@components/messageBox/message-box.js';

import '@styles/h5p-3d-image-hotspots.scss';

/** @constant {number} FULLSCREEN_TIMEOUT_MS Fullscreen timeout in milliseconds. */
const FULLSCREEN_TIMEOUT_MS = 300;

/** @constant {number} FULLSCREEN_TIMEOUT_SHORT_MS Fullscreen timeout in milliseconds. */
const FULLSCREEN_TIMEOUT_SHORT_MS = 100;

/** @constant {string} Default description */
const DEFAULT_DESCRIPTION = '3D Model';

export default class ThreeDImageHotspots extends H5P.EventDispatcher {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    // Sanitize parameters
    const defaults = Util.extend({}, H5PUtil.getSemanticsDefaults());
    this.params = Util.extend(defaults, params);

    this.params = H5PUtil.processParameters(this.params);

    // Sanitize hotspots
    this.params.hotspots.hotspots = (this.params.hotspots.hotspots ?? [])
      .filter((hotspot) => hotspot.surface && hotspot.label || !Array.isArray(hotspot.contents))
      .map((hotspot) => {
        hotspot.label = Util.purifyHTML(hotspot.label);
        hotspot.contents = hotspot.contents.filter((content) => content.action?.library);

        return hotspot;
      })
      .filter((hotspot) => hotspot.contents.length > 0);

    this.contentId = contentId;
    this.extras = extras;

    // Fill dictionary
    this.dictionary = new Dictionary();
    this.dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    this.previousState = extras?.previousState || {};

    this.isFullscreenAllowed = this.isRoot() && H5P.fullscreenSupported;

    if (!this.params.model?.file?.path) {
      const messageBox = new MessageBox({
        text: this.dictionary.get('l10n.noModel')
      });
      this.dom = messageBox.getDOM();
      return;
    }

    if (this.params.hotspots.hotspots.length === 0) {
      const messageBox = new MessageBox({
        text: this.dictionary.get('l10n.noHotspotsWithContents')
      });
      this.dom = messageBox.getDOM();
      return;
    }

    this.globals = new Globals();
    this.globals.set('mainInstance', this);
    this.globals.set('contentId', this.contentId);
    this.globals.set('isFullscreenAllowed', this.isFullscreenAllowed);
    this.globals.set('resize', () => {
      this.trigger('resize');
    });

    this.main = new Main(
      {
        globals: this.globals,
        dictionary: this.dictionary,
        model: this.params.model,
        hotspots: this.params.hotspots,
        visuals: this.params.visuals,
        behaviour: this.params.behaviour,
        size: this.params.size,
        a11y: this.params.a11y,
      },
      {
        onFullscreenButtonClicked: () => {
          this.handleFullscreenClicked();
        }
      }
    );
    this.dom = this.main.getDOM();

    if (this.isFullscreenAllowed) {
      this.on('enterFullScreen', () => {
        this.main.setOverlayButtonAriaLabel('fullscreen', this.dictionary.get('a11y.buttonFullscreenExit'));

        const maxWidth = this.params.size.maxWidth ?
          `min(${this.params.size.maxWidth}, ${window.innerWidth}px)` :
          `${window.innerWidth}px`;

        const maxHeight = this.params.size.maxHeight ?
          `min(${this.params.size.maxHeight}, ${window.innerHeight}px)` :
          `${window.innerHeight}px`;

        window.setTimeout(() => {
          this.main.setModelMaxSize({
            maxHeight: maxHeight,
            maxWidth: maxWidth
          });
        }, FULLSCREEN_TIMEOUT_SHORT_MS); // True viewport height/width may not be available immediately
      });

      this.on('exitFullScreen', () => {
        this.main.setOverlayButtonAriaLabel('fullscreen', this.dictionary.get('a11y.buttonFullscreenEnter'));
        this.main.setModelMaxSize(this.params.size);
      });
    }
    this.on('resize', () => {
      this.main.resize();
    });
  }

  /**
   * Attach library to wrapper.
   * @param {H5P.jQuery} $wrapper Content's container.
   */
  attach($wrapper) {
    this.container = $wrapper.get(0);
    this.container.classList.add('h5p-3d-image-hotspots');
    this.container.appendChild(this.dom);
  }

  /**
   * Handle fullscreen button clicked.
   */
  handleFullscreenClicked() {
    setTimeout(() => {
      this.toggleFullscreen();
    }, FULLSCREEN_TIMEOUT_MS); // Some devices don't register user gesture before call to to requestFullscreen
  }

  /**
   * Toggle fullscreen button.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreen(state) {
    if (!this.container || !this.isFullscreenAllowed) {
      return;
    }

    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state !== 'boolean') {
      state = !H5P.isFullscreen;
    }

    if (state) {
      H5P.fullScreen(H5P.jQuery(this.container), this);
    }
    else {
      H5P.exitFullScreen();
    }
  }

  /**
   * Get task title.
   * @returns {string} Title.
   */
  getTitle() {
    // H5P Core function: createTitle
    return H5P.createTitle(
      this.extras?.metadata?.title || this.getDescription()
    );
  }

  /**
   * Get description.
   * @returns {string} Description.
   */
  getDescription() {
    return DEFAULT_DESCRIPTION;
  }
}
