const express = require('express')
const router = express.Router()

const projectController = require('../controllers/ProjectController')
const { protect } = require('../middleware/auth')

router.post('/store', protect, projectController.store)
router.patch('/edit/:slug', protect, projectController.update)
router.patch('/inDnd/edit/:slug', protect, projectController.updateInDnd)
router.patch('/project_done/:slug', protect, projectController.updateProjectDone)
router.patch('/restore/:slug', protect, projectController.restore)
router.delete('/delete/:slug', protect, projectController.destroy)
router.delete('/forceDelete/:slug', protect, projectController.forceDestroy)
router.get('/:slug', protect, projectController.show)

module.exports = router
