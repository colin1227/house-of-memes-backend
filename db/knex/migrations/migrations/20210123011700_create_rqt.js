const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE randomquestiontime(
        "questionId" SERIAL PRIMARY KEY,
        "prompt" text,
        "meme" bytea,
        "recive" text,
        "answer" text,
        "options" text,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built randomquestiontime table')
    return up;
  } catch (err) {
    console.log('failed to build randomquestiontime table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE randomquestiontime;
    `);
    console.log('successfully tore down randomquestiontime table');
    return down;
  } catch(err) {
    console.log('failed randomquestiontime table teardown');
    return err;
  }
};


module.exports = { up, down };
