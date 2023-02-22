require('dotenv').config({ path: './config.env' })
const express = require('express')
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const route = require('./routes')
const db = require('./config/db')
const errorHandler = require('./middleware/error')

// setup route middlewares
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
    },
})

// create express app
const app = express()
app.use(cors())

// Connect DB
db.connect()

app.use(express.json())

// parse cookies
// we need this because "cookie" is true in csrfProtection
app.use(cookieParser())

app.use(csrfProtection)
app.get('/getCSRFToken', (req, res) => {
    res.json({ CSRFToken: req.csrfToken() })
})

// Routes init
route(app)

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '/public')))

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'))
    })
} else {
    app.get('/', (req, res, next) => {
        res.send('Api running')
    })
}

// Error Handler Middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => console.log(`Sever running on port ${PORT}`))

process.on('unhandledRejection', (err, promise) => {
    console.log(`Logged Error: ${err.message}`)
    server.close(() => process.exit(1))
})
