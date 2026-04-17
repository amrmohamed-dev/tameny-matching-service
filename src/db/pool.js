import { Pool } from 'pg';
import dbConfig from '../config/db.config.js';

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(1);
});

export default pool;
