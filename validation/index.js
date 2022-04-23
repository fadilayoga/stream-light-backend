const { check, validationResult } = require('express-validator')

const runvalidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(404).json({
      error: errors.errors[0].param,
      message: errors.errors[0].msg,
    })
  }
  next()
}

const runvalidationAuth = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    if (errors.errors[0].msg == 'Unauthenticated') {
      return res.status(403).json({
        error: errors.errors[0].param,
        message: errors.errors[0].msg,
      })
    } else if (errors.errors[0].msg == 'User not Found') {
      return res.status(404).json({
        error: errors.errors[0].param,
        message: errors.errors[0].msg,
      })
    } else {
      return res.status(500).json({
        error: errors.errors[0].param,
        message: errors.errors[0].msg,
      })
    }
  }
  next()
}

const runvalidationWithres = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    if (errors.errors[0].msg == 'Unauthenticated') {
      return res.status(403).json({
        error: errors.errors[0].param,
        message: errors.errors[0].msg,
      })
    } else if (errors.errors[0].msg == 'User not Found') {
      return res.status(404).json({
        error: errors.errors[0].param,
        message: errors.errors[0].msg,
      })
    } else {
      return res.status(500).json({
        error: errors.errors[0].param,
        message: errors.errors[0].msg,
      })
    }
  }
  res.json(req.data)
}

const validationForm = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a String')
    .isLength({ min: 5 })
    .withMessage('Min Length 5'),

  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email is invalid'),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .trim()
    .notEmpty()
    .withMessage('White space only not allowed')
    .isLength({ min: 5 })
    .withMessage('Password min length 5'),

  check('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 10, max: 100 })
    .withMessage('Numbers must be integers in the range 10 to 100'),

  check('role', 'Role is required')
    .notEmpty()
    .withMessage('Role is required')
    .isString()
    .withMessage('Role must be a String')
    .isIn(['superadmin', 'admin'])
    .withMessage('Role does contain invalid value'),

  check('gender', 'Gender is required')
    .notEmpty()
    .withMessage('Gender is required')
    .isString()
    .withMessage('Gender must be a String')
    .isIn(['woman', 'man'])
    .withMessage('Gender does contain invalid value'),
]
const validationFormPasswordOptional = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a String')
    .isLength({ min: 5 })
    .withMessage('Name min length 5'),

  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email is invalid'),

  check('password')
    .optional({
      nullable: true,
    })
    .trim()
    .notEmpty()
    .withMessage('Empty string or whitespace only not allowed')
    .isLength({ min: 5 })
    .withMessage('Password min length 5'),

  check('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 10, max: 100 })
    .withMessage('Numbers must be integers in the range 10 to 100'),

  check('role', 'Role is required')
    .notEmpty()
    .withMessage('Role is required')
    .isString()
    .withMessage('Role must be a String')
    .isIn(['superadmin', 'admin'])
    .withMessage('Role does contain invalid value'),

  check('gender', 'Gender is required')
    .notEmpty()
    .withMessage('Gender is required')
    .isString()
    .withMessage('Gender must be a String')
    .isIn(['woman', 'man'])
    .withMessage('Gender does contain invalid value'),
]

module.exports = {
  runvalidation,
  runvalidationAuth,
  runvalidationWithres,
  validationForm,
  validationFormPasswordOptional,
}
