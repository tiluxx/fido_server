const mongoose = require('mongoose')

async function connect() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('MongoDB connected')
    } catch (error) {
        console.log('MongoDB connect failed')
    }
}

module.exports = { connect }
