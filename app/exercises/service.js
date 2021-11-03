const database = require('../db.js')
const { getServerError } = require('../utils.js')

const exercises = async function () {
  const DB = await database.get();

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

    try {
      const result = await DB.run(request, ...params);
      if(result && result.lastID) {
        return await getUsersExercises(userId);
      }
      return getServerError({ error: 'Exercises isn\'t Added' });
    } catch (e) {
      return getServerError(e);
    }

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

    try {
      const rows = await DB.all(request, ...params);
      const { count } = await DB.get(`SELECT COUNT(1) as 'count' FROM exercises`);
      return { code: 200, data: { rows, count } };
    } catch (e) {
      return getServerError(e);
    }
  }

  return {
    addExercise,
    getUsersExercises
  }
}

module.exports = exercises();