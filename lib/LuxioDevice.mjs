import LuxioUtil from './LuxioUtil.mjs'

export default class LuxioDevice {

	__debugEnabled = false;
	__stateCache = null;
	__eventSource = null;
	__eventListeners = new Map();

	constructor({
		id,
		address,
		version,
		name,
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

	setDebugEnabled(isEnabled) {
		this.__debugEnabled = !!isEnabled;
	}

	debug(...props) {
		if (!this.__debugEnabled) return;
		console.log(`[LuxioDevice::${this.id}]`, ...props);
	}

	setAddress(address) {
		this.address = address;
	}

	/*
	 * Server-Sent Events
	 */

	addEventListener(event, callback) {
		if (!this.__eventListeners.has(event)) {
			this.__eventListeners.set(event, new Set());
		}
		this.__eventListeners.get(event).add(callback);
	}

	removeEventListener(event, callback) {
		if (this.__eventListeners.has(event)) {
			this.__eventListeners.get(event).delete(callback);
		}
	}

	async connect() {
		if (!this.events) {
			const EventSource = await LuxioUtil.getModuleEventSource();

			this.events = new Promise((resolve, reject) => {
				this.__eventSource = new EventSource(`http://${this.address}/events`);
				this.__eventSource.addEventListener('message', event => {
					try {
						const message = JSON.parse(event.data);
						if (message.debug) {
							this.debug('[event:debug]', message.debug);
						} else if (message.event) {
							this.debug(`[event:${message.event}]`);

							if (event === 'wifi.state') {
								this.__stateCache.wifi = message.data;
							}

							if (event === 'led.state') {
								this.__stateCache.led = message.data;
							}

							if (event === 'system.state') {
								this.__stateCache.system = message.data;
							}

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
				});

				this.__eventSource.addEventListener('error', event => {
					this.debug('EventSource.onError', event);
					reject(new Error(event.message));
				});

				this.__eventSource.addEventListener('open', () => {
					this.debug('Connected');
					resolve();
				});

				this.__eventSource.addEventListener('close', () => {
					this.debug('Disconnected');

					this.__eventSource = null;
					this.__stateCache = null;

					reject(new Error('Disconnected'));

				});
			});
		}

		await this.events;
	}

	async disconnect() {
		if (this.__eventSource) {
			this.__eventSource.close();
			this.__eventSource = null;
			this.__stateCache = null;
			this.events = null;
		}
	}

	/*
	 * API
	 */

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

	async getFullState() {
		if (this.__stateCache) {
			return this.__stateCache;
		}

		const fullState = await this.execute({
			method: 'get_full_state',
		});

		if (this.__eventSource) { // Is Open
			this.__stateCache = fullState;
		}

		return fullState;
	}

	system = {

		ping: async () => {
			return this.execute({
				method: 'system.ping',
			});
		},

		restart: async () => {
			return this.execute({
				method: 'system.restart',
			});
		},

		factoryReset: async () => {
			return this.execute({
				method: 'system.factory_reset',
			});
		},

		enableDebug: async () => {
			return this.execute({
				method: 'system.enable_debug',
			});
		},

		disableDebug: async () => {
			return this.execute({
				method: 'system.disable_debug',
			});
		},

		// Config
		getConfig: async () => {
			return this.execute({
				method: 'system.get_config',
			});
		},

		setName: async ({
			name,
		}) => {
			return this.execute({
				method: 'system.set_name',
				params: {
					name,
				},
			});
		},

		// State
		getState: async () => {
			if (this.__stateCache?.system) {
				return this.__stateCache.system;
			}

			const state = await this.execute({
				method: 'system.get_state',
			});

			if (this.__stateCache) {
				this.__stateCache.system = state;
			}

			return state;
		},

	};

	wifi = {

		scanNetworks: async () => {
			return this.execute({
				method: 'wifi.scan_networks',
			});
		},

		getNetworks: async () => {
			return this.execute({
				method: 'wifi.get_networks',
			});
		},

		connect: async ({
			ssid,
			pass,
		}) => {
			return this.execute({
				method: 'wifi.connect',
				params: {
					ssid,
					pass,
				},
			});
		},

		disconnect: async () => {
			return this.execute({
				method: 'wifi.disconnect',
			});
		},

		// Config
		getConfig: async () => {
			return this.execute({
				method: 'wifi.get_config',
			});
		},

		// State
		getState: async () => {
			if (this.__stateCache?.wifi) {
				return this.__stateCache.wifi;
			}

			const state = await this.execute({
				method: 'wifi.get_state',
			});

			if (this.__stateCache) {
				this.__stateCache.wifi = state;
			}

			return state;
		},

	};

	led = {

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

		// State
		getState: async () => {
			if (this.__stateCache?.led) {
				return this.__stateCache.led;
			}

			const state = await this.execute({
				method: 'led.get_state',
			});

			if (this.__stateCache) {
				this.__stateCache.led = state;
			}

			return state;
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

		setAnimation: async ({
			id,
		}) => {
			return this.execute({
				method: 'led.set_animation',
				params: {
					id,
				},
			});
		},

	};

}