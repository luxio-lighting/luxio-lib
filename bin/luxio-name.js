'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-n, --newname <name>', 'Rename the device')
	.parse(process.argv)
	
if( typeof cmd.device === 'undefined' )
	return console.error('Option `-d, --device` is required!')
	
if( typeof cmd.newname === 'undefined' )
	return console.error('Option `-n, --newname` is required!')
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.name = cmd.newname;
		device.sync().then(() => {
			console.log(`Set device ${device.id} name to ${device.name}`)
		}).catch( err => {
			console.error(`Could not set device ${device.id} name to ${device.name}`)			
			console.error( err.message || err.toString() )
		})
	})
})