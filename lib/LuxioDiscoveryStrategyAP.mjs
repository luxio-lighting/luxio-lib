import LuxioUtil from './LuxioUtil.mjs';
import LuxioDevice from './LuxioDevice.mjs';
import LuxioDiscoveryStrategy from './LuxioDiscoveryStrategy.mjs';

export default class LuxioDiscoveryStrategyAP extends LuxioDiscoveryStrategy {

  static ADDRESS = '192.168.4.1';
  static URL = `http://${this.ADDRESS}`;

  async discover({
    timeout = 2000,
  }) {
    try {
      const res = await LuxioUtil.timeoutRace(fetch(`${this.constructor.URL}`, {
        timeout,
      }), timeout);

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const fullState = await res.json();
      return [{
        id: fullState.system.state.id,
        address: this.constructor.ADDRESS,
        version: fullState.system.state.version,
        name: fullState.system.config.name,
      }];
    } catch (err) {
      if (err?.cause?.code === 'ECONNREFUSED') {
        return [];
      }

      throw err;
    }
  }

};
