const CryptoJS = require('crypto-js')
const fns = require('date-fns')
const ObjectId = require('mongodb').ObjectId
const Task = require('../models/Task')
const Project = require('../models/Project')
const ErrorResponse = require('../utils/errorResponse')

class TaskController {
    // [GET] /tasks/get
    show(req, res, next) {
        Task.find({ project_id: req.query.projectId })
            .then((tasks) => {
                const decryptedTasks = tasks.map((task) => {
                    let bytes = CryptoJS.AES.decrypt(task.title, process.env.SECRET_KEY)
                    task.title = bytes.toString(CryptoJS.enc.Utf8)

                    bytes = CryptoJS.AES.decrypt(task.description, process.env.SECRET_KEY)
                    task.description = bytes.toString(CryptoJS.enc.Utf8)

                    bytes = CryptoJS.AES.decrypt(task.location, process.env.SECRET_KEY)
                    task.location = bytes.toString(CryptoJS.enc.Utf8)

                    bytes = CryptoJS.AES.decrypt(task.dueAt, process.env.SECRET_KEY)
                    task.dueAt = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
                    return task
                })
                return decryptedTasks
            })
            .then((decryptedTasks) =>
                res.status(200).json({
                    tasks: decryptedTasks,
                }),
            )
            .catch(next)
    }

    // [GET] /tasks/upComingDue
    showupComingDue(req, res, next) {
        Task.find({ project_id: req.query.projectId })
            .then((tasks) => {
                tasks = tasks.filter((task, index) => {
                    const bytes = CryptoJS.AES.decrypt(task.dueAt, process.env.SECRET_KEY)
                    const dueDate = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
                    return (
                        task.condition !== 'Done' &&
                        (fns.isToday(fns.parseISO(dueDate)) || fns.isTomorrow(fns.parseISO(dueDate)))
                    )
                })

                const decryptedTasks = tasks.map((task) => {
                    let bytes = CryptoJS.AES.decrypt(task.title, process.env.SECRET_KEY)
                    task.title = bytes.toString(CryptoJS.enc.Utf8)

                    bytes = CryptoJS.AES.decrypt(task.description, process.env.SECRET_KEY)
                    task.description = bytes.toString(CryptoJS.enc.Utf8)

                    bytes = CryptoJS.AES.decrypt(task.location, process.env.SECRET_KEY)
                    task.location = bytes.toString(CryptoJS.enc.Utf8)

                    bytes = CryptoJS.AES.decrypt(task.dueAt, process.env.SECRET_KEY)
                    task.dueAt = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
                    return task
                })
                return decryptedTasks
            })
            .then((decryptedTasks) =>
                res.status(200).json({
                    tasks: decryptedTasks,
                }),
            )
            .catch(next)
    }

    // [POST] /tasks/store
    store(req, res, next) {
        const formData = { ...req.body }
        formData.title = CryptoJS.AES.encrypt(formData.title, process.env.SECRET_KEY).toString()
        if (formData.description) {
            formData.description = CryptoJS.AES.encrypt(formData.description, process.env.SECRET_KEY).toString()
        }
        if (formData.location) {
            formData.location = CryptoJS.AES.encrypt(formData.location, process.env.SECRET_KEY).toString()
        }
        formData.condition = 'Not started'
        formData.dueAt = CryptoJS.AES.encrypt(JSON.stringify(formData.dueAt), process.env.SECRET_KEY).toString()
        const task = new Task(formData)
        task.save()
            .then(async (task) => {
                const project = await Project.findById(task.project_id)
                project.boards['not-started'].taskIds.push(task._id)
                project
                    .save()
                    .then(() => res.status(201).end())
                    .catch(next)
            })
            .catch(next)
    }

    // [PATCH] /tasks/edit
    update(req, res, next) {
        const formData = { ...req.body }
        if (formData.title) {
            formData.title = CryptoJS.AES.encrypt(formData.title, process.env.SECRET_KEY).toString()
        }
        if (formData.description) {
            formData.description = CryptoJS.AES.encrypt(formData.description, process.env.SECRET_KEY).toString()
        }
        if (formData.location) {
            formData.location = CryptoJS.AES.encrypt(formData.location, process.env.SECRET_KEY).toString()
        }
        if (formData.dueAt) {
            const newDate = fns.parse(formData.dueAt, 'yyyy-MM-dd p', new Date()).toISOString()
            formData.dueAt = CryptoJS.AES.encrypt(JSON.stringify(newDate), process.env.SECRET_KEY).toString()
        }
        Task.findByIdAndUpdate(req.query.id, formData, { new: true })
            .then((task) => {
                let bytes = CryptoJS.AES.decrypt(task.title, process.env.SECRET_KEY)
                task.title = bytes.toString(CryptoJS.enc.Utf8)

                bytes = CryptoJS.AES.decrypt(task.description, process.env.SECRET_KEY)
                task.description = bytes.toString(CryptoJS.enc.Utf8)

                bytes = CryptoJS.AES.decrypt(task.location, process.env.SECRET_KEY)
                task.location = bytes.toString(CryptoJS.enc.Utf8)

                bytes = CryptoJS.AES.decrypt(task.dueAt, process.env.SECRET_KEY)
                task.dueAt = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

                return task
            })
            .then((task) => {
                res.status(200).json({ success: true, task })
            })
            .catch(next)
    }

    // [PATCH] /tasks/inDnd/edit
    updateInDnd(req, res, next) {
        const formData = { ...req.body }
        delete formData.title
        delete formData.dueAt
        delete formData.description
        delete formData.location
        Task.findByIdAndUpdate(req.body._id, formData, { new: true })
            .then(() => res.status(200).json({ success: true }))
            .catch(next)
    }

    // [PATCH] /tasks/selectCondition/edit
    updateInSelectCondition(req, res, next) {
        const formData = { ...req.body.newProjectData }
        delete formData.name

        Promise.all([
            Project.findByIdAndUpdate(req.query.projectId, formData, { new: true }),
            Task.findByIdAndUpdate(req.query.id, { condition: req.body.condition }, { new: true }),
        ])
            .then(([project, task]) => {
                let bytes = CryptoJS.AES.decrypt(project.name, process.env.SECRET_KEY)
                project.name = bytes.toString(CryptoJS.enc.Utf8)

                res.status(200).json({ success: true, project })
            })
            .catch(next)
    }

    // [DELETE] /tasks/delete?id
    destroy(req, res, next) {
        Task.delete({ _id: req.query.id })
            .then(async () => {
                const project = await Project.findById(req.query.projectId)

                const taskCondition = req.query.condition
                let board
                let isFound = false
                switch (taskCondition) {
                    case 'Not started':
                        board = 'not-started'
                        isFound = true
                        break
                    case 'In progress':
                        board = 'in-progress'
                        isFound = true
                        break
                    case 'Done':
                        board = 'done'
                        isFound = true
                        break
                    default:
                        next(new ErrorResponse('No valid condition with this task', 404))
                        break
                }

                if (isFound) {
                    const index = project.boards[board].taskIds.indexOf(new ObjectId(req.query.id))
                    if (index > -1) {
                        project.boards[board].taskIds.splice(index, 1)
                        project
                            .save()
                            .then(() => res.status(200).json({ success: true, message: 'Delete successfully' }))
                            .catch(next)
                    } else {
                        next(new ErrorResponse('No valid task with this id', 404))
                    }
                }
            })
            .catch(next)
    }
}

module.exports = new TaskController()
