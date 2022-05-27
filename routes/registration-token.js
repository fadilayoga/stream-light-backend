const express = require('express')
const router = express.Router()
const {
  checkDatabaseSubscribeTopic,
  storeRegistrationIds,
  subscribeTopic,
} = require('../controllers/registrationToken')

//post
router.post(
  '/registration-token',
  checkDatabaseSubscribeTopic,
  subscribeTopic,
  storeRegistrationIds
)

module.exports = router
