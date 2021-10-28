const database = require('../db.js')
const { getServerError } = require('../utils.js')

const users = async function () {
  const DB = await database.get();

  async function addUser(username) {
    try {
      const result = await DB.run(`
      INSERT INTO users (username)
      VALUES (?)
    `, username);

      if(result && result.lastID) {
        return await getUserById(result.lastID)
      }
      return getServerError({ error: 'User isn\'t Added' });
    } catch (e) {
      return getServerError(e);
    }
  }

  async function getUserById(id) {
    try {
      const data = await DB.get(`
      SELECT _id, username  
      FROM users
      WHERE _id = ?
    `, id);
      return { code: 200, data };
    } catch (e) {
      return getServerError(e);
    }
  }

  async function getUserByName(username) {
    try {
      const user = await DB.get(`
      SELECT _id
      FROM users
      WHERE username = ?
    `, username);

      const userId = (user && user._id !== undefined) ? user._id : null;
      return { code: 200, data: userId };
    } catch (e) {
      return getServerError(e);
    }
  }

  async function getAllUsers() {
    try {
      const data = await DB.all(`
    SELECT _id, username  
    FROM users
  `);
      return { code: 200, data };
    } catch (e) {
      return getServerError(e);
    }
  }

  return {
    addUser,
    getUserById,
    getUserByName,
    getAllUsers
  }
}

module.exports = users();