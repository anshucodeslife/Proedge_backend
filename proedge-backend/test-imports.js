// Test all imports
console.log('Loading express...');
const express = require('express');
console.log('Loading cors...');
const cors = require('cors');
console.log('Loading helmet...');
const helmet = require('helmet');
console.log('Loading morgan...');
const morgan = require('morgan');
console.log('Loading swagger-ui-express...');
const swaggerUi = require('swagger-ui-express');

console.log('Loading config/env...');
const config = require('./src/config/env');
console.log('Config loaded:', Object.keys(config));

console.log('Loading config/logger...');
const logger = require('./src/config/logger');

console.log('Loading middlewares/error...');
const errorHandler = require('./src/middlewares/error');

console.log('Loading config/swagger...');
const swaggerSpecs = require('./src/config/swagger');

console.log('All modules loaded successfully!');
