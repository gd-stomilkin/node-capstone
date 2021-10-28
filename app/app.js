require('dotenv').config()
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const application = function () {
  let app;

  async function get() {
    if (!app) {
      app = express();
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());
      app.use(bodyParser.raw());
      app.use(cors())
      app.use(express.static('public'))
    }

    return app;
  }

  return get;
}

module.exports = application();