const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

sharp.cache(false)

function fileFilter(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

  if (!allowedTypes.includes(file.mimetype)) {
    req.fileValidationError = 'Only images are allowed'
    return cb(null, false, req.fileValidationError)
  }

  cb(null, true)
}

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  },
})

const upload = multer({
  fileFilter,
  storage: storage,
  limits: {
    fileSize: 2 * 1000 * 1000,
  },
})

function fileSizeLimitErrorHandler(err, req, res, next) {
  if (err) {
    return res.status(413).json({
      error: err.message,
    })
  }
  next()
}

function fileTypeErrorHandler(req, res, next) {
  if (req.fileValidationError) {
    return res.status(422).json({
      error: req.fileValidationError,
    })
  }
  next()
}

async function fileUploadHandler(req, res, next) {
  if (req.file) {
    try {
      await sharp(req.file.path)
        .resize(300)
        .flatten({
          background: {
            r: 255,
            g: 255,
            b: 255,
          },
        })
        .toFile(`./static/${req.file.filename}.webp`)
    } catch (err) {
      return res.status(422).json({
        err: 'ufilename .webpfor write',
      })
    }
  }
  next()
}

async function clearAllProfilePicture(req, res, next) {
  if (req.file) {
    try {
      let files = await fs.readdir(req.file.destination)
      let count = 0
      for (const file of files) {
        await fs.unlink(path.join(req.file.destination, file))
        count++
        if (count == files.length) {
          req.staticFile = `${req.file.filename}.webp`
          next()
        }
      }
    } catch (err) {
      return res.status(422).json({
        err: err,
      })
    }
  } else {
    next()
  }
}

const clearOneProfilePicture = async (req, res, next) => {
  try {
    await fs.unlink(path.join('./static/', req.deletedFile))
  } catch (err) {
    if (err.errno == -4058) {
      return res.json({ message: 'No file exist calm :)' })
    }
    return res.status(500).json(err)
  }
  res.json(res.user)
}

module.exports = {
  upload,
  fileTypeErrorHandler,
  fileSizeLimitErrorHandler,
  fileUploadHandler,
  clearAllProfilePicture,
  clearOneProfilePicture,
}
