let knex = require('knex')({
  client: 'pg',
  path: 'db/knex/migrations/migrations',
  connection: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  user:     process.env.DB_ADMIN_USER,
  password: process.env.DB_ADMIN_PASS,
  searchPath: ['knex', 'public'],
  pool: { min: 0, max: 7 },
  migrations: {
    tableName: 'knex_migrations'
  },
});

module.exports = knex;