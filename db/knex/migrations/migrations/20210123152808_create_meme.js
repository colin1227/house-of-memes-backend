const up = (knex, _) => {
  try {
    const up = knex.raw(`
      CREATE TABLE meme(
        "memeid" SERIAL PRIMARY KEY,
        "meme" bytea,
        "name" varchar(100),
        "size" int,
        "description" varchar(500),
        "poster" varchar(25),
        "format" varchar(25),
          -- REFERENCES userProfile(username),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
  	console.log('built meme table')
 	  return up;
  } catch (err) {
    console.log('failed to build meme table');
    return err;
  }
}


const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE meme;
    `);
    console.log('successfully tore down meme table');
    return down;
  } catch(err) {
    console.log('failed meme table teardown');
	  return err;
  }
};


module.exports = { up, down };
