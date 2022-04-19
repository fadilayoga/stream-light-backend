const express = require('express')
const router = express.Router()
const { runvalidation, validationForm, validationFormPasswordOptional } = require('../validation')
const { authorization } = require('../validation/auth')
const {
  emailExist,
  emailExistOtherUser,
  getAllUser,
  getOneUser,
  updateUser,
  deleteProfilePicture,
  deleteUser,
  createUserHandler,
  validRole,
} = require('../controllers/users')
const {
  upload,
  fileTypeErrorHandler,
  fileSizeLimitErrorHandler,
  fileUploadHandler,
  clearAllProfilePicture,
  clearOneProfilePicture,
} = require('../controllers/fileUpload')

//get
router.get('/', authorization, runvalidation, validRole, getAllUser)

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
  clearAllProfilePicture,
  createUserHandler,
]
router.post('/', handler)

//patch
router.patch(
  '/:id',
  authorization,
  runvalidation,
  validRole,
  upload.single('file'),
  fileTypeErrorHandler,
  fileSizeLimitErrorHandler,
  validationFormPasswordOptional,
  runvalidation,
  emailExistOtherUser,
  fileUploadHandler,
  clearAllProfilePicture,
  getOneUser,
  updateUser,
  clearOneProfilePicture
)

//delete
router.delete(
  '/:id',
  authorization,
  runvalidation,
  validRole,
  getOneUser,
  deleteUser
)

//delete-user-profile
router.delete(
  '/picture/:id',
  authorization,
  runvalidation,
  validRole,
  getOneUser,
  deleteProfilePicture,
  clearOneProfilePicture
)

module.exports = router
