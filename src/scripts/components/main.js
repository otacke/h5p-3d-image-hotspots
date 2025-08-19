import ThreeDModelView from '@components/threed-model-view/threed-model-view.js';
import SidePanel from '@components/side-panel/side-panel.js';
import ContentBundle from '@components/content-bundle/content-bundle.js';
import OverlayButtons from '@components/overlay-buttons/overlay-buttons.js';
import OverlayDialog from '@components/overlay-dialog/overlay-dialog.js';
import Util from '@services/util.js';
import './main.scss';

export default class Main {

  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onFullscreenButtonClicked] Callback when fullscreen button clicked.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);
    this.callbacks = Util.extend({
      onFullscreenButtonClicked: () => {},
    }, callbacks);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-3d-image-hotspots-main');

    this.createModel();

    if (this.params.behaviour.presentation === 'sidePanel') {
      this.sidePanel = new SidePanel({
        placeholder: this.params.dictionary.get('l10n.clickOnHotspotToSeeDetails'),
      });
      this.dom.append(this.sidePanel.getDOM());
    }
    else {
      this.overlayDialog = new OverlayDialog(
        {
          dictionary: this.params.dictionary,
          globals: this.params.globals,
          cssMainSelector: 'exercise',
        },
        {
          onClosed: () => {
            this.overlayDialog.hide();
          }
        }
      );
      this.dom.append(this.overlayDialog.getDOM());
    }

    this.contentBundles = this.params.hotspots?.hotspots?.map((hotspot) => {
      return new ContentBundle({ contents: hotspot.contents, globals: this.params.globals });
    });
  }

  /**
   * Get DOM element.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Create the 3D model.
   */
  createModel() {
    // Retrieve true local source
    const element = document.createElement('div');
    H5P.setSource(
      element, { path: this.params.model?.file?.path ?? '' }, this.params.globals.get('contentId')
    );

    // Optional poster
    const poster = document.createElement('img');
    if (this.params.visuals?.poster?.path) {
      poster.addEventListener('load', () => {
        this.model.updateAspectRatio(
          poster.naturalWidth / poster.naturalHeight
        );

        this.trigger('resize');
      });
      H5P.setSource(
        poster, { path: this.params.visuals.poster.path }, this.params.globals.get('contentId')
      );
    }

    this.model = new ThreeDModelView({
      dictionary: this.params.dictionary,
      src: element.src,
      poster: poster.src,
      hotspots: this.params.hotspots?.hotspots,
      className: 'h5p-3d-image-hotspots-main',
      alt: Util.purifyHTML(this.params.model.alt),
      size: this.params.size,
      a11y: this.params.a11y,
      hotspotColorDefault: this.params.visuals.hotspotColorDefault
    }, {
      onModelLoaded: (params) => {
        this.handleModelLoaded(params);
      },
      onPlayStateChanged: (isPlaying) => {
        this.handlePlayStateChanged(isPlaying);
      },
      onHotspotClicked: (hotspotIndex) => {
        this.handleHotspotClicked(hotspotIndex);
      }
    });

    this.modelContainer = document.createElement('div');
    this.modelContainer.classList.add('h5p-3d-image-hotspots-model-container');
    this.modelContainer.appendChild(this.model.getDOM());

    this.dom.appendChild(this.modelContainer);

    this.addBackground();
  }

  /**
   * Handle model loaded.
   * @param {object} params Parameters.
   * @param {string[]} [params.availableAnimations] Available animation names.
   */
  handleModelLoaded(params) {
    this.addOverlayButtons(
      {
        isPlayingEnabled: !!params.availableAnimations.length,
        isFullscreenAllowed: this.params.globals.get('isFullscreenAllowed'),
        dictionary: this.params.dictionary,
      },
      {
        onPlayButtonClicked: () => {
          this.model?.togglePlay();
        },
        onFullscreenButtonClicked: () => {
          this.callbacks.onFullscreenButtonClicked();
        }
      }
    );

    if (!!params.availableAnimations) {
      this.model.ensureAllHotspotsVisible();
    }

    this.params.globals.get('resize')();
  }

  /**
   * Add overlay buttons.
   * @param {object} [params] Parameters.
   * @param {boolean} [params.isPlayingEnabled] Whether play button should be shown.
   * @param {boolean} [params.isFullscreenAllowed] Whether fullscreen button should be shown.
   * @param {object} [callbacks] Callbacks.
   */
  addOverlayButtons(params = {}, callbacks = {}) {
    if (!params.isPlayingEnabled && !params.isFullscreenAllowed) {
      return;
    }

    this.overlayButtons = new OverlayButtons(params, callbacks);
    this.modelContainer.prepend(this.overlayButtons.getDOM());
  }

  /**
   * Toggle overlay button class.
   * @param {string} id Button ID.
   * @param {string} className Class name to toggle.
   * @param {boolean} state Whether to toggle class on or off.
   */
  toggleOverlayButtonClass(id, className, state) {
    this.overlayButtons?.toggleButtonClass(id, className, state);
  }

  /**
   * Set overlay button aria label.
   * @param {string} id Button ID.
   * @param {string} ariaLabel Aria label.
   */
  setOverlayButtonAriaLabel(id, ariaLabel) {
    this.overlayButtons?.setButtonAriaLabel(id, ariaLabel);
  }

  /**
   * Handle play state of model changed.
   * @param {boolean} isPlaying Whether the model is playing.
   */
  handlePlayStateChanged(isPlaying) {
    const ariaLabel = this.params.dictionary.get(isPlaying ? 'a11y.buttonPause' : 'a11y.buttonPlay');
    this.setOverlayButtonAriaLabel('play', ariaLabel);

    this.toggleOverlayButtonClass('play', 'playing', isPlaying);
  }

  /**
   * Handle hotspot clicked.
   * @param {number} hotspotIndex Index of the clicked hotspot.
   */
  handleHotspotClicked(hotspotIndex) {
    if (this.params.behaviour.presentation === 'sidePanel') {
      this.sidePanel.setHeader(this.params.hotspots.hotspots[hotspotIndex].label);
      this.sidePanel.setContentDOM(this.contentBundles[hotspotIndex].getDOM());
      this.sidePanel.focus({ fallbackSelector: '.h5p-3d-image-hotspots-content-wrapper' });
    }
    else {
      this.overlayDialog.setTitle(this.params.hotspots.hotspots[hotspotIndex].label);
      this.overlayDialog.setContent(this.contentBundles[hotspotIndex].getDOM());
      this.overlayDialog.show({});
    }

    this.params.globals.get('resize')();
  }

  /**
   * Resize.
   */
  resize() {
    this.sidePanel?.setMaxHeight(this.model.getPreferredHeight());
  }

  /**
   * Add background to model container.
   */
  addBackground() {
    if (this.params.visuals.backgroundImage && this.params.model?.file?.path) {
      const backgroundImage = document.createElement('img');
      if (this.params.visuals.backgroundImage.path) {
        H5P.setSource(
          backgroundImage, { path: this.params.visuals.backgroundImage.path }, this.params.globals.get('contentId')
        );
      }

      this.modelContainer.classList.add('has-background-image');
      this.modelContainer.style.setProperty(
        '--h5p-3d-image-hotspots-background-image', `url(${backgroundImage.src})`
      );
    }
    else if (
      this.params.visuals.backgroundColor && this.params.model?.file?.path
    ) {
      /*
       * Using custom CSS variables to allow easier customization.
       * When running standalone, the default background color of .h5p-content
       * will be overridden to allow true transparency in webpages.
       */
      const h5pContent = this.modelContainer.closest('.h5p-content');

      if (this.modelContainer.classList.contains('h5p-standalone') && h5pContent) {
        h5pContent.style.setProperty(
          '--h5p-3d-image-hotspots-background-color', this.params.visuals.backgroundColor
        );

        h5pContent.style.backgroundColor =
          'var(--h5p-3d-image-hotspots-background-color)';
      }
      else {
        this.modelContainer.style.setProperty(
          '--h5p-3d-image-hotspots-background-color', this.params.visuals.backgroundColor
        );
      }

      this.modelContainer.style.backgroundColor =
        'var(--h5p-3d-image-hotspots-background-color)';
    }
  }

  /**
   * Set model max size.
   * @param {object} size Size.
   * @param {number} [size.maxWidth] Maximum width or undefined to reset.
   * @param {number} [size.maxHeight] Maximum height or undefined to reset.
   */
  setModelMaxSize(size) {
    this.model?.setMaxSize(size);
  }
}
