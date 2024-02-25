import tinygradient from 'tinygradient';

export default class LuxioUtil {

  static createGradient({ source, pixels }) {
    if (!Array.isArray(source))
      throw new Error('Invalid type for createGradient, expected: Array');

    // add # to color
    const colors = source.map(color => {
      if (color.charAt(0) !== '#') return `#${color}`;
      return color;
    });

    // at least 2 colors
    if (colors.length === 1)
      colors.push(colors[0]);

    return tinygradient(colors)
      .rgb(pixels)
      .map(color => {
        return color
          .toString('hex')
          .substring(1)
          .toUpperCase()
      })
  }

  /*
    Get a color temperature, based on cool (0) or warm (1)
  */
  static getColorTemperature(temperature) {
    if (temperature < 0 || temperature > 1)
      throw new Error('Color Temperature is out of bounds');

    const gradient = tinygradient('#CCFBFD', '#FFFFFF', '#FFDA73').hsv(99);
    const color = gradient[Math.floor(temperature * 98)];
    return color
      .toHexString()
      .substring(1) // remove #
      .toUpperCase();
  }

  static wait(timeout) {
    return new Promise(resolve => {
      setTimeout(() => resolve(), timeout);
    })
  }

  static async timeoutAfter(timeout) {
    await this.wait(timeout);
    throw new Error(`Timeout After ${timeout}ms`);
  }

  static async timeoutRace(promise, timeout) {
    return Promise.race([
      promise,
      this.timeoutAfter(timeout)
    ]);
  }

}