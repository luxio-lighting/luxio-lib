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

				await device.setOn({ on: true });
				await device.setBrightness({ brightness: 255 });
				await device.setGradient({ gradient: ['#00FF00', '#0000FF'] });
			} catch (err) {
				console.error(device.id, err);
			}

		});
	})
	.catch(console.error);