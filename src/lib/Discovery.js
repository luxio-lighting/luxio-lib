'use strict';

const { nupnpAddress, apAddress } = require('../config');
const fetch = require('cross-fetch');

const Device = require('./Device.js');

class Discovery {
	
	async getDevices({ ap = true, nupnp = true } = {}) {
		const fns = [];
		if( ap ) fns.push( this.getAPDevices() );
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
	
	async getAPDevices({ timeout = 1 } = {}) {
		try {
			const res = await Promise.race([
				fetch(`http://${apAddress}/state`, { timeout }),
				new Promise((resolve, reject) => {
					setTimeout(reject, timeout);
				}),
			]);
			if( !res.ok ) throw new Error('unknown_error');
			const json = await res.json();
			const device = new Device(json.id, {
				...json,
				type: 'luxio',
				address: '192.168.4.1',
				lastseen: Date.now() / 1000,
				connectivity: 'ap',
			});
			return [ device ];
		} catch( err ) {
			return [];
		}
	}
	
	async getNupnpDevices() {
		const res = await fetch(nupnpAddress);
		const devices = await res.json();
		return Object.keys(devices).filter(deviceId => {
			const device = devices[deviceId];
			if( device.version < 20 ) return false;
			return true;			
		}).map(deviceId => {
			const device = devices[deviceId];
			return new Device(deviceId, {
				...device,
				connectivity: 'lan',
			});
		})
	}
	
}

module.exports = Discovery;