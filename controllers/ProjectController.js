const CryptoJS = require('crypto-js')
const slug = require('mongoose-slug-generator')
const Project = require('../models/Project')
const Task = require('../models/Task')

class ProjectController {
    // [GET] /projects/:slug
    show(req, res, next) {
        Project.findOne({ _id: req.query.id })
            .then((project) => {
                let bytes = CryptoJS.AES.decrypt(project.name, process.env.SECRET_KEY)
                project.name = bytes.toString(CryptoJS.enc.Utf8)
                res.status(200).json({
                    project,
                })
            })
            .catch(next)
    }

    // [POST] /projects/store
    store(req, res, next) {
        const formData = { ...req.body }
        formData.name = CryptoJS.AES.encrypt(req.body.name, process.env.SECRET_KEY).toString()
        formData.isDone = false
        formData.boards = {
            'not-started': {
                board_id: 'not-started',
                title: 'Not started',
                taskIds: [],
            },
            'in-progress': {
                board_id: 'in-progress',
                title: 'In progress',
                taskIds: [],
            },
            done: { board_id: 'done', title: 'Done', taskIds: [] },
        }
        formData.boardOrder = ['not-started', 'in-progress', 'done']
        const project = new Project(formData)
        project
            .save()
            .then(() => res.status(201).json({ success: true, slug: project.slug, projectId: project._id }))
            .catch(next)
    }

    // [PATCH] /projects/edit/:slug
    update(req, res, next) {
        let decryptedName = CryptoJS.AES.encrypt(req.body.name, process.env.SECRET_KEY).toString()
        Project.findByIdAndUpdate(
            req.body.project_id,
            {
                name: decryptedName,
            },
            { new: true },
        )
            .then((project) => res.status(200).json({ success: true, slug: project.slug }))
            .catch(next)
    }

    // [PATCH] /projects/inDnd/edit/:slug
    updateInDnd(req, res, next) {
        const formData = { ...req.body }
        delete formData.name
        Project.findByIdAndUpdate(req.body._id, formData, { new: true })
            .then(() => res.status(200).end())
            .catch(next)
    }

    // [PATCH] /projects/project_done/:slug
    updateProjectDone(req, res, next) {
        Project.findByIdAndUpdate(req.query.id, { isDone: true }, { new: true })
            .then(() => res.status(200).end())
            .catch(next)
    }

    // [DELETE] /projects/delete/:slug/delete
    destroy(req, res, next) {
        Promise.all([
            Project.findByIdAndUpdate(req.query.id, { isDone: false }, { new: true }),
            Project.delete({ _id: req.query.id }),
        ])
            .then(() => {
                Task.delete({ project_id: req.query.id })
            })
            .then(() => res.status(200).json({ success: true, message: 'Delete successfully' }))
            .catch(next)
    }

    // [DELETE] /projects/forceDelete/:slug
    forceDestroy(req, res, next) {
        Project.deleteOne({ _id: req.query.id })
            .then(() => res.status(200).json({ success: true, message: 'Delete permanently' }))
            .catch(next)
    }

    // [PATCH] /projects/restore/:slug
    restore(req, res, next) {
        Promise.all([
            Project.findByIdAndUpdate(req.query.id, { isDone: false }, { new: true }),
            Project.restore({ _id: req.query.id }),
        ])
            .then(() => res.status(200).json({ success: true, message: 'Restore successfully' }))
            .catch(next)
    }
}

module.exports = new ProjectController()
