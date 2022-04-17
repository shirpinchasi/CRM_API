const mongoose = require("mongoose");
const {Schema} = mongoose;
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
        required: true,
        ref: "System"
    },
    userName: {
        type: String,
        required: true
    },
    assignee: {
        type: String,
        ref: "User"
    },
    team: {
        type: String,
        ref: "Team"
    },
    User: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        default: () => "Open"
    },
    description: {
        type: String,
        required: true
    },
    openingDate: {
        type: String,
        default: () => moment().format("D/MM/YYYY, hh:mm:ss a")
    },
    lastUpdater: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    picture: {
        data: Buffer,
        contentType: String,
        type: Object,
        default: () => moment().format("D/MM/YYYY, hh:mm:ss a")

    }
});

Calls.plugin(autoIncrement.plugin, {
    model: 'Calls',
    field: 'CallId',
    startAt: 1
});
var Call = connection.model("Calls", Calls)
module.exports = Call