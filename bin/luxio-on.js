'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.parse(process.argv)
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.on = true;
		device.sync().then(() => {
			console.log(`Turned device ${device.id} on`)
		}).catch( err => {
			console.error(`Could not turn device ${device.id} on`)			
			console.error( err.message || err.toString() )
		})
	})
})