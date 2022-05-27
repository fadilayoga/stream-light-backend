const express = require('express')
const router = express.Router()
const { login, logout } = require('../controllers/auth')
const { runvalidationWithres } = require('../validation')
const { authorization } = require('../validation/auth')
const {
  checkDatabaseSubscribeTopic,
  checkDatabaseUnsubscribeTopic,
  subscribeTopic,
  unsubscribeTopic,
  storeRegistrationIds,
  deleteRegistrationIds,
} = require('../controllers/registrationToken')

// login
router.post(
  '/login',
  login,
  checkDatabaseSubscribeTopic,
  subscribeTopic,
  storeRegistrationIds
)

//authenticate
router.get('/authenticate', authorization, runvalidationWithres)

//logout
router.post(
  '/logout',
  checkDatabaseUnsubscribeTopic,
  unsubscribeTopic,
  deleteRegistrationIds,
  logout
)

module.exports = router
