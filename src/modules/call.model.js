const mongoose = require("mongoose");
const config = require("../env/config")
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection(config.dbUrl);
 
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