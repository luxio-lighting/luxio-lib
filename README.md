# Luxio Library

[![Node version](https://img.shields.io/npm/v/@luxio-lighting/lib.svg)](https://www.npmjs.com/package/@luxio-lighting/lib)

This is a JavaScript library to find and control [Luxio](https://luxio.lighting) Wi-Fi LED strips.

This module can be used:

* In the browser
* In a Node.js or React project

## Node.js

### Installation

In your project's folder:

```bash
$ npm install @luxio-lighting/lib
```

Then include it in your project:

```javascript
const { Discovery } = require('luxio');
```

### Usage

```javascript
const { Discovery } = require('luxio');
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

## Browser

### Installation

By using a `<script>` tag:

```html
<script type="text/javascript" src="./dist/web/luxio.min.js"></script>
```

Or use a CDN:

```html
<script type="text/javascript" src="https://unpkg.com/luxio@latest/dist/web/luxio.min.js"></script>
```

Or when you're using a pre-compiler such as webpack:

```javascript
import { Discovery } from 'luxio';
```

### Usage

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

*Note: Luxio commands are sent to a local IP address over HTTP. When visiting an HTTPS website, this is not allowed due to security risks.*

## React Native

### Installation

```bash
$ npm i react-native-event-source
$ npm i @luxio-lighting/lib
```

## Notes

Device discovery by default finds devices using two strategies: 

* Cloud Discovery (`https://nupnp.luxio.lighting`)
* AP Discovery by trying to connect to `http://192.168.4.1` (the Access Point default IP Address)

> To Do: mDNS Discovery