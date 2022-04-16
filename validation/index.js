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

const runvalidationWithres = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(404).json({
      error: errors.errors[0].param,
      message: errors.errors[0].msg,
    })
  }
  res.json(req.data)
}

const validationForm = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 5 })
    .withMessage('Min Length 5'),

  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid')
    .normalizeEmail()
    .withMessage('Email is invalid'),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 5 }),

  check('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 10, max: 100 })
    .withMessage('Numbers must be integers in the range 10 to 100'),

  check('role', 'Role is required')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['Superadmin', 'Admin'])
    .withMessage('Role is invalid'),

  check('gender', 'Gender is required')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Woman', 'Man'])
    .withMessage('Gender is invalid'),
]

module.exports = {
  runvalidation,
  runvalidationWithres,
  validationForm,
}
