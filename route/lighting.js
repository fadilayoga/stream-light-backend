const express = require('express')
const router = express.Router()
const {
  paginatedResults,
  getOneLighting,
  getLightingLog,
  updateOneLighting,
  getOneProblemLog,
  updateOneProblemLog,
} = require('../controllers/lighting')
const {
  getProblemLogs,
  csvParser,
  downloadData,
} = require('../controllers/exportFile')
const { authorization } = require('../validation/auth')
const { runvalidationAuth } = require('../validation')

//get-problem-logs
router.get('/problem-logs', authorization, runvalidationAuth, paginatedResults)

//export
router.get('/export-problem-logs', getProblemLogs, csvParser, downloadData)

//get-lighting
router.post(
  '/problem-logs/:id',
  authorization,
  runvalidationAuth,
  getOneProblemLog,
  getOneLighting,
  updateOneLighting,
  updateOneProblemLog
)

//get-lighting
router.get('/lighting-all', authorization, runvalidationAuth, getLightingLog)

module.exports = router
