export default class LuxioUtil {

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

  static isPlatformNodeJS() {
    return typeof process === 'object' && process + '' === '[object process]';
  }

  static isPlatformReactNative() {
    return typeof navigator === 'object' && navigator.product === 'ReactNative';
  }

  static async getModuleEventSource() {
    if (this.isPlatformNodeJS()) {
      return (await import('eventsource')).default;
    }

    if (this.isPlatformReactNative()) {
      return (await import('react-native-sse')).default;
    }

    throw new Error('Unsupported Platform');
  }

}