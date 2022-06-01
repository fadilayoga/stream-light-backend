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
  json2csv,
  json2excel,
  downloadData,
} = require('../controllers/exportFile')
const { authorization } = require('../validation/auth')
const { runvalidationAuth } = require('../validation')
const { validateDate, getDate } = require('../lib/moment')

//get-problem-logs
router.get('/problem-logs', authorization, runvalidationAuth, paginatedResults)

//export
router.get('/export-problem-logs', getProblemLogs, (req, res, next) => {
  const newCars = res.problem.map(function (obj, i) {
    return {
      ...obj,
      solved: validateDate(obj.solved) ? getDate(obj.solved) : obj.solved,
      timestamp: validateDate(obj.timestamp) ? getDate(obj.timestamp) : obj.timestamp,
    }
  })
  res.json(newCars)
})
//export excel
router.get('/export-problem-logs/excel', getProblemLogs, json2excel)
//export csv
router.get('/export-problem-logs/csv', getProblemLogs, json2csv, downloadData)

//get-lighting
router.patch(
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
