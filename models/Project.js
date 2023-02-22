const CryptoJS = require('crypto-js')
const mongoose = require('mongoose')
const slug = require('mongoose-slug-generator')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const BoardDetail = new Schema({
    board_id: { type: String },
    title: { type: String },
    taskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
})

const Board = new Schema({
    'not-started': { type: BoardDetail },
    'in-progress': { type: BoardDetail },
    done: { type: BoardDetail },
})

const Project = new Schema(
    {
        name: { type: String, required: [true, "Please provide a project's name"] },
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
        isDone: { type: Boolean },
        boards: { type: Board },
        boardOrder: [{ type: String }],
        slug: { type: String, slug: 'name', unique: true },
    },
    {
        timestamps: true,
    },
)

// Add plugin
mongoose.plugin(slug)
Project.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: true,
})

module.exports = mongoose.model('Project', Project)
