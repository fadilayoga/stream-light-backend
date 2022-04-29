const dbo = require('../models/conn')

async function getAllLighting(req, res, next) {
  try {
    const dbConnect = dbo.getDbLighting()
    const lighting = await dbConnect.find({})
    req.lightings = lighting
    next()
  } catch (err) {
    return res.status(500).json({ message: err })
  }
}

async function getOneProblemLog(req, res, next) {
  let problemData
  try {
    const dbConnect = dbo.getDbProblemLog()
    const result = await dbConnect
      .findOne({ _id: req.params.id })
      .populate({
        path: 'log',
        select: 'location -_id',
        populate: {
          path: 'lighting',
          model: 'lighting',
          select: 'name _id',
        },
      })
    if (!result) {
      return res.status(404).json({ message: 'problem log not found' })
    }
    if (!result.log) {
      return res.status(404).json({ message: 'lighting log not found' })
    }
    if (result.solved) {
      return res.status(400).json({ message: 'lighting already fixed' })
    }
    problemData = result
  } catch (err) {
    return res.status(500).json({ message: err })
  }
  res.problemLog = problemData
  next()
}

async function getOneLighting(req, res, next) {
  let lightingData
  try {
    const dbConnect = dbo.getDbLighting()
    const lighting = await dbConnect.findOne({
      _id: res.problemLog.log.lighting,
    })
    if (!lighting) {
      return res.status(404).json({ message: 'lighting not found' })
    }
    if (lighting.status.light) {
      return res.status(400).json({ message: 'lighting already on' })
    }
    lightingData = lighting
  } catch (err) {
    return res.status(400).json({ message: err })
  }
  res.lighting = lightingData
  next()
}

async function updateOneLighting(req, res, next) {
  res.lighting.status = {
    light: true,
    esp: res.lighting.status.esp,
  }
  try {
    await res.lighting.save()
    next()
  } catch (err) {
    return res.status(500).json({ message: err })
  }
}

async function updateOneProblemLog(req, res, next) {
  res.problemLog.solved = {
    userId: req.data._id,
    confirmed_date: new Date()
  }
  try {
    const result = await res.problemLog.save()
    res.json(result)
  } catch (err) {
    return res.status(500).json({ message: err })
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
      { $project: { logs: { $slice: ['$logs', 0] } } },
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
    return res.status(500).json({ message: err })
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
          select: 'name _id',
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
  getOneLighting,
  getAllLighting,
  getLightingLog,
  updateOneLighting,
  getOneProblemLog,
  paginatedResults,
  updateOneProblemLog,
}
