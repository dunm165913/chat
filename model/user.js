let mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    username: {
        type: String
    },
    password: {
        type: String
    },
    friend: {
      type:Array
    }

})
module.exports = mongoose.model('user', userSchema);