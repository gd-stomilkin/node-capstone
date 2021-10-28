const database = require('./app/db');
const routes = require('./app/routes');
const application = require('./app/app');

run();

async function run() {
  try {
    const app = await application();
    await routes.init();
    await database.init();

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('App is listening on port ' + listener.address().port)
    })
  } catch (e) {
    console.log('Error on App initialisation')
  }
}
