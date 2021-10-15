const express = require('express')
const app = express()
const cors = require('cors')
const sqlite3 = require("sqlite3");
const qs = require('querystring');
const path = require("path");
const DB_PATH = path.join(__dirname,"test.db");
const DB = new sqlite3.Database(DB_PATH);
const util = require("util");
require('dotenv').config()

const SQL = {
  run(...args) {
    return new Promise(function c(resolve,reject){
      DB.run(...args,function onResult(err){
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
  get: util.promisify(DB.get.bind(DB)),
  all: util.promisify(DB.all.bind(DB)),
  exec: util.promisify(DB.exec.bind(DB)),
};

app.use(cors())
app.use(express.static('public'))

run();

async function run() {
  await initDB();
  initRoutes();

  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('App is listening on port ' + listener.address().port)
  })
}

function initRoutes() {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
  });

  app.get('/api/users', async (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(await getAllUsers()));
  });

  app.post('/api/users/:id/exercises', (req, res) => {
    handleRequest(req, async (post) => {
      const user = await getUserById(req.params.id);
      if(!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(`{error: 'No such user in DB'}`);
      } else if (!post.description || !post.duration) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(`{error: 'The \`description\` and \`duration\` field are required'}`);
      } else if (post.date && !post.date.match(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(`{error: 'The \`date\` field should be yyyy-mm-dd'}`);
      } else if (post.duration && Number.isInteger(post.duration * 1)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(`{error: 'The \`duration\` field should be a number'}`);
      } else {
        const exercises = await addExercise(req.params.id, post);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(exercises));
      }
    });
  });

  app.get('/api/users/:id/logs', async (req, res) => {
    const user = await getUserById(req.params.id);
    if(user) {
      const exercises = await getUsersExercises(req.params.id, req.query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(exercises));
    } else {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(`{error: 'No such user in DB'}`);
    }
  });

  app.post('/api/users', (req, res) => {
    handleRequest(req, async (post) => {
      if(post.username) {
        const userId = await getUserByName(post.username);
        if(userId === null) {
          const user = await addUser(post.username);
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(user));
        } else {
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(`{error: 'User already exists'}`);
        }
      } else {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(`{error: 'The \`username\` field is required'}`);
      }
    });
  });
}

async function handleRequest(req, callback) {
  let data = '';
  req.on('data', chunk => {
    data += chunk
  });
  req.on('end', async () => {
    callback(qs.parse(data));
  });
}

async function initDB () {
  await SQL.exec(`
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
}

async function addUser(username) {
  const result = await SQL.run(`
    INSERT INTO users (username)
    VALUES (?)
  `, username);

  if(result && result.lastID) {
    return await getUserById(result.lastID)
  }
  return {};
}

async function addExercise(userId, data) {
  let params = [userId, data.description, data.duration];
  let date = '';
  if(data.date) {
    params.push(data.date);
    date = ', date';
  }

  const request = `
    INSERT INTO exercises (user_id, description, duration ${date})
    VALUES (?, ?, ? ${date?', ?': ''})
  `;
  const result = await SQL.run(request, ...params);
  if(result && result.lastID) {
    return await getUsersExercises(userId);
  }
  return [];
}

async function getUsersExercises(userId, filters = {}) {
  let limit = '';
  let from = '';
  let to = '';
  let params = [userId];

  if(filters.from) {
    from = `AND date >= ?`;
    params.push(filters.from);
  }

  if(filters.to) {
    to = `AND date <= ?`;
    params.push(filters.to);
  }

  if(filters.limit) {
    limit = `LIMIT ?`;
    params.push(filters.limit);
  }

  const request = `
    SELECT description, duration, date
    FROM exercises
    WHERE user_id = ?
    ${from}
    ${to}
    ORDER BY date ASC
    ${limit}
  `;

  return await SQL.all(request, ...params);
}

async function getUserById(id) {
  return await SQL.get(`
    SELECT _id, username  
    FROM users
    WHERE _id = ?
  `, id);
}

async function getUserByName(username) {
  const user = await SQL.get(`
    SELECT _id
    FROM users
    WHERE username = ?
  `, username);

  if (user && user._id !== undefined) {
    return user._id;
  } else {
    return null;
  }
}

async function getAllUsers() {
  return await SQL.all(`
    SELECT _id, username  
    FROM users
  `);
}
