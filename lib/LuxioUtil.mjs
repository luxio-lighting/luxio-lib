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

}