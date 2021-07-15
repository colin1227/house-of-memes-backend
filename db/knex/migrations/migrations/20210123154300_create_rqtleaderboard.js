const up = (knex, _) => {
try {  
    const up = knex.raw(`
      CREATE TABLE leaderboard(
        "playerId" INT,
        "points" INT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NULL,
        "deactivatedAt" TIMESTAMPTZ DEFAULT NULL
      );
    `);
    console.log('built leaderboard table');
    return up;
} catch (err) {
    console.log('failed to build leaderboard table');
    return err;
  }
}


const down = (knex, _) => {
  try {
    const down = knex.raw(`
      DROP TABLE leaderboard;
    `);
    console.log('successfully tore down leaderboard table');
    return down;
  } catch(err) {
    console.log('failed leaderboard table teardown');
    return err;
  }
}


module.exports = { up, down };
