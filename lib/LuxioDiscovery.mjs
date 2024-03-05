import LuxioDevice from './LuxioDevice.mjs';
import LuxioDiscoveryStrategyAP from './LuxioDiscoveryStrategyAP.mjs';
import LuxioDiscoveryStrategyMDNS from './LuxioDiscoveryStrategyMDNS.mjs';
import LuxioDiscoveryStrategyNUPNP from './LuxioDiscoveryStrategyNUPNP.mjs';

export default class LuxioDiscovery {

	__debugEnabled = false;
	__devices = {};
	__discoveringPromise = null;

	constructor({
		strategyAP = new LuxioDiscoveryStrategyAP(),
		strategyMDNS = new LuxioDiscoveryStrategyMDNS(),
		strategyNUPNP = new LuxioDiscoveryStrategyNUPNP(),
	} = {}) {
		this.__strategyAP = strategyAP;
		this.__strategyMDNS = strategyMDNS;
		this.__strategyNUPNP = strategyNUPNP;
	}

	setDebugEnabled(isEnabled) {
		this.__debugEnabled = !!isEnabled;
	}

	debug(...props) {
		if (!this.__debugEnabled) return;
		console.log('[LuxioDiscovery]', ...props);
	}

	getDevices() {
		return this.__devices;
	}

	async discoverDevice({
		id,
		ap = !!this.__strategyAP,
		mdns = !!this.__strategyMDNS,
		nupnp = !!this.__strategyNUPNP,
		timeout = 2000,
	}) {
		// TODO: Discover device and resolve immediately once found
		throw new Error('Not Implemented');
	}

	async discoverDevices({
		ap = !!this.__strategyAP,
		mdns = !!this.__strategyMDNS,
		nupnp = !!this.__strategyNUPNP,
		timeout = 2000,
	} = {}) {
		if (!this.__discoveringPromise) {
			this.__discoveringPromise = Promise.resolve().then(async () => {
				const results = await Promise.all([
					ap === true
						? this._discoverAPDevices({ timeout })
						: [],

					nupnp === true
						? this._discoverNUPNPDevices({ timeout })
						: [],

					mdns === true
						? this._discoverMDNSDevices({ timeout })
						: [],
				]);

				results.flat().forEach(device => {
					if (this.__devices[device.id]) {
						this.__devices[device.id].setAddress(device.address);
					} else {
						this.__devices[device.id] = new LuxioDevice({ ...device });
						this.__devices[device.id].setDebugEnabled(this.__debugEnabled);
					}
				});

				return this.getDevices();
			});
		}

		return this.__discoveringPromise;
	}

	async _discoverAPDevices({ timeout = 2000 } = {}) {
		return this.__strategyAP.discover({ timeout })
			.then(devices => {
				this.debug(`[AP] Discovered ${devices.length} Devices`);
				return devices;
			})
			.catch(err => {
				this.debug(`[AP] Error Discovering: ${err.message}`);
				return [];
			});
	}

	async _discoverNUPNPDevices({ timeout = 2000 } = {}) {
		return this.__strategyNUPNP.discover({ timeout })
			.then(devices => {
				this.debug(`[NUPNP] Discovered ${devices.length} Devices`);
				return devices;
			})
			.catch(err => {
				this.debug(`[NUPNP] Error Discovering: ${err.message}`);
				return [];
			});
	}

	async _discoverMDNSDevices({ timeout = 2000 }) {
		return this.__strategyMDNS.discover({ timeout })
			.then(devices => {
				this.debug(`[MDNS] Discovered ${devices.length} Devices`);
				return devices;
			})
			.catch(err => {
				this.debug(`[MDNS] Error Discovering: ${err.message}`);
				return [];
			});
	}

}