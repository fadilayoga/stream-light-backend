const dbo = require('../models/conn')
let admin = require('firebase-admin')
let topic = 'lighting'

async function checkDatabaseRegistrationToken(req, res, next) {
  try {
    const dbConnect = dbo.getDbRegistrationIds()
    const registrationToken = await dbConnect.findOne({
      registration_ids: req.body.registration_ids,
    })
    if (registrationToken) {
      return res.json({ message: registrationToken })
    }
  } catch (err) {
    return res.status(400).json({ error, message: 'Error fetching listings!' })
  }
  next()
}

function subscribeToken(req, res, next) {
  admin
    .messaging()
    .subscribeToTopic(req.body.registration_ids, topic)
    .then((response) => {
      if (!response.errors.length) {
        next()
      } else {
        return res.status(400).json({
          error: true,
          message: 'Error subscribing to topic: invalid registration token',
        })
      }
    })
    .catch((error) => {
      return res.status(400).json({
        error,
        message: 'Error subscribing to topic: invalid registration token',
      })
    })
}

function storeRegistrationToken(req, res, next) {
  try {
    const dbConnect = dbo.getDbRegistrationIds()
    const matchDocument = {
      registration_ids: `${req.body.registration_ids}`,
      last_modified: new Date(),
    }
    const result = dbConnect.create(matchDocument)
    res.json({ message: result._id })
  } catch (err) {
    return res.status(400).json({
      error,
      message: err,
    })
  }
}

module.exports = {
  checkDatabaseRegistrationToken,
  storeRegistrationToken,
  subscribeToken,
}
