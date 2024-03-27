import EventSource from 'eventsource';
import {
  LuxioDiscovery,
} from '../index.mjs';

const discovery = new LuxioDiscovery({
  EventSource,
});
discovery.setDebugEnabled(true);

const devices = await discovery.discoverDevices();
if (Object.keys(devices).length === 0) {
  console.log('No devices found');
  process.exit(1);
}

const device = process.env.LUXIO_DEVICE
  ? Object.values(devices).find(device => device.id === process.env.LUXIO_DEVICE || device.name === process.env.LUXIO_DEVICE) // By name or ID
  : Object.values(devices)[0]; // First

if (!device) {
  console.log(`Device ${process.env.LUXIO_DEVICE} not found`);
  process.exit(1);
}

function logState() {
  console.log('LED State:', device.led.state);
  console.log('LED Config:', device.led.config);
}

console.log(`Connecting to ${device.name}...`);

await device.connect();
console.log('Connected');
logState();

device.addEventListener('led.state', (data) => {
  console.log('LED State Event:', data);
});

device.addEventListener('led.config', (data) => {
  console.log('LED Config Event:', data);
});

device.addEventListener('connect', () => {
  console.log('Reconnected');
  logState();
});

device.addEventListener('disconnect', () => {
  console.log('Disconnected');
});

await device.getFullState();
logState();

setInterval(() => {
  logState();
}, 5000);

// setTimeout(async () => {
//   console.log('Disconnecting...')
//   await device.disconnect();
// }, 5000);