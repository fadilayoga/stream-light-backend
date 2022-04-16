const express = require('express')
const router = express.Router()
const { runvalidation, validationForm } = require('../validation')
const { authorization } = require('../validation/auth')
const {
  emailExist,
  getAllUser,
  getOneUser,
  updateUser,
  deleteUser,
  createUserHandler,
  validRole,
} = require('../controllers/users')
const {
  upload,
  fileTypeErrorHandler,
  fileSizeLimitErrorHandler,
  fileUploadHandler,
  fileUploadErrorhandler,
} = require('../controllers/fileUpload')

//get
router.get('/', authorization, runvalidation, getAllUser)

//get-one
router.get('/:id', getOneUser, (req, res) => {
  res.send(res.user)
})

//post
const handler = [
  authorization,
  runvalidation,
  validRole,
  upload.single('file'),
  fileTypeErrorHandler,
  fileSizeLimitErrorHandler,
  validationForm,
  runvalidation,
  emailExist,
  fileUploadHandler,
  fileUploadErrorhandler,
  createUserHandler,
]
router.post('/', handler)

//patch
router.patch('/:id', getOneUser, updateUser)

//delete
router.delete('/:id', getOneUser, deleteUser)

module.exports = router
