const express = require('express')
const router = express.Router()
const {
  checkDatabaseRegistrationToken,
  storeRegistrationToken,
  subscribeToken,
} = require('../controllers/registrationToken')

//post
router.post(
  '/registration-token',
  checkDatabaseRegistrationToken,
  subscribeToken,
  storeRegistrationToken
)

module.exports = router
