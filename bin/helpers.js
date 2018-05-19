'use strict';

const cmd = require('commander')
const Discovery = require('..').Discovery

cmd.option('-d, --device <id>', 'ID or Name of the device, or omit to address all devices on the network')

module.exports.getDevices = () => {
	const discovery = new Discovery();
	return discovery.getDevices().then( devices => {
		if( typeof cmd.device === 'undefined' ) return devices;
		return devices.filter( device => {
			if( device.id === cmd.device ) return true;
			if( device.name === cmd.device ) return true;
			return false;
		})
	}).then(devices => {
		return Promise.all(devices.map(device => {
			return device.sync();
		}))
	})
}