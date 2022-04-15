const dbo = require('../db/conn')

exports.emailExist = async (req, res, next) => {
    try {
        const dbConnect = dbo.UserModel();
        const user = await dbConnect.findOne({ email: req.body.email })        
        if(user){
            res.status(400).json({ 
                error: "Email",
                message: 'Email already exist'
            })
        } else {
            next()
        }
    } catch (err) {
        res.status(500).json(err)
    }
}