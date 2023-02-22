const jwt = require('jsonwebtoken')
const express = require('express')
const router = express.Router()

const verifyRefreshToken = require('../utils/verifyRefreshToken')

router.post('/user/getNewAccessToken', async (req, res, next) => {
    verifyRefreshToken(req.cookies.refreshToken)
        .then(({ tokenDetails }) => {
            const accessToken = jwt.sign({ id: tokenDetails.id }, process.env.JWT_SECRET, { expiresIn: '10min' })
            res.cookie('authToken', accessToken, { expires: new Date(Date.now() + 600000), httpOnly: true })

            res.status(200).json({
                success: true,
                message: 'Access token created successfully',
            })
        })
        .catch((err) => next(err))
})

module.exports = router
