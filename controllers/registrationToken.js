const dbo = require('../models/conn')
let admin = require('firebase-admin')
let topic = 'lighting'

async function checkDatabaseSubscribeTopic(req, res, next) {
  if (!req.body.registration_ids) {
    return res.status(404).json({
      error: 'registration ids',
      message: 'empty registration ids',
    })
  }
  try {
    const dbConnect = dbo.getDbRegistrationIds()
    const registrationToken = await dbConnect.findOne({
      registration_ids: req.body.registration_ids,
    })
    if (registrationToken) {
      res.cookie('token', res.token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      return res.send({
        message: 'success',
        role: res.user.role,
      })
    }
  } catch (err) {
    return res.status(400).json({ error: 'get subscribed topic', message: err })
  }
  next()
}

async function checkDatabaseUnsubscribeTopic(req, res, next) {
  let registration_ids = null
  if (!req.body.registration_ids) {
    return res.status(400).json({
      error: 'registration ids',
      message: 'empty registration ids',
    })
  }
  try {
    const dbConnect = dbo.getDbRegistrationIds()
    const resultRegistrationIds = await dbConnect.findOne({
      registration_ids: req.body.registration_ids,
    })
    if (resultRegistrationIds) {
      registration_ids = resultRegistrationIds
    }
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'get unsubscribed topic', message: err })
  }
  res.registration_ids = registration_ids
  next()
}

async function subscribeTopic(req, res, next) {
  try {
    const subscribe = await admin
      .messaging()
      .subscribeToTopic(req.body.registration_ids, topic)
    if (subscribe.errors.length) {
      return res.status(400).json({
        error: 'subscribe topic',
        message: 'Error subscribing to topic: invalid registration ids',
      })
    }
  } catch (err) {
    return res.status(400).json({
      error: 'subscribe topic',
      message: err,
    })
  }
  next()
}

async function unsubscribeTopic(req, res, next) {
  if (!res.registration_ids) {
    return next()
  }
  try {
    const unsubscribe = await admin
      .messaging()
      .unsubscribeFromTopic(req.body.registration_ids, topic)
    if (unsubscribe.errors.length) {
      return res.status(400).json({
        error: 'unsubscribe topic',
        message: 'Error unsubscribing to topic: invalid registration ids',
      })
    }
  } catch (err) {
    return res.status(400).json({
      error: 'unsubscribe topic',
      message: err,
    })
  }
  next()
}

async function storeRegistrationIds(req, res, next) {
  try {
    const dbConnect = dbo.getDbRegistrationIds()
    const matchDocument = {
      registration_ids: `${req.body.registration_ids}`,
      last_modified: new Date(),
    }
    await dbConnect.create(matchDocument)
  } catch (err) {
    return res.status(400).json({
      error: 'store registration ids',
      message: err,
    })
  }
  res.cookie('token', res.token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  })
  res.send({
    message: 'success',
    role: res.user.role,
  })
}

async function deleteRegistrationIds(req, res, next) {
  if (!res.registration_ids) {
    return next()
  }
  try {
    await res.registration_ids.deleteOne()
  } catch (err) {
    return res.status(400).json({
      error: 'delete registration ids',
      message: err,
    })
  }
  next()
}

module.exports = {
  checkDatabaseSubscribeTopic,
  checkDatabaseUnsubscribeTopic,
  subscribeTopic,
  unsubscribeTopic,
  storeRegistrationIds,
  deleteRegistrationIds,
}
