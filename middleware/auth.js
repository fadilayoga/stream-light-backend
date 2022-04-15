const { cookie } = require('express-validator')
const dbo = require('../db/conn')
const jwt = require('jsonwebtoken')

exports.authorization = [
    cookie('token')
    .custom(async (cookie, { req }) => {    
        if(!cookie) {
            throw new Error('Unauthenticated')
        }
        let userRole
        try {            
            const dbConnect = dbo.UserModel();
            const claims = jwt.verify(cookie, 'secret')
            if (!claims) {
                throw 'Unauthenticated'
            }
            const user = await dbConnect.findOne({ _id: claims._id })
            const { password, role, ...data } = await user.toJSON()
            userRole = role        
        } catch (err) {
            throw new Error(err)
        }
        req.role = userRole
    })
]