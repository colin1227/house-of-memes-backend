
const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE email(
        "emailId" SERIAL PRIMARY KEY,
        "address" varchar(255) NOT NULL UNIQUE,
        "verified" BOOLEAN DEFAULT FALSE,
        "provider" varchar(255),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built emails table')
    return up;
  } catch (err) {
    console.log('failed to build emails table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
    DROP TABLE email;
  `);
  console.log('successfully tore down emails table');
  return down;
  } catch(err) {
    console.log('failed emails table teardown');
    return err;
  }
};

module.exports = { up, down };
