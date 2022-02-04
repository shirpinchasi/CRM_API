const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('dotenv').config({ path: '.env' });
const autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection(process.env.DB_URL);
 
autoIncrement.initialize(connection);

var Calls = new Schema({
    _id : {
        type : Number
    },
    system: {
        type: String
    },
    userName: {
        type: String
    },
    goremMetapel: {
        type: String
    },
    team: {
        type: String
    },
    status: {
        type: String
    },
    description: {
        type: String
    },
    openingDate: {
        type: Date,
        default: () => new Date()
    }
});

Calls.plugin(autoIncrement.plugin, {
    model: 'Calls',
    field: '_id',
    startAt : 1
});
var Call = connection.model("Call", Calls)
module.exports = Call