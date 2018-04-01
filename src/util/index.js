'use strict';

if( typeof window !== 'undefined' && typeof window.fetch === 'function' ) {
	module.exports.fetch = window.fetch;
} else if( typeof global !== 'undefined' && typeof global.fetch === 'function' ) {
	module.exports.fetch = global.fetch;
} else if( typeof fetch === 'function' ) {
	module.exports.fetch = fetch;
} else {
	module.exports.fetch = require('node-fetch');
}