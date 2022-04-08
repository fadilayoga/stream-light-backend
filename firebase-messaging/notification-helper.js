let admin = require("firebase-admin");
const dbo = require('../db/conn');

module.exports = {
    sendNoification: function (message) {
        const notification_topic = 'lighting';
        const notification_message = {
            webpush: {
                notification: {
                    title: message.title,
                    body: message.body,
                    icon: message.icon,
                    badge: "https://maxst.icons8.com/vue-static/landings/page-index/products/logo/generatedPhotos.png",
                },
                fcm_options: {
                    link: "https://dummypage.com"
                }
            },
            data: {
                userID: 'UserID',
                link: message.link,
            },
            topic: notification_topic
        };

        admin.messaging().send(notification_message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });        
    },

    checkDatabase: function (message, callback) {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbLighting();
            dbConnect
            .find({ name: message.name })
            .limit(1).then(result => {
                if(!result.length) {
                    this.storeNewLighting(message, callback).then(result => {
                        console.log(result)
                    }).catch(err => {
                        console.log(err)
                    })
                }else{                
                    this.storeLightingLog(message, result[0], callback).then((result) => {
                        console.log(result)
                    }).catch((err) => {
                        console.log(err)
                    })
                }
            }).catch(() => {
                reject('Error fetching listings!');
            })
        })
    },

    storeNewLighting: function(message, callback) {
        return new Promise((resolve, reject) => {            
            const dbConnect = dbo.getDbLighting();
            const matchDocument = {
                name: message.name,
                status: {
                    light: true,
                    esp: true
                }
            };

            dbConnect
                .create(matchDocument, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.storeLightingLog(message, result, callback).then((result) => {
                            console.log(result)
                        }).catch((err) => {
                            console.log(err)
                        })
                        resolve(`Added new lighting with id ${result._id}`)
                    }
                });
        });        
    },

    storeLightingLog: function (message, lighting, callback) {
        return new Promise((resolve, reject) => {            
            const dbConnect = dbo.getDbLightingLog();
            const matchDocument = {
                lighting: lighting._id,
                ldr: message.ldr, 
                location: message.location,
                timestamp: new Date()            
            };

            dbConnect
                .create(matchDocument, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        //notification condition
                        if(result.ldr < 100) {
                            if(lighting.status.light){
                                // update status light to false
                                this.updateLightingStatus(lighting, callback).then(result => {
                                    console.log(result)
                                }).catch(err => {
                                    console.log(err)
                                })                                
                            }
                        }

                        this.getAllLightingLog(callback).then(result => {}).catch(err => {})
                        resolve(`Added log with id ${result._id}`);                    
                    }
                });
        });        
    },

    updateLightingStatus: function (lighting, callback) {
        return new Promise((resolve, reject) => { 
            const dbConnect = dbo.getDbLighting();
            const filter = { _id: lighting._id };
            const update = { "status.light" : false }

            dbConnect
                .findOneAndUpdate(filter, update, (err, result) => {
                    if (err) {
                        reject('error guys');
                    } else {                        
                        //store to problem logs
                        this.storeProblemLog(lighting, callback).then(result => {
                            console.log(result)
                        }).catch(err => {
                            console.log(err)
                        })
                        resolve('lighting status updated')                        
                    }
                });
        });        
    },
    
    storeProblemLog: function(lighting, callback) {
        // action store to the problem logs --> then push notification
        return new Promise((resolve, reject) => {            
            const dbConnect = dbo.getDbProblemLog();
            const matchDocument = {
                lighting: lighting._id,
                problem: 'lighting error',
                timstamp: new Date()
            };

            dbConnect
                .create(matchDocument, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        //send notification
                        this.sendNoification({
                            title: lighting.name,
                            body: 'light error',
                            link: 'https://www.google.com/',
                            icon: "https://maxst.icons8.com/vue-static/landings/page-index/products/logo/generatedPhotos.png"
                        })
                        resolve(`Added problem log with id ${result._id}`);                    
                    }
                });
        });
    },

    getAllLightingLog: function(callback) {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbLightingLog();
            dbConnect
            .find({ })
            .populate('lighting')
            .then(result => {
                let filter = result.filter(result => result.lighting !== null)
                this.getAllLighting(filter, callback)
            })
            .catch(() => {
                reject('Error fetching listings!');
            })            
        })
    },

    getAllLighting: function(lightingLog, callback) {
        return new Promise((resolve, reject) => {
            const dbConnect = dbo.getDbLighting();
            dbConnect
            .find({})   
            .then(result => {
                callback({ lightingLog, lighting: result })
            })
            .catch(() => {
                reject('Error fetching listings!');
            })            
        })
    }
}