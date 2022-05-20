const express = require('express')
const router = express.Router()
const { login, logout } = require('../controllers/auth')
const { runvalidationWithres } = require('../validation')
const { authorization } = require('../validation/auth')

//login
router.post('/login', login)

//authenticate
router.get('/authenticate', authorization, runvalidationWithres)

//logout
router.get('/logout', logout)

module.exports = router
