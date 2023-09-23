import LuxioDevice from './LuxioDevice.mjs';
import LuxioUtil from './LuxioUtil.mjs';

// const { timeoutRace } = require('../util');

export default class LuxioDiscovery {

	_devices = {};

	getDevices() {
		return this._devices;
	}

	async discoverDevices({
		ap = true,
		nupnp = true,
		mdns = true,
		timeout = 2000,
	} = {}) {
		const results = await Promise.all([
			nupnp === true
				? this._getNupnpDevices({ timeout })
				: [],

			mdns === true
				? this._getMDNSDevices({ timeout })
				: [],

			ap === true
				? this._getAPDevices({ timeout })
				: [],
		]);

		results.flat().forEach(result => {
			this._onDevice(result);
		});

		return this.getDevices();
	}

	_onDevice(device) {
		const { id, address } = device;
		if (this._devices[id]) {
			this._devices[id].address = address;
		} else {
			this._devices[id] = device;
		}
	}

	async _getAPDevices({ timeout = 2000 } = {}) {
		try {
			const req = fetch(`${LuxioUtil.AP_ADDRESS}/state`, { timeout });
			const res = await LuxioUtil.timeoutRace(req, timeout);
			if (!res.ok)
				throw new Error('unknown_error');

			const json = await res.json();
			const device = new LuxioDevice(json.id, {
				...json,
				type: 'luxio',
				address: LuxioUtil.AP_IP,
				lastseen: new Date(),
			});
			return [device];
		} catch (err) {
			console.error(`Error Getting AP: ${err.message}`);
			return [];
		}
	}

	async _getNupnpDevices({ timeout = 2000 } = {}) {
		try {
			const req = fetch(LuxioUtil.NUPNP_ADDRESS);
			const res = await LuxioUtil.timeoutRace(req, timeout);
			if (!res.ok)
				throw new Error('unknown_error');

			const devices = await res.json();

			return Object.entries(devices)
				.map(([deviceId, device]) => {
					return new LuxioDevice(deviceId, {
						...device,
						lastseen: new Date(device.lastseen),
					});
				})
		} catch (err) {
			console.error(`Error Getting Nupnp: ${err.message}`);
			return [];
		}
	}

	async _getMDNSDevices({ timeout = 2000 }) {
		// TODO
		return [];
	}

}