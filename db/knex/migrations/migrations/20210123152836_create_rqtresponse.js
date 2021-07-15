const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE rqtresponse(
        "rqtresid" uuid DEFAULT uuid_generate_v4() UNIQUE,
        "originId" integer
          references randomquestiontime("questionId"),
        "response" text,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL,
        "userId" varchar(25)
      );
    `);
    console.log('built rqtresponse table');
    return up;
  } catch (err) {
    console.log('failed to build rqtresponse table');
    return err;
  }
};

const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE rqtresponse;
    `);
    console.log('successfully tore down rqtresponse table');
    return down;
  } catch(err) {
    console.log('failed rqtresponse table teardown');
    return err;
  }
};


module.exports = { up, down };
