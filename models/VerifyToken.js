const crypto = require('crypto')
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const VerifyTokenSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String },
    expireDate: { type: Date },
})

VerifyTokenSchema.methods.getVerifyToken = function () {
    const verifyToken = crypto.randomBytes(20).toString('hex')

    this.token = crypto.createHash('sha256').update(verifyToken).digest('hex')
    this.expireDate = Date.now() + 10 * (60 * 1000)

    return verifyToken
}

const VerifyToken = mongoose.model('Verifytoken', VerifyTokenSchema)

module.exports = VerifyToken
