# Luxio

[![Node version](https://img.shields.io/npm/v/luxio.svg)](https://www.npmjs.com/package/luxio) [![Build Status](https://travis-ci.org/luxio-lighting/luxio.js.svg?branch=master)](https://travis-ci.org/luxio-lighting/luxio.js)

This is a JavaScript library to find and control [Luxio](https://luxio.lighting) Wi-Fi LED Strips. This module can be used in the browser or as a React or Node.js dependency.

## Installation

### Node.js

In your project's folder:

```bash
$ npm install luxio
```

Then include it in your project:

```javascript
const { Discovery } = require('luxio');
```

### Browser

By using a `<script>` tag:

```html
<script type="text/javascript" src="./dist/web/luxio.min.js"></script>
```

Or use a CDN:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/luxio@latest/dist/web/luxio.min.js"></script>
```

Or when you're using a pre-compiler such as webpack:

```javascript
import { Discovery } from 'luxio';
```

### Command line
```bash
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

## Notes

* Discovery by default finds devices bothutilizing `https://nupnp.luxio.lighting` and by trying to connect to `http://192.168.4.1` (the Access Point default IP Address).

## Documentation
Available at [https://luxio-lighting.github.io/luxio.js/](https://luxio-lighting.github.io/luxio.js/)
