'use strict';

const config = require('../config');
const fetch = require('node-fetch');
const Device = require('./Device.js');

class Discovery {
	
	getDevices() {
		return fetch( config.nupnp.host )
			.then( result => result.json() )
			.then( result => {
				const devices = [];
				for( let id in result ) {
					const device = new Device( id, result[id] );
					if( device.version < 20 ) continue;
					devices.push(device);
				}
				return devices;
			})
	}
	
}

module.exports = Discovery;