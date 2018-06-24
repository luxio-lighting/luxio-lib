'use strict';

const { nupnpAddress, apAddress, minimumVersion } = require('../config');
const { fetch, timeoutRace } = require('../util');

const Device = require('./Device.js');

class Discovery {
	
	constructor() {
		this._devices = {};
	}
	
	async getDevices({ ap = true, nupnp = true, timeout } = {}) {
		const fns = [];
		if( ap ) fns.push( this._getAPDevices({ timeout }) );
		if( nupnp ) fns.push( this._getNupnpDevices() );
		
		const deviceIds = [];
		return Promise.all(fns).then(results => {
			return [].concat(...results).filter(device => {
				if( deviceIds.includes(device.id) ) return false;
				deviceIds.push(device.id);
				return true;
			}).map(device => {
				this._onDevice(device);
				return device;
			}).map(device => {
				return this._devices[device.id];
			});
		})
	}
	
	_onDevice( device ) {
		const { id, address } = device;
		if( this._devices[id] ) {
			this._devices[id].address = address;
		} else {
			this._devices[id] = device;
		}
	}
	
	async _getAPDevices({ timeout = 2500 } = {}) {
		try {
			const req = fetch(`http://${apAddress}/state`, { timeout });
			const res = await timeoutRace(req, timeout);
			if( !res.ok )
				throw new Error('unknown_error');
			
			const json = await res.json();
			if( json.version < minimumVersion )
				return [];
				
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
	
	async _getNupnpDevices({} = {}) {
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