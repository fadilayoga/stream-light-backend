const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const dbo = require('../db/conn');

//get
router.get('/', async (req, res) => {
    try {
        const users = await dbo.UserModel().find().select('-password')
        res.json(users)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

//getOne
router.get('/:id', getUser, async (req, res) => {
    res.send(res.user)
})

//create
router.post('/', async (req, res) => {
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

//update
router.patch('/:id', getUser, async (req, res) => {
    if(req.body.name != null){
        res.user.name = req.body.name
    }
    if(req.body.email != null){
        req.user.email = req.body.email
    }
    if(req.body.password != null){
        req.user.password = req.body.password
    }
    if(req.body.age != null){
        req.user.age = req.body.age
    }
    if(req.body.role != null){
        req.user.role = req.body.role
    }
    if(req.body.gender != null){
        req.user.gender = req.body.gender
    }

    try {
        const updateUser = await res.user.save()
        res.json(updateUser)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

//delete
router.delete('/:id', getUser, async (req, res) => {
    try {
        await res.user.deleteOne()
        res.json({ message: 'Deleted User'})
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

async function getUser(req, res, next) {
    let user
    try {
        user = await dbo.UserModel().findById(req.params.id)        
        if(user == null) {
            return res.status(404).json({ message: 'cannot find user' })
        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
    res.user = user
    next()
}

module.exports = router