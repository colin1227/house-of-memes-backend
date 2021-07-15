const up = (knex, _) => {
  try {
    const up = knex.raw(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE commentresponse(
      "commentresid" uuid UNIQUE DEFAULT uuid_generate_v4(),
      "memeid" integer
        REFERENCES meme("memeid"),
      "resid" uuid
        REFERENCES memeresponse(memeresid),
      "poster" varchar(25)
        REFERENCES userProfile(username),
      "meme" bytea,
      "response" varchar(500),
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NULL,
      "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
    );
  `);
  console.log('built commentresponse table')
  return up;
  } catch (err) {
    console.log('failed to build commentresponse table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE commentresponse;
    `);
    console.log('successfully tore down commentresponse table');
    return down;
  } catch(err) {
    console.log('failed commentresponse table teardown');
    return err;
  }
};


module.exports = { up, down };
