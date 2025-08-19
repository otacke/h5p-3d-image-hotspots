import Color from 'color';

/**
 * Determine either black or white contrast color based on the input color.
 * This is essentially what CSS color-contrast() would do, but it is not yet widely supported.
 * @param {string} colorString CSS color string.
 * @returns {string} The contrast color (black or white) in the same format as the input color.
 */
export const getContrastColorBW = (colorString) => {
  const colorFormat = determineColorFormat(colorString);
  const color = Color(colorString);

  const white = Color('#ffffff');
  const black = Color('#000000');

  const contrastToWhite = color.contrast(white);
  const contrastToBlack = color.contrast(black);

  const contrastColor = contrastToWhite > contrastToBlack ? white : black;

  if (colorFormat === 'hex' || colorFormat === 'hexa') {
    return contrastColor.hex();
  }
  else if (colorFormat === 'rgb' || colorFormat === 'rgba') {
    return contrastColor.rgb().string();
  }
  else if (colorFormat === 'hsl' || colorFormat === 'hsla') {
    return contrastColor.hsl().string();
  }

  throw new Error(`Unknown color format: ${colorFormat}`);
};

/**
 * Determine the color format of a given color string.
 * @param {string} colorString CSS color string.
 * @returns {string} The color format ('hex', 'rgb', 'hsl').
 */
export const determineColorFormat = (colorString) => {
  if (typeof colorString !== 'string') {
    throw new Error(`Unknown color format: ${colorString}`);
  }

  if (isHex(colorString)) {
    return 'hex';
  }
  else if (isRgb(colorString)) {
    return 'rgb';
  }
  else if (isHsl(colorString)) {
    return 'hsl';
  }

  throw new Error(`Unknown color format: ${colorString}`);
};

/**
 * Determine if the color string is in hex format.
 * @param {string} colorString CSS color string.
 * @returns {boolean} True if the color string is in hex format, false otherwise.
 */
export const isHex = (colorString) => {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(colorString);
};

/**
 * Determine if the color string is in rgb or rgba format.
 * @param {string} colorString CSS color string.
 * @returns {boolean} True if the color string is in rgb or rgba format, false otherwise.
 */
export const isRgb = (colorString) => {
  return /^rgba?\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(colorString);
};

/**
 * Determine if the color string is in hsl or hsla format.
 * @param {string} colorString CSS color string.
 * @returns {boolean} True if the color string is in hsl or hsla format, false otherwise.
 */
export const isHsl = (colorString) => {
  return /^hsla?\(\s*(\d{1,3}\s*,\s*){2}(0|1|0?\.\d+)(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(colorString);
};
