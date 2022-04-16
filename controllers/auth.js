const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dbo = require('../models/conn')

async function login(req, res, next) {
  try {
    const dbConnect = dbo.UserModel()
    const user = await dbConnect.findOne({
      email: req.body.email,
    })
    if (!user) {
      throw {
        status: 404,
        message: 'user not found',
      }
    }
    if (!(await bcrypt.compare(req.body.password, user.password))) {
      throw {
        status: 400,
        message: 'invalid credential',
      }
    }
    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret'
    )
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    res.send({
      message: 'success',
    })
  } catch (err) {
    if (err) {
      res.status(err.status).send(err.message)
    } else {
      res.status(201).send('error login')
    }
  }
}

async function logout(req, res, next) {
  try {
    res.cookie('token', '', {
      maxAge: 0,
    })
    res.send({
      message: 'success',
    })
  } catch (err) {
    res.status(500).json({ err })
  }
}

module.exports = {
  login,
  logout,
}
