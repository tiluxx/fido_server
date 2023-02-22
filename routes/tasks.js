const express = require('express')
const router = express.Router()

const taskController = require('../controllers/TaskController')
const { protect } = require('../middleware/auth')

router.post('/store', protect, taskController.store)
router.patch('/inDnd/edit', protect, taskController.updateInDnd)
router.patch('/selectCondition/edit', protect, taskController.updateInSelectCondition)
router.patch('/edit', protect, taskController.update)
router.delete('/delete', protect, taskController.destroy)
router.get('/upComingDue', protect, taskController.showupComingDue)
router.get('/get', protect, taskController.show)

module.exports = router
