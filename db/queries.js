const { pool } = require('./index');
// TODO: creation queries should be renamed to creation scripts


// |I.) User based queries|

const usernamesQuery = () => {
  return pool.query(`
    SELECT username
    FROM userprofile;
  `);
}

const loginDataQuery = (username) => {
  return pool.query(`
    SELECT password, userid
    FROM userprofile
    WHERE username = $1;
    `, [username]);
}

const getGroupsByUserId = (userId) => {
  return pool.query(
    `
      SELECT groups.groupname
      FROM groups
      JOIN "userGroups"
      ON "userGroups".groupid = groups.groupid
      WHERE "userGroups".userid = $1;
    `,
    [userId]);
}

const usernameCountQuery = (username) => {
  return pool.query(`
    SELECT COUNT(*)
    FROM userprofile
    WHERE username = $1;
  `, [username]);
}

const createUserQuery = (sqlParams) => {
  return pool.query(`
      INSERT INTO userprofile(username, password)
      VALUES( $1, $2);
    `, sqlParams);
}

const queryMemesByUser = (username) => {
  return pool.query(`
    SELECT name
    FROM meme
    WHERE poster = $1;
  `, [username]);
}


// |II.) Search based queries|


// unused
const groupsResults = (userId) => {
  return pool.query(
    `
      SELECT groupname
      FROM groups
      JOIN userGroups
      ON userGroups.groupid = groups.groupid
      WHERE userGroups.userid = $1;
    `, [userId]);
}

// untested
const popularHashTagsQuery = () => {
  return pool.query(`
    SELECT mode() WITHIN GROUP(ORDER BY DESC)
    FROM contenttags
    JOIN groups
    ON groups.groupname = contenttags.groupname
    GROUP BY groups.groupid;
    `);
}

const tagQuery = () => {
  return pool.query(`
    SELECT DISTINCT groupname
    FROM groups;
  `);
}

// untested
// see publicGroupNameQueryByTerm query
const hashTagsTermQuery = (term) => {
  return pool.query(`
  SELECT DISTINCT groupname
  FROM contenttags
  LIMIT 10
  WHERE groupname LIKE %$1%;
  `, [term]);
}


// |III.) Groups based queries|

const publicGroupNameQueryByTerm = (term) => {
  return pool.query(`
    SELECT groupname
    FROM groups
    where groups.private = false
    and groupname LIKE '%${term}%'
    LIMIT 10;`);
}

const createMemeTagEntry = (tag, memeTagId) => {
  return pool.query(`
    INSERT INTO contenttags(
      groupname,
      tagid
    )
    VALUES(
      $1,
      $2
    )
  `, [tag, memeTagId]);
}

const tagCheckQuery = (tag) => {
  return pool.query(`
    SELECT groupname
    FROM groups
    WHERE groupname = $1;
  `,[tag])
}

const createTagEntry = (tagName) => {
  return pool.query(`
    INSERT INTO groups(groupname)
    VALUES($1)
  `,[tagName]);
}

// |IV.) Meme based queries|


const createGroupScript = (groupName) => {
  return pool.query(`
    INSERT INTO groups(
      groupname
    )
    VALUES(
      $1
    )
  `, [groupName]);
}

const previewQuery = (id) => {
  return pool.query(`
  SELECT previewsize, previewformat
  FROM weblinks
  WHERE weblinkid = $1;
  `,[id]);
}

const memeQuery = (groupName) => {
  return pool.query(
    `
      SELECT size, format
      FROM meme
      WHERE "nameGroup" = $1;
    `,
    [groupName]
  );
}

// maybe add to memesFloorRandomQuery as sub query
const memeCountQuery = () => {
  return pool.query(`
  SELECT count(*)
  FROM meme;
  `);
}

const memesFloorRandomQuery = (memeCount, limit) => {
  return pool.query(`
    SELECT name, "nameGroup", format, description
    FROM meme
    ORDER BY FLOOR(random() * ${memeCount})
    LIMIT ${limit};`);
}

const queryLinksByGroup = (groupName) => {
  return pool.query(`
    SELECT weblinks.link, contenttags.order, weblinks.previewsize, weblinks.weblinkid, weblinks.description
    FROM weblinks
    JOIN contenttags
    ON weblinks.weblinkid = contenttags.tagid
    WHERE contenttags.groupname = $1
    ORDER BY contenttags.order;
  `,
  [groupName.replace('_', ' ')]);
}

const queryMemesByGroup = (groupName) => {
  return pool.query(`
    SELECT meme.name, contenttags.order, meme.format, meme.description
    FROM meme
    JOIN contenttags
    ON meme.memetagid = contenttags.tagid
    WHERE contenttags.groupname = $1
    ORDER BY contenttags.order;
  `,
  [groupName]);
}

// unused but will implement later
const queryMemesFloorRandomCountQueryWithNoRepeatList = (viewedList, memeCount, limit) => {
  return pool.query(`
    SELECT name, "nameGroup", format, description
    FROM meme
    WHERE name NOT IN(${viewedList.map(o => `'${o}'`)})
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
  INSERT INTO meme(
    name,
    "nameGroup",
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
  RETURNING memetagid;
`, params);
}

const createWebLinkEnteryQuery = (link, username, fileSize, fileType, description) => {
  return pool.query(`
    INSERT INTO weblinks(
      link,
      poster,
      previewsize,
      previewformat,
      description
    )
    VALUES(
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING weblinkid;
  `, [link, username, fileSize, fileType, description]);
}

const createMemeTagAssociation = (tag, webLinkId) => {
  return pool.query(`
  INSERT INTO contenttags(
    groupname,
    tagid
  )
  VALUES(
    $1,
    $2
  )
`, [tag, webLinkId]);
}

// unused
const getGroupCountQuery = () => {
  return pool.query(`
    SELECT COUNT(*)
    FROM contenttags
    WHERE groupname = $1;
  `, [allTags[i]]);
}

module.exports = {

  // Users
  usernamesQuery,
  loginDataQuery,
  getGroupsByUserId,
  usernameCountQuery,
  createUserQuery,
  queryMemesByUser,
  createMemeTagEntry,

  // Groups
  tagQuery,
  queryLinksByGroup,
  queryMemesByGroup,
  publicGroupNameQueryByTerm,
  tagCheckQuery,
  createTagEntry,

  // Memes
  createGroupScript,
  createMemeEnteryQuery,
  createWebLinkEnteryQuery,
  createMemeTagAssociation,
  previewQuery,
  memeQuery,
  memeCountQuery,
  memesFloorRandomQuery
 };
