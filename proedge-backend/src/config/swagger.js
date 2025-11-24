const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Proedge Backend API',
      version: '1.0.0',
      description: 'API documentation for Proedge LMS Backend',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [`${__dirname}/../routes/*.js`], // Path to the API docs
};

const specs = swaggerJsdoc(options);
module.exports = specs;
