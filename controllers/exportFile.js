const fs = require('fs')
const path = require('path')
const dbo = require('../models/conn')
const { Parser } = require('json2csv')
const dateTime = new Date()
  .toISOString()
  .slice(-24)
  .replace(/\D/g, '')
  .slice(0, 14)
const fileName = 'problem-' + dateTime + '.csv'
const filePath = path.join(__dirname, '../', 'static', 'exports', fileName)
const { getDate } = require('../lib/moment')

async function getProblemLogs(req, res, next) {
  let data
  try {
    let results = await dbo
      .getDbProblemLog()
      .find()
      .populate({
        path: 'log',
        select: 'location -_id',
        populate: {
          path: 'lighting',
          model: 'lighting',
          select: 'name _id',
        },
      })
      .lean()
    data = results
  } catch (e) {
    res.status(500).json({
      message: e.message,
    })
  }
  res.problem = data
  next()
}

function csvParser(req, res, next) {
  const fields = [
    {
      label: 'LIGHTING', // Optional, column will be labeled with the function name or empty if the function is anonymous
      value: (row, field) => (row['log'] ? row['log'].lighting.name : null),
      default: 'NULL', // default if value function returns null or undefined
    },
    {
      label: 'PROBLEM', // Optional, column will be labeled with the function name or empty if the function is anonymous
      value: (row, field) => (row['problem'] ? row['problem'] : null),
      default: 'NULL', // default if value function returns null or undefined
    },
    {
      label: 'ISSUE DATE', // Optional, column will be labeled with the function name or empty if the function is anonymous
      value: (row, field) => (row['timestamp'] ? getDate(row['timestamp']) : null),
      default: 'NULL', // default if value function returns null or undefined
    },
    {
      label: 'FIXED DATE', // Optional, column will be labeled with the function name or empty if the function is anonymous
      value: (row, field) => (row['solved'] ? getDate(row['solved'].confirmed_date) : null),
      default: 'NULL', // default if value function returns null or undefined
    },
    {
      label: 'LATITUDE', // Optional, column will be labeled with the function name or empty if the function is anonymous
      value: (row, field) => (row['log'].location ? row['log'].location.lat : null),
      default: 'NULL', // default if value function returns null or undefined
    },
    {
      label: 'LONGTITUDE', // Optional, column will be labeled with the function name or empty if the function is anonymous
      value: (row, field) => (row['log'].location ? row['log'].location.long : null),
      default: 'NULL', // default if value function returns null or undefined
    },
  ]
  const json2csvParser = new Parser({ fields, delimiter: ';' })
  result = json2csvParser.parse(res.problem)
  console.log(result)
  res.csv = result
  next()
}

function downloadData(req, res, next) {
  fs.writeFile(filePath, res.csv, function (err) {
    if (err) {
      return res.json(err).status(500)
    } else {
      setTimeout(function () {
        fs.unlink(filePath, function (err) {
          // delete this file after 30 seconds
          if (err) {
            console.error(err)
          }
          console.log('File has been Deleted')
        })
      }, 10000)
      res.send(
        req.protocol +
          '://' +
          req.get('host') +
          '/' +
          'static' +
          '/' +
          'exports' +
          '/' +
          fileName
      )
    }
  })
}

module.exports = {
  getProblemLogs,
  csvParser,
  downloadData,
}
