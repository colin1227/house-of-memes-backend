const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE interaction(
        "interactionType" VARCHAR(255),
        "interactionId" INT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    return up;
  } catch(err) {
    console.log('failed to build interaction table');
    return err;
  }
}

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE interaction;
    `);
    console.log('successfully tore down interaction table');
    return down;
  }  catch(err) {
    console.log('failed interaction table teardown');
    return err;
  }
}
module.exports = { up, down };
