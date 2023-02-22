const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserTokenSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String },
})

const UserToken = mongoose.model('Usertoken', UserTokenSchema)

module.exports = UserToken
