const express = require('express')
const router = express.Router()
const dbo = require('../db/conn');
let admin = require("firebase-admin");
let topic = 'lighting'

const checking = {
    checkDatabaseRegistrationToken(registration_ids) {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbRegistrationIds();
            dbConnect
                .find({
                    registration_ids: registration_ids
                })
                .limit(1).then(result => {
                    if (!result.length) {
                        resolve()
                    } else {
                        reject()
                    }
                }).catch(() => {
                    reject('Error fetching listings!');
                })
        })
    },
    storeRegistrationToken(registration_ids) {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbRegistrationIds();
            const matchDocument = {
                registration_ids: `${registration_ids}`,
                last_modified: new Date()
            };

            dbConnect
                .create(matchDocument, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(`Added a new match with id ${result._id}`);
                    }
                });
        })
    },
    subscribeToken(registration_ids) {
        return new Promise((resolve, reject) => {
            admin.messaging().subscribeToTopic(registration_ids, topic)
                .then((response) => {
                    if (!response.errors.length) {
                        resolve()
                    } else {
                        reject('Error subscribing to topic: invalid registration token');
                    }
                })
                .catch((error) => {
                    reject('Error subscribing to topic:', error);
                });
        });
    }
}

router.route("/registration-token")
    .post(function (req, res) {
        checking.checkDatabaseRegistrationToken(req.body.registration_ids).then(() => {
            checking.subscribeToken(req.body.registration_ids).then(() => {
                checking.storeRegistrationToken(req.body.registration_ids).then((result) => {
                    res.send(result)
                }).catch((err) => {
                    res.status(400).send(err)
                })
            }).catch((err) => {
                res.status(400).send(err)
            })
        }).catch((err) => {
            if (err) {
                res.status(400).send(err)
            } else {
                res.send('document is exist.')
            }
        })
    })

router.all('/registration-token', function (req, res, next) {
    res.status(400).send({
        error: "invalid url",
        message: "please review your destination address"
    })
    next()
})

module.exports = router