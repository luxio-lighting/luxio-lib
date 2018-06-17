'use strict';

const { nupnpAddress, apAddress, minimumVersion } = require('../config');
const { fetch } = require('../util');

const Device = require('./Device.js');

class Discovery {
	
	async getDevices({ ap = true, nupnp = true, timeout } = {}) {
		const fns = [];
		if( ap ) fns.push( this.getAPDevices({ timeout }) );
		if( nupnp ) fns.push( this.getNupnpDevices() );
		
		const deviceIds = [];
		return Promise.all(fns).then(results => {
			return [].concat(...results).filter(device => {
				if( deviceIds.includes(device.id) ) return false;
				deviceIds.push(device.id);
				return true;
			});
		})
	}
	
	async getAPDevices({ timeout = 2500 } = {}) {
		try {
			const res = await Promise.race([
				fetch(`http://${apAddress}/state`, { timeout }),
				new Promise((resolve, reject) => {
					setTimeout(() => {
						reject(new Error('Timeout'));
					}, timeout);
				}),
			]);
			if( !res.ok ) throw new Error('unknown_error');
			const json = await res.json();
			if( json.version < minimumVersion ) return [];
			const device = new Device(json.id, {
				...json,
				type: 'luxio',
				address: apAddress,
				lastseen: Date.now() / 1000,
			});
			return [ device ];
		} catch( err ) {
			return [];
		}
	}
	
	async getNupnpDevices({} = {}) {
		const res = await fetch(nupnpAddress);
		const devices = await res.json();
		return Object.keys(devices).filter(deviceId => {
			const device = devices[deviceId];
			if( device.version < minimumVersion ) return false;
			return true;			
		}).map(deviceId => {
			const device = devices[deviceId];
			return new Device(deviceId, device);
		})
	}
	
}

module.exports = Discovery;