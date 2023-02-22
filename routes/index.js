const authRouter = require('./auth')
const refreshTokenRouter = require('./refreshToken')
const privateRouter = require('./private')
const projectRouter = require('./projects')
const taskRouter = require('./tasks')

function route(app) {
    app.use('/api/auth', authRouter)
    app.use('/api/refreshToken', refreshTokenRouter)
    app.use('/api/private', privateRouter)
    app.use('/projects', projectRouter)
    app.use('/tasks', taskRouter)
}

module.exports = route
