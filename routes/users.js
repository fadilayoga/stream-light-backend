const express = require('express')
const router = express.Router()
const {
  runvalidation,
  runvalidationAuth,
  validationForm,
  validationFormPasswordOptional,
} = require('../validation')
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
router.get('/', authorization, runvalidationAuth, validRole, getAllUser)

//get-one
router.get(
  '/:id',
  authorization,
  runvalidationAuth,
  validRole,
  getOneUser,
  (req, res) => {
    res.send(res.user)
  }
)

//post
const handler = [
  authorization,
  runvalidationAuth,
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
  runvalidationAuth,
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
  runvalidationAuth,
  validRole,
  getOneUser,
  deleteUser,
  clearOneProfilePicture
)

//delete-user-profile
router.delete(
  '/picture/:id',
  authorization,
  runvalidationAuth,
  validRole,
  getOneUser,
  deleteProfilePicture,
  clearOneProfilePicture
)

module.exports = router
