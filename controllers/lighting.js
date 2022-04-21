const dbo = require('../models/conn')

async function getLighting(req, res, next) {
  try {
    const dbConnect = dbo.getDbLighting()
    const lighting = await dbConnect.find({})
    req.lightings = lighting
    next()
  } catch (err) {
    return res.status(404).json({ message: err })
  }
}

async function getLightingLog(req, res, next) {
  try {
    const dbConnect = dbo.getDbLightingLog()
    const result = await dbConnect.aggregate([
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: '$lighting',
          logs: {
            $push: {
              ldr: '$ldr',
              location: '$location',
              timestamp: '$timestamp',
            },
          },
        },
      },
      { $project: { logs: { $slice: ['$logs', -15] } } },
      {
        $lookup: {
          from: 'lightings',
          localField: '_id',
          foreignField: '_id',
          as: 'result',
        },
      },
      { $sort: { 'result.name': 1 } },
      { $match: { result: { $ne: [] } } },
    ])
    res.json(result)
  } catch (err) {
    return res.status(404).json({ message: err })
  }
}

const paginatedResults = async (req, res, next) => {
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)

  const startIndex = (page - 1) * limit
  const endIndex = page * limit

  const total_pages = await dbo.getDbProblemLog().count().exec()

  const results = {}

  results.total_pages = Math.ceil(total_pages / limit)

  if (endIndex < (await total_pages)) {
    results.next = page + 1
  }

  if (startIndex > 0) {
    results.previous = page - 1
  }

  try {
    results.results = await dbo
      .getDbProblemLog()
      .find()
      .populate({
        path: 'log',
        select: 'location -_id',
        populate: {
          path: 'lighting',
          model: 'lighting',
          select: 'name -_id',
        },
      })
      .limit(limit)
      .skip(startIndex)
      .exec()
    res.json(results)
  } catch (e) {
    res.status(500).json({
      message: e.message,
    })
  }
}

module.exports = {
  getLighting,
  getLightingLog,
  paginatedResults,
}
