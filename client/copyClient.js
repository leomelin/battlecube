const jetpack = require('fs-jetpack');
const path = require('path');

const source = path.resolve(__dirname, '..', 'client/static');
const dest = path.resolve(__dirname, '..', 'build/static/');

jetpack.copy(source, dest, {overwrite: true});
console.log('Copied client:', source, dest);
