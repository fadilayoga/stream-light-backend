const fs = require('fs')
const path = require('path')
const dbo = require('../models/conn')
const { Parser } = require('json2csv')
const { Workbook } = require('excel4node')
const dateTime = new Date()
  .toISOString()
  .slice(-24)
  .replace(/\D/g, '')
  .slice(0, 14)
const fileName = 'report-' + dateTime
const filePath = path.join(__dirname, '../', 'static', 'exports', fileName)
const { validateDate, getDate } = require('../lib/moment')

async function getProblemLogs(req, res, next) {
  let data
  try {
    let results = await dbo.getDbProblemLog().aggregate([
      {
        $lookup: {
          from: 'lighting_logs',
          localField: 'log',
          foreignField: '_id',
          as: 'result',
          pipeline: [
            {
              $lookup: {
                from: 'lightings',
                localField: 'lighting',
                foreignField: '_id',
                as: 'lamp',
              },
            },
          ],
        },
      },
      {
        $addFields: {
          latitude: {
            $reduce: {
              input: '$result.location.lat',
              initialValue: 'Unspecified',
              in: '$$this',
            },
          },
          longtitude: {
            $reduce: {
              input: '$result.location.long',
              initialValue: 'Unspecified',
              in: '$$this',
            },
          },
          lighting_name: {
            $reduce: {
              input: '$result.lamp.name',
              initialValue: 'Unspecified',
              in: '$$this',
            },
          },
        },
      },
      {
        $unwind: '$result',
      },
      {
        $project: {
          _id: 0,
          lighting_name: {
            $reduce: {
              input: '$lighting_name',
              initialValue: '',
              in: {
                $concat: ['$$value', '$$this'],
              },
            },
          },
          ldr: 1,
          latitude: 1,
          longtitude: 1,
          solved: {
            $ifNull: ['$solved.confirmed_date', 'Unspecified'],
          },
          timestamp: 1,
          problem: 1,
        },
      },
    ])
    data = results
  } catch (e) {
    res.status(500).json({
      message: e.message,
    })
  }
  res.problem = data
  next()
}

function json2csv(req, res, next) {
  const fields = [
    {
      label: 'Lighting',
      value: (row, field) => row['lighting_name'],
      default: 'NULL',
    },
    {
      label: 'Problem',
      value: (row, field) => row['problem'],
      default: 'NULL',
    },
    {
      label: 'Issue Date',
      value: (row, field) => row['timestamp'],
      default: 'NULL',
    },
    {
      label: 'Fixed Date',
      value: (row, field) => row['solved'],
      default: 'NULL',
    },
    {
      label: 'Latitude',
      value: (row, field) => row['latitude'],
      default: 'NULL',
    },
    {
      label: 'Longtitude',
      value: (row, field) => row['longtitude'],
      default: 'NULL',
    },
  ]
  const json2csvParser = new Parser({ fields })
  const result = json2csvParser.parse(res.problem)
  res.file = result
  res.format = '.csv'
  next()
}

function json2excel(req, res, next) {
  const data = res.problem
  const wb = new Workbook()
  const ws = wb.addWorksheet('Sheet1')
  const headingColumnNames = [
    'Lighting',
    'Problem',
    'Issue Date',
    'Fixed Date',
    'Latitude',
    'Longtitude',
  ]
  const dataRowOrder = [
    'lighting_name',
    'problem',
    'timestamp',
    'solved',
    'latitude',
    'longtitude',
  ]
  const dateData = ['solved', 'timestamp']
  const locationData = ['latitude', 'longtitude']
  let headingColumnIndex = 1
  headingColumnNames.forEach((heading) => {
    ws.cell(1, headingColumnIndex++).string(heading)
  })
  let rowIndex = 2
  data.forEach((record) => {
    let columnIndex = 1
    dataRowOrder.forEach((columnName) => {
      if (dateData.includes(columnName) && validateDate(record[columnName])) {
        return ws
          .cell(rowIndex, columnIndex++)
          .string(getDate(record[columnName]))
      }
      if (
        locationData.includes(columnName) &&
        record[columnName] !== 'Unspecified'
      ) {
        return ws.cell(rowIndex, columnIndex++).number(record[columnName])
      }
      ws.cell(rowIndex, columnIndex++).string(`${record[columnName]}`)
    })
    rowIndex++
  })
  wb.write(filePath + '.xlsx', function (err, stats) {
    if (err) {
      return res.json({ error: err, message: 'export xlsx' })
    } else {
      res.download(filePath + '.xlsx')
    }
  })
  setTimeout(function () {
    fs.unlink(filePath + '.xlsx', function (err) {
      if (err) {
        return console.error(err)
      }
      console.log('File has been Deleted')
    })
  }, 10000)
}

async function downloadData(req, res, next) {
  try {
    fs.writeFileSync(filePath + res.format, res.file, 'binary')
    setTimeout(function () {
      fs.unlink(filePath + res.format, function (err) {
        if (err) {
          return console.error(err)
        }
        console.log('File has been Deleted')
      })
    }, 10000)
  } catch (err) {
    return res.json({ error: err, message: 'export csv' })
  }
  res.download(filePath + res.format)
}

module.exports = {
  getProblemLogs,
  json2csv,
  json2excel,
  downloadData,
}
