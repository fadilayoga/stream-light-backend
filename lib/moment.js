var moment = require('moment')

const validateDate = (pastTime) => {
  let now = moment(pastTime, true).isValid()
  return now
}

const getDate = (pastTime) => {
  let now = moment(pastTime).format('DD-MM-YYYY/HH:mm:ss')
  return now
}

module.exports = { validateDate, getDate }
