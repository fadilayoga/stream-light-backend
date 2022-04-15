const multer = require('multer')
const dbo = require('../db/conn')
const sharp = require('sharp')
const fs = require('fs')
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
        //req.body is empty...
        //How could I get the new_file_name property sent from client here?
        cb(null, file.originalname.replace(/[^0-9a-zA-Z.]/g, '-'));
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
        user = await dbo.UserModel().findById(req.params.id)
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
        res.status(413).json({
            error: err
        })
    } else {
        next()
    }
}

exports.fileTypeErrorHandler = function (req, res, next) {
    if (req.fileValidationError) {
        res.status(422).json({
            error: req.fileValidationError
        });
    } else {
        next()
    }
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
                .toFile(`./static/${req.file.filename}`)
                .then(() => {
                    fs.readdir(req.file.destination, (err, files) => {
                        if (err) throw err;

                        // let count = files.length
                        for (const file of files) {
                            fs.unlink(path.join(req.file.destination, file), err => {
                                if (err) throw err;
                                // count++
                            });
                            // if (count == files.length) {
                            //     req.staticFile = `${req.protocol}://${req.get('host')}/static/${req.file.filename}`                                
                            // }
                        }
                    });
                })
                .catch(err => {
                    throw 'Error storing image'
                })
        } catch (err) {
            res.status(422).json({
                err
            })
        }
        req.staticFile = `${req.protocol}://${req.get('host')}/static/${req.file.filename}`                                
    }
    next()
}