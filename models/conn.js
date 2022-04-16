require('dotenv').config({ path: './config.env' })
const mongoose = require('mongoose')

const token = new mongoose.Schema({
  registration_ids: String,
  last_modified: {
    type: Date,
    default: () => Date.now(),
  },
})

const lighting = new mongoose.Schema({
  name: String,
  status: Object,
})

const lightingLog = new mongoose.Schema({
  lighting: {
    type: mongoose.Schema.ObjectId,
    ref: 'lighting',
  },
  ldr: Number,
  location: Object,
  timestamp: {
    type: Date,
    default: () => Date.now(),
  },
})

const problemLog = new mongoose.Schema({
  lighting: mongoose.Schema.ObjectId,
  log: {
    type: mongoose.Schema.ObjectId,
    ref: 'lighting_log',
  },
  problem: String,
  solvedId: {
    type: mongoose.Schema.ObjectId,
    default: null,
  },
  timestamp: {
    type: Date,
    default: () => Date.now(),
  },
})

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: null,
  },
})

const dbModelRegistrationIds = mongoose.model('registration_ids', token)
const dbModelLighting = mongoose.model('lighting', lighting)
const dbModelLightingLog = mongoose.model('lighting_log', lightingLog)
const dbModelProblemLog = mongoose.model('problem_log', problemLog)
const dbModelUserSchema = mongoose.model('user', usersSchema)

module.exports = {
  connectToServer: function (callback) {
    mongoose
      .connect(process.env.ATLAS_URI, {
        dbName: 'lighting',
        heartbeatFrequencyMS: 1000,
        serverSelectionTimeoutMS: 15000,
      })
      .then(() => {
        console.log('connected to the server')
        return callback()
      })
      .catch((error) => {
        return callback(error)
      })
  },

  getDbRegistrationIds: function () {
    return dbModelRegistrationIds
  },

  getDbLighting: function () {
    return dbModelLighting
  },

  getDbLightingLog: function () {
    return dbModelLightingLog
  },

  getDbProblemLog: function () {
    return dbModelProblemLog
  },
  UserModel: function () {
    return dbModelUserSchema
  },
}
