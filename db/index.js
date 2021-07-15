const pg = require('pg');

pg.defaults.ssl = {
  rejectUnauthorized: false,
};

const { Pool } = pg;

const poolFigs = process.env.NODE_ENV === 'DEVELOPMENT' && false ?
  {
    ssl: false,
    connectionString: 'postgresql://localhost:5432/PM',
    database: "PM",
    host: "localhost",
    port: 5432
  }
:
  {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_USER,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.PORT
  };

const pool = new Pool(poolFigs);

module.exports = { pool };
