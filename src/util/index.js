'use strict';

module.exports.fetch = async function() {
	if( typeof window !== 'undefined' && typeof window.fetch === 'function' ) {
		return window.fetch;
	} else if( typeof global !== 'undefined' && typeof global.fetch === 'function' ) {
		return global.fetch;
	} else if( typeof fetch === 'function' ) {
		return fetch;
	} else if( typeof global !== 'undefined' && typeof global.require === 'function' ) {
		return global.require('node-fetch');
	} else {
		throw new Error('Unsupported environment');
	}
}