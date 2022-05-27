let admin = require('firebase-admin')
const { ObjectId } = require('mongodb')
const dbo = require('../models/conn')

module.exports = {
  sendNoification: function (message) {
    const notification_topic = 'lighting'
    const notification_message = {
      webpush: {
        notification: {
          title: message.title,
          body: message.body,
          icon: message.icon,
          badge:
            'https://maxst.icons8.com/vue-static/landings/page-index/products/logo/generatedPhotos.png',
        },
        fcm_options: {
          link: 'https://dummypage.com',
        },
      },
      data: {
        userID: 'UserID',
        ...(message.link ? { link: message.link } : {}),
        icon: message.icon,
      },
      topic: notification_topic,
    }

    admin
      .messaging()
      .send(notification_message)
      .then((response) => {
        console.log('Successfully sent message:', response)
      })
      .catch((error) => {
        console.log('Error sending message:', error)
      })
  },

  checkDatabase: function (message, callback) {
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbLighting()
      dbConnect
        .find({
          name: message.name,
        })
        .limit(1)
        .then((result) => {
          if (!result.length) {
            this.storeNewLighting(message, callback)
              .then((result) => {
                console.log(result)
              })
              .catch((err) => {
                console.log(err)
              })
          } else {
            this.storeLightingLog(message, result[0], callback)
              .then((result) => {
                console.log(result)
              })
              .catch((err) => {
                console.log(err)
              })
          }
        })
        .catch(() => {
          reject('Error fetching listings!')
        })
    })
  },

  storeNewLighting: function (message, callback) {
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbLighting()
      const matchDocument = {
        name: message.name,
        status: {
          light: true,
          esp: true,
        },
      }

      dbConnect.create(matchDocument, (err, result) => {
        if (err) {
          reject(err)
        } else {
          this.storeLightingLog(message, result, callback)
            .then((result) => {
              console.log(result)
            })
            .catch((err) => {
              console.log(err)
            })
          resolve(`Added new lighting with id ${result._id}`)
        }
      })
    })
  },

  storeLightingLog: function (message, lighting, callback) {
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbLightingLog()
      const matchDocument = {
        lighting: lighting._id,
        ldr: message.ldr,
        location: message.location,
        timestamp: new Date(),
      }

      dbConnect.create(matchDocument, (err, result) => {
        if (err) {
          reject(err)
        } else {
          //notification condition
          if (result.ldr < 75) {
            if (lighting.status.light) {
              if (!result.location) {
                this.getOneLightingLog(lighting._id)
                  .then((logWithlastValidLocation) => {
                    this.updateLightingStatus(
                      lighting,
                      logWithlastValidLocation,
                      callback
                    )
                      .then((result) => {
                        console.log(result)
                      })
                      .catch((err) => {
                        console.log(err)
                      })
                  })
                  .catch(() => {
                    // update status light to false
                    this.updateLightingStatus(lighting, result, callback)
                      .then((result) => {
                        console.log(result)
                      })
                      .catch((err) => {
                        console.log(err)
                      })
                  })
              } else {
                // update status light to false
                this.updateLightingStatus(lighting, result, callback)
                  .then((result) => {
                    console.log(result)
                  })
                  .catch((err) => {
                    console.log(err)
                  })
              }
            }
          }

          this.broadcastMessage(lighting._id, callback)
          resolve(`Added log with id ${result._id}`)
        }
      })
    })
  },

  updateLightingStatus: function (lighting, logs, callback) {
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbLighting()
      const filter = {
        _id: logs.lighting,
      }
      const update = {
        'status.light': false,
      }

      dbConnect.findOneAndUpdate(filter, update, (err, result) => {
        if (err) {
          reject('error guys')
        } else {
          //store to problem logs
          this.storeProblemLog(lighting, logs, callback)
            .then((result) => {
              console.log(result)
            })
            .catch((err) => {
              console.log(err)
            })
          resolve('lighting status updated')
        }
      })
    })
  },

  storeProblemLog: function (lighting, logs) {
    // action store to the problem logs --> then push notification
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbProblemLog()
      const matchDocument = {
        log: logs._id,
        problem: 'lighting error',
        timstamp: new Date(),
      }

      dbConnect.create(matchDocument, (err, result) => {
        if (err) {
          reject(err)
        } else {
          //send notification
          this.sendNoification({
            title: lighting.name,
            body: result.problem,
            ...(logs.location
              ? {
                  link: `https://www.google.com/maps/search/?api=1&query=${logs.location.lat}%2C${logs.location.long}`,
                }
              : null),
            icon: '../static/assets/notification_icon.webp',
          })
          resolve(`Added problem log with id ${result._id}`)
        }
      })
    })
  },

  getOneLightingLog: function (lightingId) {
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbLightingLog()
      dbConnect
        .findOne({ lighting: `${lightingId}`, location: { $ne: null } })
        .sort({ timestamp: -1 })
        .then((result) => {
          if (!result) {
            return reject()
          }
          resolve(result)
        })
        .catch((err) => {
          console.log(err, 'error')
          reject('Error fetching listings!')
        })
    })
  },

  getOneLightingLogNullLocation: function (lightingId) {
    return new Promise((resolve, reject) => {
      const dbConnect = dbo.getDbLightingLog()
      dbConnect
        .findOne({ lighting: `${lightingId}` })
        .sort({ timestamp: -1 })
        .then((result) => {
          if (!result) {
          }
          resolve(result)
        })
        .catch((err) => {
          console.log(err, 'error')
          reject('Error fetching listings!')
        })
    })
  },

  broadcastMessage: async function (id, callback) {
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
        { $project: { logs: { $slice: ['$logs', -20] } } },
        {
          $lookup: {
            from: 'lightings',
            localField: '_id',
            foreignField: '_id',
            as: 'result',
          },
        },
        { $sort: { 'result.name': 1 } },
        {
          $match: {
            result: { $ne: [] },
            _id: ObjectId(`${id}`),
          },
        },
      ])
      callback(result)
    } catch (err) {
      console.log(err)
    }
  },
}
