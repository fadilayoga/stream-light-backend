const multer = require('multer')
const dbo = require('../db/conn')
const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

const fileFilter = function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

    if (!allowedTypes.includes(file.mimetype)) {
        req.fileValidationError = "Only images are allowed";
        return cb(null, false, req.fileValidationError);
    }

    cb(null, true)
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

exports.upload = multer({
    fileFilter,
    storage: storage,
    limits: {
        fileSize: 2 * 1000 * 1000
    },
})

exports.getUser = async function (req, res, next) {
    let user
    try {
        user = await dbo.UserModel().findById(req.params.id).select('-password')
        if (user == null) {
            return res.status(404).json({
                message: 'cannot find user'
            })
        }
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
    res.user = user
    next()
}

exports.fileSizeLimitErrorHandler = function (err, req, res, next) {
    if (err) {
        return res.status(413).json({
            error: err
        })
    }
    next()
}

exports.fileTypeErrorHandler = function (req, res, next) {
    if (req.fileValidationError) {
        return res.status(422).json({
            error: req.fileValidationError
        });
    }
    next()
}

exports.fileUploadHandler = async function (req, res, next) {
    if (req.file) {
        try {
            await sharp(req.file.path)
                .resize(300)
                .flatten({
                    background: {
                        r: 255,
                        g: 255,
                        b: 255
                    }
                })
                .toFile(`./static/${req.file.filename}.webp`)
        } catch (err) {
            return res.status(422).json({
                err: 'unable to open for write'
            })
        }
    }
    next()
}

exports.fileUploadErrorhandler = async function (req, res, next) {
    if (req.file) {
        try {
            let files = await fs.readdir(req.file.destination)
            let count = 0
            for (const file of files) {
                await fs.unlink(path.join(req.file.destination, file))
                count++
                if (count == files.length) {
                    req.staticFile = `${req.protocol}://${req.get('host')}/static/${req.file.filename}.webp`
                    next()
                }
            }
        } catch (err) {
            return res.status(422).json({
                err: err
            })
        }
    } else {
        next()
    }
}