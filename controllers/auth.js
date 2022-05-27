const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dbo = require('../models/conn')

async function login(req, res, next) {
  let res_token
  let res_user
  try {
    const dbConnect = dbo.UserModel()
    const user = await dbConnect.findOne({
      email: req.body.email,
    })
    if (!user) {
      throw {
        status: 404,
        message: {
          error: 'login',
          message: 'user not found',
        },
      }
    }
    if (!(await bcrypt.compare(req.body.password, user.password))) {
      throw {
        status: 403,
        message: {
          error: 'login',
          message: 'invalid credential',
        },
      }
    }
    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret'
    )
    res_token = token
    res_user = user
  } catch (err) {
    if (err) {
      return res.status(err.status).send(err.message)
    } else {
      return res.status(500).send({ error: 'login', message: 'error login' })
    }
  }
  res.token = res_token
  res.user = res_user
  next()
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
