const { pool } = require('./index');
// TODO: creation queries should be renamed to creation scripts


// |I.) User based queries|

const usernamesQuery = () => {
  return pool.query(`
    SELECT username
    FROM users;
  `);
}

const loginDataQuery = (username) => {
  return pool.query(`
    SELECT password, user_id
    FROM users
    WHERE username = $1;
    `, [username]);
}

const usernameCountQuery = (username) => {
  return pool.query(`
    SELECT COUNT(*)
    FROM users
    WHERE username = $1;
  `, [username]);
}

const createUserQuery = (sqlParams) => {
  return pool.query(`
      INSERT INTO users(username, password)
      VALUES( $1, $2);
    `, sqlParams);
}

const queryMemesByUser = (username) => {
  return pool.query(`
    SELECT aws_name
    FROM memes
    WHERE poster = $1;
  `, [username]);
}


// |II.) Search based queries|

// untested
const popularHashTagsQuery = () => {
  return pool.query(`
    SELECT mode() WITHIN GROUP(ORDER BY DESC)
    FROM meme_hashtag_ties
    JOIN hashtags
    ON hashtags.hashtag_id = meme_hashtag_ties.hashtag_id
    GROUP BY hashtags.groupid;
    `);
}

const tagQuery = () => {
  return pool.query(`
    SELECT DISTINCT hashtag_id
    FROM hashtags;
  `);
}

// untested
// see publicGroupNameQueryByTerm query
const hashTagsTermQuery = (term) => {
  return pool.query(`
  SELECT DISTINCT hashtag_id
  FROM meme_hashtag_ties
  LIMIT 10
  WHERE hashtag_id LIKE %$1%;
  `, [term]);
}

// |III.) Hashtags based queries|

const publicGroupNameQueryByTerm = (term) => {
  return pool.query(`
    SELECT hashtag_id
    FROM hashtags
    and hashtag_id LIKE '%${term}%'
    LIMIT 10;`);
}

const createMemeTagEntry = (tag, memeTagId) => {
  return pool.query(`
    INSERT INTO meme_hashtag_ties(
      hashtag_id,
      meme_tag_id
    )
    VALUES(
      $1,
      $2
    )
  `, [tag, memeTagId]);
}

const tagCheckQuery = (tag) => {
  return pool.query(`
    SELECT hashtag_id
    FROM hashtags
    WHERE hashtag_id = $1;
  `,[tag])
}

const createTagEntry = (tagName) => {
  return pool.query(`
    INSERT INTO hashtags(hashtag_id)
    VALUES($1)
  `,[tagName]);
}

// |IV.) Meme based queries|


const createHashtagScript = (groupName) => {
  return pool.query(`
    INSERT INTO hashtags(
      hashtag_id
    )
    VALUES(
      $1
    )
  `, [groupName]);
}

const previewQuery = (id) => {
  return pool.query(`
  SELECT previewsize, preview_format
  FROM weblinks
  WHERE web_link_id = $1;
  `,[id]);
}

const memeQuery = (groupName) => {
  return pool.query(
    `
      SELECT size, format
      FROM memes
      WHERE "name_group" = $1;
    `,
    [groupName]
  );
}

// maybe add to memesFloorRandomQuery as sub query
const memeCountQuery = () => {
  return pool.query(`
  SELECT count(*)
  FROM memes;
  `);
}

const memesFloorRandomQuery = (memeCount, limit) => {
  return pool.query(`
    SELECT aws_name, "name_group", format, description
    FROM memes
    ORDER BY FLOOR(random() * ${memeCount})
    LIMIT ${limit};`);
}

const queryLinksByGroup = (groupName) => {
  return pool.query(`
    SELECT weblinks.web_link, meme_hashtag_ties.order, weblinks.previewsize, weblinks.web_link_id, weblinks.description
    FROM weblinks
    JOIN meme_hashtag_ties
    ON weblinks.web_link_id = meme_hashtag_ties.meme_tag_id
    WHERE meme_hashtag_ties.hashtag_id = $1
    ORDER BY meme_hashtag_ties.order;
  `,
  [groupName.replace('_', ' ')]);
}

const queryMemesByGroup = (groupName) => {
  return pool.query(`
    SELECT memes.aws_name, meme_hashtag_ties.order, memes.format, memes.description
    FROM memes
    JOIN meme_hashtag_ties
    ON memes.meme_tag_id = meme_hashtag_ties.meme_tag_id
    WHERE meme_hashtag_ties.hashtag_id = $1
    ORDER BY meme_hashtag_ties.order;
  `,
  [groupName]);
}

// unused but will implement later
const queryMemesFloorRandomCountQueryWithNoRepeatList = (viewedList, memeCount, limit) => {
  return pool.query(`
    SELECT aws_name, "name_group", format, description
    FROM memes
    WHERE aws_name NOT IN(${viewedList.map(o => `'${o}'`)})
    ORDER BY FLOOR(random() * ${memeCount})
    LIMIT ${limit};`);
}

/* 
  TODO: knex has some way of undoing queries if something fails,
  pg certainly has a similar method, implement it when possible
  to avoid useless rows.(Rollbacks)
*/
const createMemeEnteryQuery = (params) => {
  return pool.query(`
  INSERT INTO memes(
    aws_name,
    "name_group",
    format,
    size,
    poster,
    description
  ) VALUES(
    $1,
    $2,
    $3,
    $4,
    $5,
    $6
  )
  RETURNING meme_tag_id;
`, params);
}

const createWebLinkEnteryQuery = (web_link, username, fileSize, fileType, description) => {
  return pool.query(`
    INSERT INTO weblinks(
      web_link,
      poster,
      preview_size,
      preview_format,
      description
    )
    VALUES(
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING web_link_id;
  `, [web_link, username, fileSize, fileType, description]);
}

// wrong because web_link_id is an integer and should be a uuid.
const createMemeTagAssociation = (tag, web_link_id) => {
  return pool.query(`
  INSERT INTO meme_hashtag_ties(
    hashtag_id,
    meme_tag_id
  )
  VALUES(
    $1,
    $2
  )
`, [tag, web_link_id]);
}

// unused
const getGroupCountQuery = () => {
  return pool.query(`
    SELECT COUNT(*)
    FROM meme_hashtag_ties
    WHERE hashtag_id = $1;
  `, [allTags[i]]);
}

module.exports = {

  // Users
  usernamesQuery,
  loginDataQuery,
  usernameCountQuery,
  createUserQuery,
  queryMemesByUser,
  createMemeTagEntry,

  // Hashtags
  tagQuery,
  queryLinksByGroup,
  queryMemesByGroup,
  publicGroupNameQueryByTerm,
  tagCheckQuery,
  createTagEntry,

  // Memes
  createHashtagScript,
  createMemeEnteryQuery,
  createWebLinkEnteryQuery,
  createMemeTagAssociation,
  previewQuery,
  memeQuery,
  memeCountQuery,
  memesFloorRandomQuery
 };
