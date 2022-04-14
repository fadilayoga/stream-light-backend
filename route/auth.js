const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dbo = require('../db/conn');

//login
router.post('/login', async (req, res) => {
    try {
        const dbConnect = dbo.UserModel();
        const user = await dbConnect.findOne({
            email: req.body.email
        })
        if (!user) {
            throw ({
                status: 404,
                message: 'user not found'
            })
        }
        if (!await bcrypt.compare(req.body.password, user.password)) {
            throw ({
                status: 400,
                message: 'invalid credential'
            })
        }
        const token = jwt.sign({
            _id: user._id
        }, 'secret')
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day        
        })
        res.send({
            message: 'success'
        })
    } catch (err) {
        if (err) {
            res.status(err.status).send(err.message)
        } else {
            res.status(201).send('error login')
        }
    }
})

//authenticate
router.get('/authenticate', async (req, res) => {
    try {
        const dbConnect = dbo.UserModel();
        const cookie = req.cookies['token']
        const claims = jwt.verify(cookie, 'secret')
        if (!claims) {
            throw ('')
        }
        const user = await dbConnect.findOne({
            _id: claims._id
        })
        const {
            password,
            ...data
        } = await user.toJSON()
        res.send(data).end()
    } catch (err) {
        res.status(401).json({
            message: 'unauthenticated'
        }).end()
    }
})

//logout
router.get('/logout', async (req, res) => {
    res.cookie('token', '', {
        maxAge: 0
    })
    res.send({
        message: 'success'
    })
})

module.exports = router