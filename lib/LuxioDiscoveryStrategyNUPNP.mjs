import LuxioUtil from './LuxioUtil.mjs';
import LuxioDevice from './LuxioDevice.mjs';
import {
  NUPNP_URL,
} from '../index.mjs';

export default class LuxioDiscoveryStrategyNUPNP {

  async discover({
    timeout = 2000,
  }) {
    const req = fetch(NUPNP_URL);
    const res = await LuxioUtil.timeoutRace(req, timeout);
    if (!res.ok)
      throw new Error(res.statusText || 'Unknown Error');

    const devices = await res.json();

    return Object.values(devices)
      .map(device => {
        return new LuxioDevice({
          id: device.id,
          address: device.address,
          version: device.version,
          name: device.name,
        });
      });
  }

};
