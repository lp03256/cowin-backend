const mongoose = require('mongoose');


const cardSchema = mongoose.Schema({
    email: String,
    pinCode: String
})

module.exports = mongoose.model('cowin', cardSchema);
