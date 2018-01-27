'use strict';

const cmd = require('commander')
const Discovery = require('..').Discovery;

cmd.parse(process.argv)
	
const discovery = new Discovery();
discovery.getDevices().then( devices => {
	return devices.forEach( device => { 
		console.log('');
		console.log('ID:', device.id);
		console.log('-- Name:', device.name);
		console.log('-- Version:', device.version);
		console.log('-- Address:', device.address);
		console.log('-- Pixels:', device.pixels);
		console.log('-- Last seen:', device.lastseen);
		console.log('');
	})
})