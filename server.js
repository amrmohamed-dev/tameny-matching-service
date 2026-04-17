import './src/config/dotenv.js';
import app from './app.js';
import processHandler from './src/utils/error/processHandler.js';

const port = process.env.PORT || 3000;

app.listen(port, () => console.log('Matching service is running'));

processHandler();
