const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE userProfile(
        "userId" SERIAL PRIMARY KEY,
        "username" varchar(25) NOT NULL UNIQUE,
        "password" text,
        "email" character varying(255)
        REFERENCES email(address),
        "subEndDate" TIMESTAMPTZ DEFAULT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built userProfile table');
    return up;
  } catch(err) {
    console.log('failed to build userProfile table');
    return err;
  }
}

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE userProfile;
    `)
    console.log('successfully tore down userProfile table')
    return down;
  } catch(err) {
    console.log('failed userProfile table teardown');
    return err;
  }
}

module.exports = { up, down };
