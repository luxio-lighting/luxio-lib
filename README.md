# Luxio Library

[![npm](https://img.shields.io/npm/v/@luxio-lighting/lib.svg)](https://www.npmjs.com/package/@luxio-lighting/lib)

This is a JavaScript library and API client to discover and control [Luxio](https://luxio.lighting) Wi-Fi LED strips on a LAN network.

## Installation

### Node.js

```bash
$ npm i mdns-js ws
$ npm i @luxio-lighting/lib
```

Then include it in your project:

```javascript
import { LuxioDiscovery } from '@luxio-lighting/lib';
import WebSocket from 'ws';

global.WebSocket = WebSocket;
```

### React Native

```bash
$ npm i @luxio-lighting/lib
```

Then include it in your project:

```javascript
import { LuxioDiscovery } from '@luxio-lighting/lib';
```

## Examples

```javascript
import { LuxioDiscovery } from '@luxio-lighting/lib';

const discovery = new LuxioDiscovery();
const devices = await discovery.discoverDevices({
  ap: false, // Hotspot
  mdns: true, // Bonjour
  nupnp: true, // Cloud
});

for(const device of Object.values(devices)) {
  const fullState = await device.getFullState();
  console.log(fullState);

  // Turn on
  await device.led.setOn(true);

  // Set the brightness to 100%
  await device.led.setBrightness(255);

  // Set the color to Pink
  await device.led.setColor({ r: 255, g: 0, b: 255, w: 0 });

  // Set the colors to a gradient from green to blue.
  // Luxio will interpolate the colors itself on-device.
  await device.led.setGradient([
    { r: 0, g: 255, b: 0, w: 0},
    { r: 0, g: 0, b: 255, w: 0},
  ]);

  // Register to Server-Sent Events
  device.addEventListener('led.state', ledState => console.log('LED State:', ledState));
  device.addEventListener('led.config', ledConfig => console.log('LED Config:', ledConfig));
  device.addEventListener('wifi.state', wifiState => console.log('Wi-Fi State:', wifiState));
  device.addEventListener('wifi.config', wifiConfig => console.log('Wi-FI Config:', wifiConfig));
  device.addEventListener('system.state', systemState => console.log('System State:', systemState));
  device.addEventListener('system.config', systemConfig => console.log('System Config:', systemConfig));
  device.addEventListener('disconnect', () => console.log('Disconnected'));

  // Connect to Server-Send Events
  await device.connect();
}
```

> See https://github.com/luxio-lighting/luxio-cli for more example code.