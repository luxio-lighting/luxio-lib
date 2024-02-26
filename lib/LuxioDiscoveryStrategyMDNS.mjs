import mdns from 'mdns-js';
import LuxioDevice from './LuxioDevice.mjs';
import LuxioDiscoveryStrategy from './LuxioDiscoveryStrategy.mjs';

export default class LuxioDiscoveryStrategyMDNS extends LuxioDiscoveryStrategy {

  async discover({
    timeout = 2000,
  }) {
    const devices = {};

    await new Promise((resolve, reject) => {
      const browser = mdns.createBrowser('_luxio._tcp');
      try {
        browser.once('ready', () => {
          browser.discover();
        });
        browser.on('update', data => {
          if (!data.type.find(type => type.name === 'luxio')) return;
          if (!Array.isArray(data.addresses) || data.addresses.length === 0) return;
          if (!Array.isArray(data.txt) || data.txt.length === 0) return;

          const address = data.addresses[0];
          const {
            id,
            name,
            version,
          } = LuxioDiscoveryStrategyMDNS.parseTXT(data.txt);

          if (!id) return;
          if (!name) return;
          if (!version) return;

          devices[id] = new LuxioDevice({
            id,
            address,
            version: parseInt(version),
            name,
          });
        });

        setTimeout(() => {
          browser.stop();
          resolve();
        }, timeout);
      } catch (err) {
        browser.stop();
        reject(err);
      }
    });

    return Object.values(devices);
  }

  static parseTXT(txt) {
    const result = {};
    txt.forEach(str => {
      const [key, value] = str.split('=');
      result[key] = value;
    });
    return result;
  }

};
