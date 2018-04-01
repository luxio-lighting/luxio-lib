'use strict';

const cmd = require('commander')
const Table = require('cli-table');
const helpers = require('./helpers.js')

cmd
	.parse(process.argv)
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.sync().then(() => {
			console.log(`Device ${device.name}:`)
			
			let table = new Table({
				head: [
					'On',
					'Brightness',
					'Mode',
					'Gradient',
					'Effect',
				]
			});
			
			table.push([
				device.on ? 'Yes' : 'No',
				`${Math.round(device.brightness * 100)}%`,
				device.mode,
				device.gradient.join(','),
				device.effect ? device.effect : 'Not active',
			])
			
			console.log(table.toString());
			
		}).catch( err => {
			console.error(`Could not get device state`);
			console.error( err.message || err.toString() )
		})
	})
})