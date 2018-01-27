# Luxio

[![Node version](https://img.shields.io/npm/v/luxio.svg)](https://www.npmjs.com/package/luxio) [![Build Status](https://travis-ci.org/WeeJeWel/node-luxio.svg?branch=master)](https://travis-ci.org/WeeJeWel/node-luxio)

This is a JavaScript library to find and control [Luxio](http://www.luxio.lighting) Wi-Fi LED Strips. It supports use as a Node.js dependency, in the browser, and in the command line.

## Installation

### Node.js

In your project folder:

```
$ npm install luxio
```

### Browser

Using a script tag:

```html
<script type="text/javascript" src="./dist/luxio.min.js"></script>
```

### Command line
```
$ npm install -g luxio
```

## Usage

### Command Line

```bash
$ luxio --help

  Usage: luxio [options] [command]


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    discover    Discover all Luxio devices on your network
    on          Turn a Luxio device on or off
    brightness  Set the brightness of a Luxio device
    gradient    Set a gradient on a Luxio device
    effect      Set an effect on a Luxio device
    name        Set the name of a Luxio device
    pixels      Set the pixel count of a Luxio device
    restart     Restart a Luxio device
    help [cmd]  display help for [cmd]
```

### Node.js

```javascript
const Discovery = require('luxio').Discovery;
const discovery = new Discovery();

discovery.getDevices()
	.then( devices => {
		devices.forEach( async device => {
			
			await device.sync();
			
			// print the state
			console.log('ID:', device.id);
			console.log('-- Name:', device.name);
			console.log('-- Version:', device.version);
			console.log('-- Pixels:', device.pixels);
			console.log('-- On:', device.on);
			console.log('-- Brightness:', device.brightness);
			console.log('-- Effect:', device.effect);
			console.log('-- Gradient:', device.gradient);
			console.log('-- Mode:', device.mode);
			console.log('');
			
			// set on, brightness and a gradient
			device.on = true;
			device.brightness = 1;
			device.gradient = [ '#FF0000', '#0000FF' ];
			//device.effect = 'rainbow';
			
			await device.sync();
			
		});
	})
	.catch( console.error );
```

### Browser

```html
<script type="text/javascript">
var Discovery = Luxio.Discovery;
var discovery = new Discovery();
	
discovery.getDevices()
	.then( devices => {
		devices.forEach( device => {
			
			device.sync().then(() => {
			
				// print the state
				console.log('ID:', device.id);
				console.log('-- Name:', device.name);
				console.log('-- Version:', device.version);
				console.log('-- Pixels:', device.pixels);
				console.log('-- On:', device.on);
				console.log('-- Brightness:', device.brightness);
				console.log('-- Effect:', device.effect);
				console.log('-- Gradient:', device.gradient);
				console.log('-- Mode:', device.mode);
				console.log('');
				
				// set on, brightness and a gradient
				device.on = true;
				device.brightness = 1;
				device.gradient = [ '#FF0000', '#0000FF' ];
				//device.effect = 'rainbow';
				
				device.sync()
					.then( console.log )
					.catch( console.error )
			
			})
			.catch( console.error )
			
		});
	})
	.catch( console.error )
</script>
```

## Documentation
Available at [https://weejewel.github.io/node-luxio/](https://weejewel.github.io/node-luxio/)