const dbo = require('../models/conn')
const bcrypt = require('bcryptjs')

async function getAllUser(req, res, next) {
  try {
    const users = await dbo.UserModel().find().select('-password')
    res.json(users)
  } catch (err) {
    res.status(500).json({
      message: err.message,
    })
  }
}

async function getOneUser(req, res, next) {
  let user
  try {
    user = await dbo.UserModel().findById(req.params.id).select('-password')
    if (user == null) {
      return res.status(404).json({
        message: 'cannot find user',
      })
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    })
  }
  res.user = user
  next()
}

async function createUserHandler(req, res, next) {
  try {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    const dbConnect = dbo.UserModel()
    const matchDocument = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      age: req.body.age,
      role: req.body.role,
      gender: req.body.gender,
      profilePicture: req.staticFile ? req.staticFile : null,
    }
    const result = await dbConnect.create(matchDocument)
    const { password, ...data } = await result.toJSON()
    res.send(data)
  } catch (err) {
    res.status(400).json(err)
  }
}

async function updateUser(req, res, next) {
  if (req.body.name != null) {
    res.user.name = req.body.name
  }
  if (req.body.email != null) {
    req.user.email = req.body.email
  }
  if (req.body.password != null) {
    req.user.password = req.body.password
  }
  if (req.body.age != null) {
    req.user.age = req.body.age
  }
  if (req.body.role != null) {
    req.user.role = req.body.role
  }
  if (req.body.gender != null) {
    req.user.gender = req.body.gender
  }

  try {
    const updateUser = await res.user.save()
    res.json(updateUser)
  } catch (err) {
    res.status(400).json({
      message: err.message,
    })
  }
}

async function deleteUser(req, res, next) {
  try {
    await res.user.deleteOne()
    res.json({
      message: 'Deleted User',
    })
  } catch (err) {
    res.status(500).json({
      message: err.message,
    })
  }
}

const emailExist = async (req, res, next) => {
  try {
    const dbConnect = dbo.UserModel()
    const user = await dbConnect.findOne({ email: req.body.email })
    if (user) {
      res.status(400).json({
        error: 'Email',
        message: 'Email already exist',
      })
    } else {
      next()
    }
  } catch (err) {
    res.status(500).json(err)
  }
}

const validRole = async (req, res, next) => {
  if (req.data.role !== 'Superadmin') {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

module.exports = {
  emailExist,
  getAllUser,
  getOneUser,
  updateUser,
  deleteUser,
  createUserHandler,
  validRole,
}
