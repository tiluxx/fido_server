const express = require('express')
const router = express.Router()

const { register, login, isLogin, logout, forgotpassword, resetpassword, verifyEmail } = require('../controllers/auth')

router.route('/register').post(register)
router.route('/user/verify/:userId/:verifyToken').post(verifyEmail)
router.route('/login').post(login)
router.route('/me').post(isLogin)
router.route('/logout').post(logout)
router.route('/forgotpassword').post(forgotpassword)
router.route('/resetpassword/:resetToken').put(resetpassword)

module.exports = router
