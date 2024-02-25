import LuxioUtil from './LuxioUtil.mjs';
import LuxioDevice from './LuxioDevice.mjs';
import {
  AP_ADDRESS,
  AP_URL,
} from '../index.mjs';

export default class LuxioDiscoveryStrategyAP {

  async discover({
    timeout = 2000,
  }) {
    const req = await fetch(`${AP_URL}`, {
      timeout,
    });
    const res = await LuxioUtil.timeoutRace(req, timeout);
    if (!res.ok)
      throw new Error('unknown_error');

    const fullState = await res.json();
    const device = new LuxioDevice({
      id: fullState.id,
      address: AP_ADDRESS,
      version: fullState.version,
      name: fullState.name,
    });
    return [device];
  }

};
