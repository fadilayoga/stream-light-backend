const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dbo = require('../db/conn');

router.post('/register', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        const dbConnect = dbo.UserModel();
        const matchDocument = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            age: req.body.age,
            role: req.body.role,
            gender: req.body.gender
        };
        const result = await dbConnect.create(matchDocument)
        const {
            password,
            ...data
        } = await result.toJSON()
        res.send(data)
    } catch (err) {
        res.status(201).json({
            error: 'error when adding user'
        })
    }
})

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
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        res.send({
            message: 'success'
        })
    } catch (err) {
        if (err) {
            res.status(err.status).json({
                message: err.message
            })
        } else {
            res.status(201).json('error login')
        }
    }
})

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
        res.send(data)
    } catch (err) {
        res.status(401).json({
            message: 'unauthenticated'
        })
    }
})

router.get('/logout', async (req, res) => {
    res.cookie('token', '', {
        maxAge: 0
    })
    res.send({
        message: 'success'
    })
})

module.exports = router