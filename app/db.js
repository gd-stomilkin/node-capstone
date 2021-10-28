const Database = require('sqlite-async')
const path = require("path");
const DB_PATH = path.join(__dirname,"../test.db");


const database = function () {
  let db;

  async function init() {
    const _db = await get();
    await _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        _id INTEGER PRIMARY KEY ASC,
        username VARCHAR(40) UNIQUE
      );
  
      CREATE TABLE IF NOT EXISTS exercises (
        _id INTEGER PRIMARY KEY ASC,
        user_id INTEGER NOT NULL,
        description VARCHAR(40) NOT NULL,
        duration INTEGER NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
          
        FOREIGN KEY (user_id) REFERENCES users(_id)
      );
    `);
    console.log('DB successfully initialized')
  }

  async function get() {
    if (!db) {
      db = await Database.open(DB_PATH);
    }
    return db;
  }

  return { get, init }
}

module.exports = database();