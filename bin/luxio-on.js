'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-o, --turnedon', 'Supply to turn on, otherwise to turn off')
	.parse(process.argv)
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.on = cmd.turnedon === true;
		device.sync().then(() => {
			console.log(`Turned device ${device.id} ${device.on ? 'on' : 'off'}`)
		}).catch( err => {
			console.error(`Could not turn device ${device.id} ${device.on ? 'on' : 'off'}`)			
			console.error( err.message || err.toString() )
		})
	})
})