const CryptoJS = require('crypto-js')
const Project = require('../models/Project')

class WorkspaceController {
    // [GET] /workspace/:username
    getPrivateData = (req, res, next) => {
        const currUserId = req.user._id
        Project.find()
            .populate({ path: '_id', match: { _id: currUserId } })
            .then((projects) => {
                const userProjects = projects.filter((project) => project.user_id.equals(currUserId) && !project.isDone)
                return userProjects
            })
            .then((userProjects) => {
                const decryptedProjects = userProjects.map((project) => {
                    const bytes = CryptoJS.AES.decrypt(project.name, process.env.SECRET_KEY)
                    project.name = bytes.toString(CryptoJS.enc.Utf8)
                    return project
                })
                return decryptedProjects
            })
            .then((decryptedProjects) => {
                res.status(200).json({
                    success: true,
                    data: 'You got access to the private data in this route',
                    user_id: req.user._id,
                    user_name: req.user.username,
                    projects: decryptedProjects,
                })
            })
            .catch((error) => {
                next(error)
            })
    }

    // [GET] /workspace/deletedProjectsList
    getDeletedProjects(req, res, next) {
        Project.findDeleted({ user_id: req.query.id })
            .then((projects) => {
                const decryptedProjects = projects.map((project) => {
                    const bytes = CryptoJS.AES.decrypt(project.name, process.env.SECRET_KEY)
                    project.name = bytes.toString(CryptoJS.enc.Utf8)
                    return project
                })
                return decryptedProjects
            })
            .then((decryptedProjects) =>
                res.status(200).json({
                    success: true,
                    projects: decryptedProjects,
                }),
            )
            .catch(next)
    }

    // [GET] /workspace/archiveProject
    getArchivedProjects(req, res, next) {
        Project.find({ user_id: req.query.id, isDone: true })
            .then((projects) => {
                const decryptedProjects = projects.map((project) => {
                    const bytes = CryptoJS.AES.decrypt(project.name, process.env.SECRET_KEY)
                    project.name = bytes.toString(CryptoJS.enc.Utf8)
                    return project
                })
                return decryptedProjects
            })
            .then((decryptedProjects) =>
                res.status(200).json({
                    success: true,
                    projects: decryptedProjects,
                }),
            )
            .catch(next)
    }
}

module.exports = new WorkspaceController()
