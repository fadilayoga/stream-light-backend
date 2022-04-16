const express = require('express')
const router = express.Router()
const {
  paginatedResults,
  getLighting,
  getLightingLog,
} = require('../controllers/lighting')

//get-problem-logs
router.get('/problem-logs', paginatedResults)

//get-lighting
router.get('/lighting-all', getLighting, getLightingLog)

module.exports = router
