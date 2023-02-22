const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const slug = require('mongoose-slug-generator')
const UserToken = require('./UserToken')

const PASSWORD_REGEX = /^(?=[^A-Z\s]*[A-Z])(?=[^a-z\s]*[a-z])(?=[^\d\s]*\d)(?=\w*[\W_])\S{8,}$/
const EMAIL_REGEX =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

// Add plugin
mongoose.plugin(slug)

const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, 'Please provide a username'],
        },
        email: {
            type: String,
            required: [true, 'Please provide a email'],
            unique: true,
            match: [EMAIL_REGEX, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 8,
            match: [PASSWORD_REGEX, 'Please provide a valid password'],
            select: false,
        },
        active: { type: Boolean, default: false },
        slug: { type: String, slug: 'username', unique: true },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true,
    },
)

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

UserSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.getSignedJwtToken = async function () {
    const accessToken = jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
    const refreshToken = jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_PRIVATE_KEY, { expiresIn: '30d' })

    const userToken = await UserToken.findOne({ userId: this._id })
    if (userToken) await userToken.remove()
    await new UserToken({ user_id: this._id, token: refreshToken }).save()

    return Promise.resolve({ accessToken, refreshToken })
}

UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex')

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000)

    return resetToken
}

const User = mongoose.model('User', UserSchema)

module.exports = User
