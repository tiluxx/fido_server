const jwt = require('jsonwebtoken')
const UserToken = require('../models/UserToken')

const verifyRefreshToken = (refreshToken) => {
    const privateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY

    return new Promise((resolve, reject) => {
        UserToken.findOne({ token: refreshToken }, (err, doc) => {
            if (!doc) {
                return reject({ success: false, message: 'Invalid refresh token' })
            }

            jwt.verify(refreshToken, privateKey, (err, tokenDetails) => {
                if (err) {
                    return reject({ success: false, message: 'Invalid refresh token' })
                }
                resolve({
                    success: true,
                    tokenDetails,
                    message: 'Valid refresh token',
                })
            })
        })
    })
}

module.exports = verifyRefreshToken
