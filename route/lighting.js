const express = require('express')
const router = express.Router()
const dbo = require('../db/conn');

const db = {
    getLighting() {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbLighting();
            dbConnect
                .find({})
                .then(result => {
                    resolve(result)
                })
                .catch(() => {
                    reject('Error fetching listings!');
                })
        })
    },

    getLightingLog() {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbLightingLog();
            dbConnect
                .find({})
                .populate('lighting')
                .then(result => {
                    let filter = result.filter(result => result.lighting !== null)
                    resolve(filter)
                })
                .catch(() => {
                    reject('Error fetching listings!');
                })
        })
    },

    getProblemLog() {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbProblemLog();
            dbConnect
                .find({})
                .populate('lighting')
                .then(result => {
                    let filter = result.filter(result => result.lighting !== null)
                    resolve(filter)
                })
                .catch(() => {
                    reject('Error fetching listings!');
                })
        })
    },

    paginatedResults: (model) => {
        return async (req, res, next) => {
          const page = parseInt(req.query.page)
          const limit = parseInt(req.query.limit)
      
          const startIndex = (page - 1) * limit
          const endIndex = page * limit

          const total_pages = await model.count().exec()
      
          const results = {}

          results.total_pages = Math.ceil(total_pages / limit)
      
          if (endIndex < await total_pages) {
            results.next = page + 1
          }
          
          if (startIndex > 0) {
            results.previous = page - 1
          }
          
          try {
            results.results = await model.find().limit(limit).skip(startIndex).exec()
            res.paginatedResults = results
            next()
          } catch (e) {
            res.status(500).json({ message: e.message })
          }
        }
      }
}

router.route("/problem-logs")
    .get(db.paginatedResults(dbo.getDbProblemLog()), (req, res) => {
        res.json(res.paginatedResults)
    })

router.route("/lighting-all")
    .get(async function (req, res) {
        try {
            let lighting = await db.getLighting()
            let lightingLog = await db.getLightingLog()
            let problemLog = await db.getProblemLog()

            res.json({
                lighting,
                lightingLog,
                problemLog
            })
        } catch (err) {
            res.status(400).json({
                code: 'error',
                message: err
            })
        }
    })

router.all('/problem-logs', function (req, res, next) {
    res.status(400).send({
        error: "invalid url",
        message: "please review your destination address"
    })
    next()
})

module.exports = router