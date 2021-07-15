const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE log(
      "logId" SERIAL PRIMARY KEY,
      "content" varchar(255),
      "associatedUser" varchar(255),
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NULL,
      "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built log Table');
    return up;
  } catch(err) {
    console.log('failed to build log table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
    DROP TABLE log;
  `);
  console.log('successfully tore down log table');
  return down;
  } catch(err) {
    console.log('failed log table teardown');
    return err;
  }
};


module.exports = { up, down };
