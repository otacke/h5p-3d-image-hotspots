import semantics from '@root/semantics.json';

/** Class for h5p related utility functions */
export default class H5PUtil {
  /**
   * Get default values from semantics fields.
   * @param {object[]} start Start semantics field.
   * @returns {object} Default values from semantics.
   */
  static getSemanticsDefaults(start = semantics) {
    let defaults = {};

    if (!Array.isArray(start)) {
      return defaults; // Must be array, root or list
    }

    start.forEach((entry) => {
      if (typeof entry.name !== 'string') {
        return;
      }

      if (entry.default !== undefined) {
        defaults[entry.name] = entry.default;
      }
      if (entry.type === 'list') {
        defaults[entry.name] = []; // Does not set defaults within list items!
      }
      else if (entry.type === 'group' && entry.fields) {
        const groupDefaults = H5PUtil.getSemanticsDefaults(entry.fields);
        if (Object.keys(groupDefaults).length) {
          defaults[entry.name] = groupDefaults;
        }
      }
    });

    return defaults;
  }

  /**
   * Process size parameter.
   * @param {object} size Size object.
   * @param {string} dimension Dimension to process ('maxWidth' or 'maxHeight').
   */
  static processSizeParameter(size, dimension) {
    if (typeof size[dimension] === 'string') {
      size[dimension] = size[dimension].trim().replace(/\s/g, '');

      if (size[dimension]?.length && Number.isFinite(+size[dimension])) {
        size[dimension] = `${size[dimension]}px`;
      }
    }
  }

  /**
   * Process parameters (to check/sanitize/etc.).
   * @param {object} params Parameters.
   * @returns {object} Processed parameters.
   */
  static processParameters(params = {}) {
    if (params.size) {
      this.processSizeParameter(params.size, 'maxWidth');
      this.processSizeParameter(params.size, 'maxHeight');
    }

    return params;
  }

  /**
   * Check if the H5P integration has a theme
   * @returns {boolean} True if the H5P integration has a theme, false otherwise.
   */
  static hasTheme() {
    return !!getComputedStyle(document.documentElement).getPropertyValue('--h5p-theme-main-cta-base');
  }
}
