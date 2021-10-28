const application = require('./app');
const users = require('./users/service');
const exercises = require('./exercises/service');


const routes = function () {
  async function init () {
    const app = await application();

    const {
      addUser,
      getUserById,
      getUserByName,
      getAllUsers
    } = await users;

    const {
      addExercise,
      getUsersExercises
    } = await exercises;

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index/view.html')
    });

    app.get('/api/users', async (req, res) => {
      const result = await getAllUsers();
      res.status(result.code).json(result.data).end();
    });

    app.post('/api/users/:id/exercises', async (req, res) => {
      const user = await getUserById(req.params.id);
      if(user.code === 200) {
        if(!user.data) {
          res.status(404).json({ error: 'No such user in DB' }).end();
        } else if (!req.body.description || !req.body.duration) {
          res.status(400).json({ error: 'The `description` and `duration` field are required' }).end();
        } else if (req.body.date && !req.body.date.match(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)) {
          res.status(400).json({ error: 'The `date` field should be yyyy-mm-dd' }).end();
        } else if (req.body.duration && !Number.isInteger(req.body.duration * 1)) {
          res.status(400).json({ error: 'The `duration` field should be a number' }).end();
        } else {
          const exercises = await addExercise(req.params.id, req.body);
          res.status(exercises.code).json(exercises.data).end();
        }
      } else {
        res.status(user.code).json(user.data).end();
      }

    });

    app.get('/api/users/:id/logs', async (req, res) => {
      const user = await getUserById(req.params.id);
      if(user.code === 200) {
        if(user.data) {
          const exercises = await getUsersExercises(req.params.id, req.query);
          res.status(exercises.code).json(exercises.data).end();
        } else {
          res.status(404).json({ error: 'No such user in DB' }).end();
        }
      } else {
        res.status(user.code).json(user.data).end();
      }
    });

    app.post('/api/users', async (req, res) => {
      if(req.body.username) {
        const userId = await getUserByName(req.body.username);
        if(userId.code === 200) {
          if(userId.data === null) {
            const user = await addUser(req.body.username);
            res.status(user.code).json(user.data).end();
          } else {
            res.status(400).json({ error: 'User already exists' }).end();
          }
        } else {
          res.status(userId.code).json(userId.data).end();
        }
      } else {
        res.status(400).json({ error: 'The `username` field is required' }).end();
      }
    });
  }

  return { init }
}

module.exports = routes();