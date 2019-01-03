let mongoose = require('mongoose');

let conversationSchema = mongoose.Schema({
    id: {
        type: Array
    },
    conversation: {
        type: Array
    }
})
module.exports = mongoose.model('conversation', conversationSchema);