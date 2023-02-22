const jwt = require('jsonwebtoken')
const User = require('../models/User')
const ErrorResponse = require('../utils/errorResponse')

exports.protect = async (req, res, next) => {
    const token = req.cookies.authToken

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401))
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.id)

        if (!user) {
            return next(new ErrorResponse('No user found with this id', 404))
        }

        req.user = user

        next()
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401))
    }
}
