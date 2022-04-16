const { cookie } = require('express-validator')
const dbo = require('../models/conn')
const jwt = require('jsonwebtoken')

const authorization = [
  cookie('token').custom(async (cookie, { req }) => {
    if (!cookie) {
      throw new Error('Unauthenticated')
    }
    let userData
    try {
      const dbConnect = dbo.UserModel()
      const claims = jwt.verify(cookie, 'secret')
      if (!claims) {
        throw 'Unauthenticated'
      }
      const user = await dbConnect.findOne({ _id: claims._id })
      if (!user) {
        throw 'User not Found'
      }
      const { password, ...data } = await user.toJSON()
      userData = data
    } catch (err) {
      throw new Error(err)
    }
    req.data = userData
  }),
]

module.exports = { authorization }
