import LuxioUtil from './LuxioUtil.mjs';
import EventSource from 'eventsource'

export default class LuxioDevice {

	__eventListeners = new Map();

	constructor({
		id,
		address,
		version,
		name,
		led_state,
		led_config,
		system_state,
		system_config,
		wifi_state,
		wifi_config,
	}) {
		Object.defineProperty(this, 'id', {
			value: id,
			enumerable: true,
			writable: false,
		});

		Object.defineProperty(this, 'address', {
			value: address,
			enumerable: true,
			writable: true,
		});

		Object.defineProperty(this, 'version', {
			value: version,
			enumerable: true,
			writable: true,
		});

		Object.defineProperty(this, 'name', {
			value: name,
			enumerable: true,
			writable: true,
		});

		// TODO
	}

	debug(...props) {
		console.log(`[LuxioDevice::${this.id}]`, ...props);
	}

	setAddress(address) {
		this.address = address;
	}

	async execute({
		method,
		params,
	}) {
		this.debug('execute', `http://${this.address}/`, method, params);
		const res = await fetch(`http://${this.address}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				method,
				params,
			}),
		})

		if (res.status !== 200) {
			throw new Error(res.statusText || res.status);
		}

		const resBody = await res.json();
		if (resBody.error) {
			throw new Error(resBody.error);
		}

		if (resBody.result !== undefined) {
			return resBody.result;
		}

		throw new Error('Unknown Error');
	}

	addEventListener(event, callback) {
		if (!this.__eventListeners.has(event)) {
			this.__eventListeners.set(event, new Set());
		}
		this.__eventListeners.get(event).push(callback);
	}

	removeEventListener(event, callback) {
		if (this.__eventListeners.has(event)) {
			this.__eventListeners.get(event).delete(callback);
		}
	}

	async connect() {
		if (!this.events) {
			this.events = new Promise((resolve, reject) => {
				this.__events = new EventSource(`http://${this.address}/events`);
				this.__events.onmessage = (event) => {
					try {
						const message = JSON.parse(event.data);
						if (message.debug) {
							this.debug('[event:debug]', message.debug);
						} else if (message.event) {
							this.debug(`[event:${message.event}]`, message.data);

							// Fire Event Listeners
							if (this.__eventListeners.has(message.event)) {
								this.__eventListeners.get(message.event).forEach(callback => {
									callback(message.data);
								});
							}
						} else {
							this.debug('Event Unknown', message);
						}

						// console.log('data', data);
					} catch (err) {
						this.debug(`Event Parse Error: ${err.message}`);
					}
				};

				this.__events.onerror = (event) => {
					this.debug('EventSource.onError', event);
					reject();
				};

				this.__events.onopen = () => {
					this.debug('Connected');
					resolve();
				}

				this.__events.onclose = () => {
					this.debug('Disconnected');
					reject();
				}
			});
		}

		await this.events;
	}

	async disconnect() {
		if (this.__events) {
			this.__events.close();
			this.__events = null;
			this.events = null;
		}
	}

	led = {

		// State
		getState: async () => {
			return this.execute({
				method: 'led.get_state',
			});
		},

		setOn: async ({
			on = true,
		}) => {
			return this.execute({
				method: 'led.set_on',
				params: {
					on,
				},
			});
		},

		setBrightness: async ({
			brightness,
		}) => {
			return this.execute({
				method: 'led.set_brightness',
				params: {
					brightness,
				},
			});
		},

		setColor: async ({
			r,
			g,
			b,
			w,
		}) => {
			return this.execute({
				method: 'led.set_color',
				params: {
					r,
					g,
					b,
					w,
				},
			});
		},

		setGradient: async ({
			colors,
		}) => {
			return this.execute({
				method: 'led.set_gradient',
				params: {
					colors,
				},
			});
		},

		set_animation: async ({
			animation,
		}) => {
			return this.execute({
				method: 'led.set_animation',
				params: {
					animation,
				},
			});
		},

		// Config
		getConfig: async () => {
			return this.execute({
				method: 'led.get_config',
			});
		},

		setType: async ({
			type,
		}) => {
			return this.execute({
				method: 'led.set_type',
				params: {
					type,
				},
			});
		},

		setPin: async ({
			pin,
		}) => {
			return this.execute({
				method: 'led.set_pin',
				params: {
					pin,
				},
			});
		},

		setCount: async ({
			count,
		}) => {
			return this.execute({
				method: 'led.set_count',
				params: {
					count,
				},
			});
		},
	};

}