const { IS_DEV_MODE } = require('./const.js')

const utils = function () {
  function getServerError(error) {
    if (IS_DEV_MODE) {
      console.error(error)
    }

    return {
      code: 500,
      data: IS_DEV_MODE ? error :{ error: 'Critical server error' }
    }
  }

  return { getServerError };
}

module.exports = utils();