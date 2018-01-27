'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-p, --pixels <count>', 'Set the pixel count on the device')
	.parse(process.argv)
	
if( typeof cmd.device === 'undefined' )
	return console.error('Option `-d, --device` is required!')
	
if( typeof cmd.pixels === 'undefined' )
	return console.error('Option `-p, --pixels` is required!')
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.pixels = parseInt(cmd.pixels);
		device.sync().then(() => {
			console.log(`Set device ${device.id} pixel count to ${device.pixels}`)
		}).catch( err => {
			console.error(`Could not set device ${device.id} pixel count to ${device.pixels}`)			
			console.error( err.message || err.toString() )
		})
	})
})