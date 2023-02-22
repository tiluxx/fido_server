const express = require('express')
const router = express.Router()
const WorkspaceController = require('../controllers/WorkspaceController')
const { protect } = require('../middleware/auth')

router.route('/workspace/deletedProjectsList/:username').get(protect, WorkspaceController.getDeletedProjects)
router.route('/workspace/archiveProject/:username').get(protect, WorkspaceController.getArchivedProjects)
router.route('/workspace/:username').get(protect, WorkspaceController.getPrivateData)

module.exports = router
