const {
  NODE_ENV,
  DB_HOST: host,
  DB_PORT: port,
  DB_NAME: database,
  DB_USER: user,
  DB_PASS: password,
} = process.env;

const dbConfig = {
  host,
  port,
  database,
  user,
  password,
  ssl:
    NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

export default dbConfig;
