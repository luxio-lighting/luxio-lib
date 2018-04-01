'use strict';

const tinygradient = require('tinygradient');

const { fetch } = require('../util');

class Device {
	
	constructor( id, opts ) {
		
		Object.defineProperty(this, 'id', {
			value: id,
			enumerable: true,
		});
				
		this._opts = {};
		this._state = {};
		this._putQueue = {};
		
		for( let key in opts ) {
			Object.defineProperty(this._opts, key, {
				value: opts[key],
				enumerable: true,
				writable: false,
			});			
		}		
		
	}
	
	_fetch( path, opts ) {
		opts = {
			method: 'GET',
			body: undefined,
			compress: false,
			headers: {
				'User-Agent': 'Luxio.js'
			},
			...opts,
		};
		
		return fetch( `http://${this._opts.address}/${path}`, opts )
			.then( res => {
				if( !res.ok ) throw new Error(res.statusText || res.status);
				return res;
			})
			.then( res => {
				if( res.status === 200 ) return res.json();
				return;
			})
	}
	
	_getState() {
		return this._fetch('state', {
			method: 'GET'
		})
			.then(result => {
				this._state = result;
			})
	}
	
	get version() {
		return parseInt(this._opts.version);
	}
	
	get lastseen() {
		return new Date(this._opts.lastseen * 1000);
	}
	
	get address() {
		return this._opts.address;
	}
	
	get name() {
		return this._state.name || this._opts.name;
	}
	
	set name( value ) {
		if( typeof value !== 'string' )
			throw new Error('Invalid type for name, expected: String');
		
		this._putQueue['name'] = { value };
		this._state.name = value;
	}
	
	get mode() {
		if( this._state.mode === 'undefined' )
			throw new Error('Device not synced');
			
		return this._state.mode;
	}
	
	get pixels() {
		return this._state.pixels || this._opts.pixels;
	}
	
	set pixels( value ) {
		if( typeof value !== 'number' )
			throw new Error('Invalid type for pixels, expected: Number');
		
		this._putQueue['pixels'] = { value };
		this._state.pixels = value;
	}
	
	get on() {
		if( typeof this._state.on === 'undefined' )
			throw new Error('Device not synced');
			
		return this._state.on === 'true';
	}
	
	set on( value ) {
		if( typeof value !== 'boolean' )
			throw new Error('Invalid type for on, expected: Boolean');
		
		this._putQueue['on'] = { value };
		this._state.on = value;
	}
	
	get brightness() {
		if( typeof this._state.brightness === 'undefined' )
			throw new Error('Device not synced');
			
		return this._state.brightness;
	}
	
	set brightness( value ) {
		if( typeof value !== 'number' )
			throw new Error('Invalid type for brightness, expected: Number');
		
		this._putQueue['brightness'] = { value };
		this._state.brightness = value;
	}
	
	get effect() {
		if( this._state.effect === 'undefined' )
			throw new Error('Device not synced');
			
		return this._state.effect;
	}
	
	set effect( value ) {
		if( typeof value !== 'string' )
			throw new Error('Invalid type for brightness, expected: String');
		
		this._putQueue['effect'] = { value };
		this._state.effect = value;
	}
	
	get gradient() {
		if( this._state.gradient_source === 'undefined' )
			throw new Error('Device not synced');

		return this._state.gradient_source.map( color => `#${color}` );
	}
	
	set gradient( value ) {
		if( !Array.isArray(value) )
			throw new Error('Invalid type for gradient, expected: Array');
			
		let gradientSource = value.map( color => {
			if( color.charAt(0) === '#' ) return color.substring(1);
			return color;
		});			
		let gradientPixels = this._createGradient( gradientSource );
			
		this._putQueue['gradient'] = {
			source: gradientSource,
			pixels: gradientPixels,
		}
		this._state.gradient_source = gradientSource;
		this._state.gradient_pixels = gradientPixels;
	}
	
	_createGradient( inputArray ) {
		if( !Array.isArray(inputArray) )
			throw new Error('Invalid type for createGradient, expected: Array');
		
		// add # to color
		inputArray = inputArray.map( color => {
			if( color.charAt(0) !== '#' ) return `#${color}`;
			return color;
		});
		
		// at least 2 colors
		if( inputArray.length === 1 )
			inputArray.push( inputArray[0] );
		
		return tinygradient(inputArray)
			.rgb(this.pixels)
			.map( color => {
				return color
					.toString('hex')
					.substring(1)
					.toUpperCase()
			})
			
	}
	
	restart() {
		return this._fetch('restart', { method: 'PUT' });
	}
	
	async sync() {
		return Promise.all(Object.keys(this._putQueue).map(key => {
			let value = this._putQueue[key];
			let req = this._fetch(key, {
				method: 'PUT',
				body: JSON.stringify(value)
			})
			delete this._putQueue[key];	
			return req;		
		}))
			.then(() => this._getState())
			.then(() => this)
	}
	
}

module.exports = Device;