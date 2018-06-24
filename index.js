'use strict';

const fs = require('fs');

if( fs.existsSync('./.git') ) {
	module.exports = require('./src');
} else {
	module.exports = require('./dist/js');
}