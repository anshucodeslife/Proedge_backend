const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});
