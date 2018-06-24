'use strict';

const fs = require('fs');

// if project has been built, and there is no .git folder (development)
if( fs.existsSync('./dist') && !fs.existsSync('./.git') ) {
	module.exports = require('./dist/js');
} else {
	module.exports = require('./src');
}