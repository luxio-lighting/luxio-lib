import LuxioUtil from './LuxioUtil.mjs';
import LuxioDevice from './LuxioDevice.mjs';
import LuxioDiscoveryStrategy from './LuxioDiscoveryStrategy.mjs';

export default class LuxioDiscoveryStrategyNUPNP extends LuxioDiscoveryStrategy {

  static URL = 'https://nupnp.luxio.lighting';

  async discover({
    timeout = 2000,
  }) {
    const req = fetch(this.constructor.URL);
    const res = await LuxioUtil.timeoutRace(req, timeout);
    if (!res.ok)
      throw new Error(res.statusText || 'Unknown Error');

    const devices = await res.json();
    return Object.values(devices).map(device => ({
      id: device.id,
      address: device.address,
      version: device.version,
      name: device.name,
    }));
  }

};
