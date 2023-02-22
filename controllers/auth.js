const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const UserToken = require('../models/UserToken')
const VerifyToken = require('../models/VerifyToken')
const ErrorResponse = require('../utils/errorResponse')
const sendEmail = require('../utils/sendEmail')

exports.register = async (req, res, next) => {
    const { username, email, password } = req.body

    const preUser = await User.findOne({ email: email, active: true })
    if (preUser) {
        return next(new ErrorResponse('User with given email already exist!', 400))
    }

    try {
        const user = await User.create({
            username,
            email,
            password,
        })

        const verifyToken = await new VerifyToken({
            user_id: user._id,
        }).save()
        const token = verifyToken.getVerifyToken()
        await verifyToken.save()

        const resetUrl = `http://localhost:3000/user/verify/${user._id}/${token}`
        const message = `
            <h3>Hello, ${username}</h3>
            <p>Please go to this link to verify your email address</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `
        await sendEmail({
            to: user.email,
            subject: 'Verify your email for FIDO',
            text: message,
        })

        res.status(200).json({ success: 'pending', message: 'An email sent to your account please verify' })
    } catch (err) {
        next(err)
    }
}

exports.verifyEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.userId })
        if (!user) {
            return next(new ErrorResponse('Invalid link'), 400)
        }

        const preVerifyToken = crypto.createHash('sha256').update(req.params.verifyToken).digest('hex')
        const verifyToken = await VerifyToken.findOne({
            user_id: user._id,
            token: preVerifyToken,
            expireDate: { $gt: Date.now() },
        })
        if (!verifyToken) {
            return next(new ErrorResponse('Invalid link'), 400)
        }

        await User.updateOne({ _id: req.params.userId }, { $set: { active: true } })
        await VerifyToken.findByIdAndRemove(verifyToken._id)

        sendToken(user, 200, res, 'Email verified successfully')
    } catch (error) {
        next(new ErrorResponse('An error occurred', 400))
    }
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorResponse('Please provide email and password', 400))
    }

    try {
        const user = await User.findOne({ email, active: true }).select('+password')

        if (!user) {
            const inactiveUser = await User.findOne({ email, active: false }).select('+password')

            if (inactiveUser) {
                const isMatch = await inactiveUser.matchPassword(password)
                if (isMatch) {
                    const verifyToken = await new VerifyToken({
                        user_id: inactiveUser._id,
                    }).save()
                    const token = verifyToken.getVerifyToken()
                    await verifyToken.save()

                    const resetUrl = `http://localhost:3000/user/verify/${inactiveUser._id}/${token}`
                    const message = `
                        <h3>Hello, ${inactiveUser.username}</h3>
                        <p>Please go to this link to verify your email address</p>
                        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
                    `
                    await sendEmail({
                        to: inactiveUser.email,
                        subject: 'Verify your email for FIDO',
                        text: message,
                    })

                    return res.status(200).json({
                        success: 'pending',
                        message:
                            "Because you've verified your email yet, an email sent to your account. Please verify!",
                    })
                } else {
                    return next(new ErrorResponse('Invalid credentials', 401))
                }
            } else {
                return next(new ErrorResponse('Invalid credentials', 401))
            }
        }

        const isMatch = await user.matchPassword(password)

        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401))
        }

        sendToken(user, 200, res, 'Login successfully')
    } catch (err) {
        next(err)
    }
}

exports.isLogin = async (req, res, next) => {
    if (req.cookies.authToken) {
        try {
            const token = req.cookies.authToken

            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            const user = await User.findById(decoded.id)

            if (!user) {
                return next(new ErrorResponse('No user found with this id', 404))
            }

            res.status(200).json({ isLogin: true, slug: user.slug })
        } catch (err) {
            return next(new ErrorResponse('Not authorized to access this route', 401))
        }
    } else {
        res.status(401).json({ isLogin: false })
    }
    res.end()
}

exports.logout = async (req, res, next) => {
    const userToken = await UserToken.findOne({ token: req.cookies.refreshToken })
    if (!userToken) {
        if (req.cookies.authToken) {
            res.clearCookie('authToken', { httpOnly: true })
        }
        return res.status(200).json({ success: true, message: 'Logged Out Successfully' })
    }

    await userToken.remove()
    res.clearCookie('refreshToken', {
        httpOnly: true,
        path: '/api/refreshToken/user/getNewAccessToken',
    })
    if (req.cookies.authToken) {
        res.clearCookie('authToken', { httpOnly: true })
    }

    res.status(200).json({ error: false, message: 'Logged Out Successfully' })
}

exports.forgotpassword = async (req, res, next) => {
    const { email } = req.body

    try {
        const user = await User.findOne({ email, active: true })

        if (!user) {
            return next(new ErrorResponse('Email could not be sent', 404))
        }

        const resetToken = user.getResetPasswordToken()

        await user.save()

        const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                text: message,
            })

            res.status(200).json({ success: true, message: 'Email Sent' })
        } catch (error) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined

            await user.save()

            return next(new ErrorResponse('Email could not be sent', 500))
        }
    } catch (err) {
        next(err)
    }
}

exports.resetpassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex')

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        })

        if (!user) {
            return next(new ErrorResponse('Invalid Reset Token'), 400)
        }

        user.password = req.body.password
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save()

        sendToken(user, 201, res, 'Password Reset Success')
    } catch (err) {
        next(err)
    }
}

const sendToken = async (user, statusCode, res, message) => {
    const { accessToken, refreshToken } = await user.getSignedJwtToken()
    res.cookie('authToken', accessToken, { expires: new Date(Date.now() + 600000), httpOnly: true })
    res.cookie('refreshToken', refreshToken, {
        expires: new Date(Date.now() + 30 * 24 * 3600000),
        httpOnly: true,
        path: '/api/refreshToken/user/getNewAccessToken',
    })
    res.status(statusCode).json({
        success: true,
        message,
        slug: user.slug,
    })
}
