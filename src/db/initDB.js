import pool from './pool.js';

const initDB = () => {
  pool
    .query('SELECT 1')
    .then(() => console.log('DB connected successfully'))
    .catch((err) => {
      console.error('DB connection failed', err);
      process.exit(1);
    });
};

export default initDB;
