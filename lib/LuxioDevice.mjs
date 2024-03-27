import LuxioUtil from './LuxioUtil.mjs'

export default class LuxioDevice {

	EventSource = null;

	__debugEnabled = false;
	__eventSourcePromise = null;
	__eventSource = null;
	__eventSourceIsConnected = false;
	__eventSourceTimeout = null;
	__eventListeners = new Map();

	constructor({
		EventSource = null,
		id,
		address,
		version,
		name,
	}) {
		this.EventSource = EventSource;

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

	__eventSourceOnTimeout = () => {
		this.debug('EventSource Timeout');

		this.__eventSourceUninit();
		this.__eventSourceInit();
	}

	__eventSourceOnHeartbeat = () => {
		if (this.__eventSourceTimeout) clearTimeout(this.__eventSourceTimeout);
		this.__eventSourceTimeout = setTimeout(this.__eventSourceOnTimeout, 1000 * (10 + 2)); // 12s
	}

	__eventSourceOnFullState = ({ data }) => {
		try {
			const fullState = JSON.parse(data);

			// Reset References
			this.__eventSourceIsConnected = true;

			// Set State
			this.led.state = fullState.led.state;
			this.led.config = fullState.led.config;
			this.wifi.state = fullState.wifi.state;
			this.wifi.config = fullState.wifi.config;
			this.system.state = fullState.system.state;
			this.system.config = fullState.system.config;

			// Emit Event
			this.__emit('connect');

			// Resolve the connect() Promise
			if (this.__eventSourcePromiseResolve) {
				this.__eventSourcePromiseResolve();
			}
		} catch (err) {
			this.debug('EventSource Full State Parse Error', err);

			// Reject the connect() Promise
			if (this.__eventSourcePromiseReject) {
				this.__eventSourcePromiseReject(err);
			}
		}
	}

	__eventSourceOnMessage = ({ data }) => {
		this.__eventSourceOnHeartbeat();

		try {
			const message = JSON.parse(data);
			if (message.debug) {
				this.debug('[event:debug]', message.debug);
			} else if (message.event) {
				this.debug(`[event:${message.event}]`);

				if (message.event === 'wifi.state') this.wifi.state = message.data;
				if (message.event === 'wifi.config') this.wifi.config = message.data;
				if (message.event === 'led.state') this.led.state = message.data;
				if (message.event === 'led.config') this.led.config = message.data;
				if (message.event === 'system.state') this.system.state = message.data;
				if (message.event === 'system.config') this.system.config = message.data;

				// Fire Event Listeners
				this.__emit(message.event, message.data);
			} else {
				this.debug('Unknown Message:', message);
			}
		} catch (err) {
			this.debug(`EventSource Parse Error: ${err.message}`);
		}
	}

	__eventSourceOnError = (event) => {
		this.debug('EventSource Error', event);
		console.trace(event);

		if (this.__eventSourcePromiseReject) {
			this.__eventSourcePromiseReject(new Error(event.message));
		}

		this.__eventSourceUninit();
		this.__eventSourceInit();
	}

	__eventSourceOnOpen = () => {
		this.debug('EventSource Connected');

		this.__eventSourceIsConnected = true;
	}

	__eventSourceInit() {
		this.__eventSource = new this.EventSource(`http://${this.address}/events`);
		this.__eventSource.addEventListener('full_state', this.__eventSourceOnFullState);
		this.__eventSource.addEventListener('message', this.__eventSourceOnMessage);
		this.__eventSource.addEventListener('error', this.__eventSourceOnError);
		this.__eventSource.addEventListener('open', this.__eventSourceOnOpen);
	}

	__eventSourceUninit = () => {
		if (this.__eventSourceIsConnected === true) {
			this.__emit('disconnect');
		}

		if (this.__eventSourceTimeout) {
			clearTimeout(this.__eventSourceTimeout);
		}

		this.__eventSourceIsConnected = false;

		if (this.__eventSource) {
			this.__eventSource.close();
			this.__eventSource = null;
		}

		// Reset Cache
		this.led.state = null;
		this.led.config = null;
		this.wifi.state = null;
		this.wifi.config = null;
		this.system.state = null;
		this.system.config = null;

	}

	async connect() {
		if (!this.__eventSourcePromise) {
			this.__eventSourcePromise = new Promise((resolve, reject) => {
				this.__eventSourcePromiseResolve = resolve;
				this.__eventSourcePromiseReject = reject;
			});

			this.__eventSourceInit();
		}

		await this.__eventSourcePromise;
	}

	async disconnect() {
		if (this.__eventSource) {
			this.__eventSource.close();
			this.__eventSource = null;
		}

		this.__eventSourceUninit();

		// Emit Event
		this.__emit('disconnect');
	}

	isConnected() {
		return this.__eventSourceIsConnected === true;
	}

	/*
	 * API
	 */

	async execute({
		method,
		params,
	}) {
		this.debug('execute', method);
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
			// if (this.isConnected() && this.system.state) {
			// 	return this.system.state;
			// }

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
			// if (this.isConnected() && this.wifi.state) {
			// 	return this.wifi.state;
			// }

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