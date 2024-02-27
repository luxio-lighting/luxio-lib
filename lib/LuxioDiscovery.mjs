import LuxioDiscoveryStrategyAP from './LuxioDiscoveryStrategyAP.mjs';
import LuxioDiscoveryStrategyMDNS from './LuxioDiscoveryStrategyMDNS.mjs';
import LuxioDiscoveryStrategyNUPNP from './LuxioDiscoveryStrategyNUPNP.mjs';

export default class LuxioDiscovery {

	__debugEnabled = false;
	_devices = {};
	_discoveringPromise = null;

	constructor({
		strategyAP = new LuxioDiscoveryStrategyAP(),
		strategyMDNS = new LuxioDiscoveryStrategyMDNS(),
		strategyNUPNP = new LuxioDiscoveryStrategyNUPNP(),
	} = {}) {
		this._strategyAP = strategyAP;
		this._strategyMDNS = strategyMDNS;
		this._strategyNUPNP = strategyNUPNP;
	}

	setDebugEnabled(isEnabled) {
		this.__debugEnabled = !!isEnabled;
	}

	debug(...props) {
		if (!this.__debugEnabled) return;
		console.log('[LuxioDiscovery]', ...props);
	}

	getDevices() {
		return this._devices;
	}

	async discoverDevice({
		id,
		ap = true,
		nupnp = true,
		mdns = true,
		timeout = 2000,
	}) {
		// TODO: Discover device and resolve immediately once found
		throw new Error('Not Implemented');
	}

	async discoverDevices({
		ap = true,
		nupnp = true,
		mdns = true,
		timeout = 2000,
	} = {}) {
		if (!this._discoveringPromise) {
			this._discoveringPromise = Promise.resolve().then(async () => {
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
					if (this._devices[device.id]) {
						this._devices[device.id].setAddress(device.address);
					} else {
						this._devices[device.id] = device;
						this._devices[device.id].setDebugEnabled(this.__debugEnabled);
					}
				});

				return this.getDevices();
			});
		}

		return this._discoveringPromise;
	}

	async _discoverAPDevices({ timeout = 2000 } = {}) {
		return this._strategyAP.discover({ timeout })
			.then(devices => {
				this.debug(`Discovered ${devices.length} AP Devices`);
				return devices;
			})
			.catch(err => {
				this.debug(`Error Discovering AP: ${err.message}`);
				return [];
			});
	}

	async _discoverNUPNPDevices({ timeout = 2000 } = {}) {
		return this._strategyNUPNP.discover({ timeout })
			.then(devices => {
				this.debug(`Discovered ${devices.length} NUPNP Devices`);
				return devices;
			})
			.catch(err => {
				this.debug(`Error Discovering NUPNP: ${err.message}`);
				return [];
			});
	}

	async _discoverMDNSDevices({ timeout = 2000 }) {
		return this._strategyMDNS.discover({ timeout })
			.then(devices => {
				this.debug(`Discovered ${devices.length} MDNS Devices`);
				return devices;
			})
			.catch(err => {
				this.debug(`Error Discovering MDNS: ${err.message}`);
				return [];
			});
	}

}