export default class LuxioDevice {

	__debugEnabled = false;
	__eventListeners = new Map();

	__wsInstance = null;
	__wsPromise = null;
	__wsConnected = false;

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

	__emit(event, data) {
		if (this.__eventListeners.has(event)) {
			this.__eventListeners.get(event).forEach(callback => {
				callback(data);
			});
		}
	}

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

	removeAllListeners(event) {
		this.__eventListeners.delete(event);
	}

	/*
	 * WebSocket
	 */

	__wsOnHeartbeat() {
		if (this.__wsTimeout) clearTimeout(this.__wsTimeout);
		this.__wsTimeout = setTimeout(() => this.__wsOnTimeout(), 1000 * (10 + 2)); // 12s
	}

	__wsOnTimeout() {
		this.debug('WebSocket Timeout');

		if (this.__wsInstance) {
			this.__wsInstance.close();
			this.__wsInstance = null;
			this.__wsPromise = null;

			const reconnect = () => {
				this.connect()
					.then(() => {
						this.debug('Reconnected');
					})
					.catch(err => {
						this.debug(`Error Reconnecting: ${err.message}`);
						setTimeout(() => reconnect(), 1000);
					});
			}

			reconnect();
		}
	}

	async connect() {
		if (!this.__wsPromise) {
			this.__wsPromise = new Promise((resolve, reject) => {
				this.__wsInstance = new WebSocket(`ws://${this.address}/ws`);
				this.__wsInstance.onclose = () => {
					this.debug('WebSocket.onclose');

					this.__wsPromise = null;
					this.__wsConnected = false;

					this.__emit('disconnect');
				}
				this.__wsInstance.onerror = err => {
					this.debug('WebSocket.onerror', err);

					this.__wsPromise = null;
					this.__wsConnected = false;

					reject(err);
				};
				this.__wsInstance.onmessage = message => {
					this.__wsOnHeartbeat();

					try {
						const payload = JSON.parse(message.data);
						if (payload.event) {
							if (payload.event === 'full_state') {
								this.led.state = payload.data.led.state;
								this.__emit('led.state', this.led.state);

								this.led.config = payload.data.led.config;
								this.__emit('led.config', this.led.config);

								this.wifi.state = payload.data.wifi.state;
								this.__emit('wifi.state', this.wifi.state);

								this.wifi.config = payload.data.wifi.config;
								this.__emit('wifi.config', this.wifi.config);

								this.system.state = payload.data.system.state;
								this.__emit('system.state', this.system.state);

								this.system.config = payload.data.system.config;
								this.__emit('system.config', this.system.config);

								this.__emit('connect');
								this.__wsConnected = true;
								resolve();
							} else if (payload.event === 'wifi.state') {
								this.wifi.state = payload.data;
								this.__emit('wifi.state', this.wifi.state);
							} else if (payload.event === 'wifi.config') {
								this.wifi.config = payload.data;
								this.__emit('wifi.config', this.wifi.config);
							} else if (payload.event === 'led.state') {
								this.led.state = payload.data;
								this.__emit('led.state', this.led.state);
							} else if (payload.event === 'led.config') {
								this.led.config = payload.data;
								this.__emit('led.config', this.led.config);
							} else if (payload.event === 'system.state') {
								this.system.state = payload.data;
								this.__emit('system.state', this.system.state);
							} else if (payload.event === 'system.config') {
								this.system.config = payload.data;
								this.__emit('system.config', this.system.config);
							} else {
								this.__emit(payload.event, payload.data);
							}
						} else if (payload.debug) {
							this.debug(`[debug] ${payload.debug}`);
						} else {
							this.debug(`Unknown Message:`, payload);
						}
					} catch (err) {
						this.debug(`Error Parsing Message: ${err.message}`);
					}
				}
			});
		}

		await this.__wsPromise;
	}

	async disconnect() {
		if (this.__wsInstance) {
			this.__wsInstance.close();
		}
	}

	isConnected() {
		return this.__wsConnected;
	}

	/*
	 * API
	 */

	async execute({
		method,
		params,
	}) {
		this.debug('execute', method);

		// TODO: Send over WebSocket if connected

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
		const fullState = await this.execute({
			method: 'get_full_state',
		});

		// Set Cache
		if (this.isConnected()) {
			this.led.state = fullState.led.state;
			this.led.config = fullState.led.config;
			this.wifi.state = fullState.wifi.state;
			this.wifi.config = fullState.wifi.config;
			this.system.state = fullState.system.state;
			this.system.config = fullState.system.config;
		}

		return fullState;
	}

	system = {

		state: null,
		config: null,

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
			const config = await this.execute({
				method: 'system.get_config',
			});

			if (this.isConnected()) {
				this.system.config = config;
			}

			return config;
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
			const state = await this.execute({
				method: 'system.get_state',
			});

			if (this.isConnected()) {
				this.system.state = state;
			}

			return state;
		},

	};

	wifi = {

		state: null,
		config: null,

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
			const config = await this.execute({
				method: 'wifi.get_config',
			});

			if (this.isConnected()) {
				this.wifi.config = config;
			}

			return config;
		},

		// State
		getState: async () => {
			const state = await this.execute({
				method: 'wifi.get_state',
			});

			if (this.isConnected()) {
				this.wifi.state = state;
			}

			return state;
		},

	};

	led = {

		state: null,
		config: null,

		// Config
		getConfig: async () => {
			const config = await this.execute({
				method: 'led.get_config',
			});

			if (this.isConnected()) {
				this.led.config = config;
			}

			return config;
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
			// if (this.__stateCache?.led) {
			// 	return this.__stateCache.led;
			// }

			const state = await this.execute({
				method: 'led.get_state',
			});

			if (this.isConnected()) {
				this.led.state = state;
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