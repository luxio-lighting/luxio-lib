#!/usr/bin/env node

const pkg = require('../package.json');
const cmd = require('commander');

cmd
	.version( pkg.version )
	.command('discover', 'Discover all Luxio devices on your network')
	.command('on', 'Turn a Luxio device on or off')
	.command('brightness', 'Set the brightness of a Luxio device')
	.command('gradient', 'Set a gradient on a Luxio device')
	.command('effect', 'Set an effect on a Luxio device')
	.command('name', 'Set the name of a Luxio device')
	.command('pixels', 'Set the pixel count of a Luxio device')
	.command('restart', 'Restart a Luxio device')
	.parse(process.argv)