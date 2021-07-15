const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE nonuser(
        "noUserId" SERIAL PRIMARY KEY,
        "defaultName" varchar(255),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built nonuser table')
    return up;
  } catch (err) {
    console.log('failed to build nonuser table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE nonuser;
    `);
    console.log('successfully tore down nonuser table');
    return down;
  } catch(err) {
    console.log('failed nonuser table teardown');
    return err;
  }
};


module.exports = { up, down };
