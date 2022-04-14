const express = require('express');
const router = express.Router()
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const dbo = require('../db/conn');

const fileFilter = function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

    if (!allowedTypes.includes(file.mimetype)) {
        req.fileValidationError = "Only images are allowed";
        return cb(null, false, req.fileValidationError);
    }

    cb(null, true)
}

const upload = multer({
    dest: "./uploads/",
    fileFilter,
    limits: {
        fileSize: 300000
    },
})

const handler = [fileTypeErrorHandler, fileSizeLimitErrorHandler, fileExistHandler]
router.post('/', upload.single("file"), handler, async (req, res) => {
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
            .toFile(`./static/${req.file.originalname}`)

        fs.unlink(req.file.path, () => {
            res.json({
                file: `${req.protocol}://${req.get('host')}/static/${req.file.originalname}`
            })
        })
    } catch (err) {
        res.status(422).json({
            err
        })
    }
})

function fileSizeLimitErrorHandler(err, req, res, next) {
    if (err) {
        res.status(413).json({
            error: err
        })
    } else {
        next()
    }
}

function fileTypeErrorHandler(req, res, next) {
    if (req.fileValidationError) {
        res.status(422).json({
            error: req.fileValidationError
        });
    } else {
        next()
    }
}

async function fileExistHandler(req, res, next) {
    if (!req.file) {
        try {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(req.body.password, salt)
            const dbConnect = dbo.UserModel();
            const matchDocument = {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                age: req.body.age,
                role: req.body.role,
                gender: req.body.gender
            };
            const result = await dbConnect.create(matchDocument)
            const {
                password,
                ...data
            } = await result.toJSON()
            res.send(data)
        } catch (err) {
            res.status(201).json({
                error: 'error when adding user'
            })
        }
    } else {
        next()
    }
}

module.exports = router