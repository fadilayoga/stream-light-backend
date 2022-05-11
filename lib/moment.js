var moment = require('moment');

const getDate = (pastTime) => {
  let now = moment(pastTime).format('DD-MM-YYYY/HH:mm:ss')
  return now
}

module.exports = { getDate }
