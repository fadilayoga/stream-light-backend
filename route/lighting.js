const express = require('express')
const router = express.Router()
const {
  paginatedResults,
  getOneLighting,
  getAllLighting,
  getLightingLog,
  updateOneLighting,
  getOneProblemLog,
  updateOneProblemLog
} = require('../controllers/lighting')

//get-problem-logs
router.get('/problem-logs', paginatedResults)

//get-lighting
router.post('/problem-logs/:id', getOneProblemLog, getOneLighting, updateOneLighting, updateOneProblemLog)

//get-lighting
router.get('/lighting-all', getAllLighting, getLightingLog)


module.exports = router
