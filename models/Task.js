const CryptoJS = require('crypto-js')
const mongoose = require('mongoose')
const slug = require('mongoose-slug-generator')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Task = new Schema(
    {
        project_id: { type: Schema.Types.ObjectId, ref: 'Project' },
        title: { type: String, required: [true, "Please provide a task's title"] },
        description: { type: String, default: 'Not started' },
        condition: { type: String },
        location: { type: String },
        dueAt: { type: String },
        // dueAt: { type: String, required: [true, 'Please provide the due date'] },
        slug: { type: String, slug: 'title', unique: true },
    },
    {
        timestamps: true,
    },
)

// Add plugin
mongoose.plugin(slug)
Task.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: true,
})

module.exports = mongoose.model('Task', Task)
