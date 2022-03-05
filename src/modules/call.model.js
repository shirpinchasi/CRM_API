const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require('moment');
require('dotenv').config({ path: '.env' });
const autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection(process.env.DB_URL);

autoIncrement.initialize(connection);

var Calls = new Schema({
    CallId: {
        type: Number,
    },
    system: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    assignee: {
        type: String
    },
    team: {
        type: String,
        ref: "Team"
    },
    status: {
        type: String,
        default: () => "Open"
    },
    description: {
        type: String
    },
    openingDate: {
        type: String,
        default: () => moment().format("d/MM/YYYY, hh:mm:ss a")
    },
    picture: {
        data: Buffer,
        contentType: String,
        type: Object,
        default: () => moment().format("d/MM/YYYY, hh:mm:ss a")

    }
});

Calls.plugin(autoIncrement.plugin, {
    model: 'Calls',
    field: 'CallId',
    startAt: 1
});
var Call = connection.model("Call", Calls)
module.exports = Call