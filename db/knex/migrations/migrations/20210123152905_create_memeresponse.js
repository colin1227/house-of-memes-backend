const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE memeresponse(
        "memeresid" uuid DEFAULT uuid_generate_v4() UNIQUE,
        "memeid" INT
          REFERENCES meme(memeid),
        "response" text,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built memeresponse table');
    return up;
  } catch (err) {
    console.log('failed to build memeresponse table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE memeresponse;
    `);
    console.log('successfully tore down memeresponse table');
    return down;
  } catch(err) {
    console.log('failed memeresponse table teardown');
    return err;
  }
};


module.exports = { up, down };
