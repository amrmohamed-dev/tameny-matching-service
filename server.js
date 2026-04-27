import './src/config/dotenv.js';
import app from './app.js';
import processHandler from './src/utils/error/processHandler.js';
import initDB from './src/db/initDB.js';
import PostgresListener from './src/events/postgresListener.js';

const port = process.env.PORT || 3000;

initDB();

PostgresListener();

app.listen(port, () => console.log('Matching service is running'));

processHandler();
