import './src/config/dotenv.js';
import { createServer } from 'http';
import app from './app.js';
import processHandler from './src/utils/error/processHandler.js';
import initDB from './src/db/initDB.js';
import { initSocket } from './src/sockets/socket.js';
import PostgresListener from './src/events/postgresListener.js';

const port = process.env.PORT || 3000;
const server = createServer(app);

const startServer = async () => {
  try {
    await initDB();
    initSocket(server);

    PostgresListener();

    server.listen(port, () =>
      console.log(`Matching service is running on port => ${port}`),
    );
  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
};

startServer();

processHandler(server);
