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
    const result = await dbConnect.find({}).populate('lighting')
    const filter = result.filter((result) => result.lighting !== null)
    req.logs = filter
    res.json({
      lighting: req.lightings,
      lightingLog: req.logs,
    })
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
    res.json({ results })
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
