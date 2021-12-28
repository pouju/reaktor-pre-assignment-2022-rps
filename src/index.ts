import config from './utils/config';
import http from 'http';
import app from './app';

const server = http.createServer(app);

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
