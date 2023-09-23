'use strict';

import { LuxioDiscovery } from '../index.mjs'
const discovery = new LuxioDiscovery();

discovery.discoverDevices({
	ap: true,
	nupnp: true,
	mdns: false,
})
	.then(devices => {
		Object.values(devices).forEach(async device => {

			try {
				await device.sync();

				console.log('ID:', device.id);
				console.log('-- Name:', device.name);
				console.log('-- Version:', device.version);
				console.log('-- Address:', device.address);
				console.log('-- Pixels:', device.pixels);
				console.log('-- On:', device.on);
				console.log('-- Brightness:', device.brightness);
				console.log('-- Effect:', device.effect);
				console.log('-- Gradient:', device.gradient);
				console.log('-- Mode:', device.mode);
				console.log('');

				device.on = true;
				device.brightness = 1;
				device.gradient = ['#FF0000', '#0000FF'];
				device.effect = 'rainbow';

				await device.sync();
			} catch (err) {
				console.error(device.id, err);
			}

		});
	})
	.catch(console.error);