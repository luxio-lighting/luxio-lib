'use strict';

const tinygradient = require('tinygradient');

function createGradient({ source, pixels }) {
	if( !Array.isArray(source) )
		throw new Error('Invalid type for createGradient, expected: Array');
	
	// add # to color
	const colors = source.map( color => {
		if( color.charAt(0) !== '#' ) return `#${color}`;
		return color;
	});
	
	// at least 2 colors
	if( colors.length === 1 )
		colors.push( colors[0] );
	
	return tinygradient(colors)
		.rgb(pixels)
		.map(color => {
			return color
				.toString('hex')
				.substring(1)
				.toUpperCase()
		})
}

module.exports = {
	createGradient,
}

if( typeof window !== 'undefined' ) {
	module.exports.fetch = require('./fetch.js');
} else {
	module.exports.fetch = require('node-fetch');
}